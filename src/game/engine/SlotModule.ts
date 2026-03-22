/**
 * 游戏引擎 - 槽位管理模块
 * Game Engine - Slot Management Module
 * 
 * 负责槽位的匹配逻辑和卡牌管理
 * Handles slot matching logic and card management
 */

import type { GameCard } from '@/game/types'
import type { 
  SlotDefinition, 
  SlotInstance, 
  SlotMatchRule, 
  SlotMatchResult,
  SlotDragState 
} from '@/game/types/slot'
import type { AspectValues } from '@/game/types/tags'

/**
 * 带标签的卡牌接口
 * Card with tags interface
 * 
 * 扩展 GameCard 后应该具有的标签字段
 * These tag fields should be added after extending GameCard
 */
interface CardWithTags {
  /** 分类标签 / Category tag */
  category?: string
  /** 属性标签 / Attribute tags */
  attributes?: string[]
  /** 方面数值 / Aspect values */
  aspects?: AspectValues
}

/**
 * 槽位管理模块
 * Slot Management Module
 * 
 * 提供槽位匹配和卡牌管理的核心功能
 * Provides core functionality for slot matching and card management
 */
export class SlotModule {
  /** 槽位拖拽状态 / Slot drag state */
  private _dragState: SlotDragState = {
    isDraggingFromSlot: false,
    sourcePanelId: null,
    sourceSlotId: null,
    draggedCard: null,
    targetSlotId: null,
    canDrop: false
  }
  
  // ========== 状态访问 / State Accessors ==========
  
  /** 获取拖拽状态 / Get drag state */
  get dragState(): SlotDragState {
    return { ...this._dragState }
  }
  
  /** 是否正在从槽位拖拽 / Is dragging from slot */
  get isDraggingFromSlot(): boolean {
    return this._dragState.isDraggingFromSlot
  }
  
  // ========== 匹配逻辑 / Matching Logic ==========
  
  /**
   * 检查卡牌是否匹配槽位规则
   * Check if a card matches slot rules
   * 
   * @param card 卡牌数据 / Card data
   * @param rule 匹配规则 / Match rule
   * @returns 匹配结果 / Match result
   */
  matchCard(card: GameCard & CardWithTags, rule: SlotMatchRule): SlotMatchResult {
    const checks: SlotMatchResult['checks'] = {}
    const reasons: string[] = []
    
    // 1. 分类检查 / Category check
    if (rule.category !== undefined) {
      checks.category = this.checkCategory(card, rule.category)
      if (!checks.category) {
        const expected = Array.isArray(rule.category) 
          ? rule.category.join(', ') 
          : rule.category
        reasons.push(`Category mismatch, required: ${expected}, current: ${card.category ?? 'none'}`)
      }
    }
    
    // 2. 必需属性检查 / Required attributes check
    if (rule.requiredAttributes && rule.requiredAttributes.length > 0) {
      checks.requiredAttributes = this.checkRequiredAttributes(card, rule.requiredAttributes)
      if (!checks.requiredAttributes) {
        const missing = rule.requiredAttributes.filter(
          attr => !card.attributes?.includes(attr)
        )
        reasons.push(`Missing required attributes: ${missing.join(', ')}`)
      }
    }
    
    // 3. 排除属性检查 / Excluded attributes check
    if (rule.excludedAttributes && rule.excludedAttributes.length > 0) {
      checks.excludedAttributes = this.checkExcludedAttributes(card, rule.excludedAttributes)
      if (!checks.excludedAttributes) {
        const found = rule.excludedAttributes.filter(
          attr => card.attributes?.includes(attr)
        )
        reasons.push(`Contains excluded attributes: ${found.join(', ')}`)
      }
    }
    
    // 4. 方面数值检查（单卡模式）/ Aspect values check (single card mode)
    if (rule.requiredAspects) {
      checks.requiredAspects = this.checkAspects(card, rule.requiredAspects)
      if (!checks.requiredAspects) {
        const missing = Object.entries(rule.requiredAspects)
          .filter(([aspect, required]) => (card.aspects?.[aspect] ?? 0) < (required ?? 0))
          .map(([aspect, required]) => `${aspect}: ${card.aspects?.[aspect] ?? 0}/${required}`)
        reasons.push(`Insufficient aspect values: ${missing.join(', ')}`)
      }
    }
    
    const matched = Object.values(checks).every(v => v !== false)
    
    return {
      matched,
      reason: matched ? undefined : reasons.join('; '),
      checks
    }
  }
  
  /**
   * 检查多张卡牌是否满足方面值要求
   * Check if multiple cards satisfy aspect requirements
   * 
   * @param cards 卡牌列表 / Card list
   * @param requiredAspects 需要的方面值 / Required aspect values
   * @returns 是否满足 / Whether satisfied
   */
  matchCardsAspects(
    cards: (GameCard & CardWithTags)[], 
    requiredAspects: Partial<AspectValues>
  ): boolean {
    const accumulated = this.accumulateAspects(cards)
    
    for (const [aspect, required] of Object.entries(requiredAspects)) {
      if ((accumulated[aspect] ?? 0) < (required ?? 0)) {
        return false
      }
    }
    
    return true
  }
  
  // ========== 私有检查方法 / Private Check Methods ==========
  
  /**
   * 检查分类
   * Check category
   */
  private checkCategory(card: CardWithTags, required: string | string[]): boolean {
    if (!card.category) return false
    
    if (Array.isArray(required)) {
      return required.includes(card.category)
    }
    
    return card.category === required
  }
  
  /**
   * 检查必需属性
   * Check required attributes
   */
  private checkRequiredAttributes(card: CardWithTags, required: string[]): boolean {
    if (!card.attributes) return required.length === 0
    
    return required.every(attr => card.attributes!.includes(attr))
  }
  
  /**
   * 检查排除属性
   * Check excluded attributes
   */
  private checkExcludedAttributes(card: CardWithTags, excluded: string[]): boolean {
    if (!card.attributes) return true
    
    // 不包含任何排除属性才算通过
    // Pass only if no excluded attributes are present
    return !excluded.some(attr => card.attributes!.includes(attr))
  }
  
  /**
   * 检查方面值
   * Check aspect values
   */
  private checkAspects(card: CardWithTags, required: Partial<AspectValues>): boolean {
    if (!card.aspects) return Object.keys(required).length === 0
    
    for (const [aspect, value] of Object.entries(required)) {
      if ((card.aspects[aspect] ?? 0) < (value ?? 0)) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * 累加多张卡的方面值
   * Accumulate aspect values from multiple cards
   */
  private accumulateAspects(cards: (GameCard & CardWithTags)[]): AspectValues {
    const result: AspectValues = {}
    
    for (const card of cards) {
      if (card.aspects) {
        for (const [aspect, value] of Object.entries(card.aspects)) {
          result[aspect] = (result[aspect] ?? 0) + value
        }
      }
    }
    
    return result
  }
  
  // ========== 槽位实例管理 / Slot Instance Management ==========
  
  /**
   * 创建槽位实例
   * Create slot instance
   * 
   * @param definition 槽位定义 / Slot definition
   * @param panelId 所属面板 ID / Parent panel ID
   * @returns 槽位实例 / Slot instance
   */
  createSlotInstance(definition: SlotDefinition, panelId: string): SlotInstance {
    return {
      definitionId: definition.id,
      panelId,
      cards: [],
      isValid: !definition.required, // 非必需槽位默认有效 / Non-required slots are valid by default
      accumulatedAspects: {}
    }
  }
  
  /**
   * 添加卡牌到槽位
   * Add card to slot
   * 
   * @param slot 槽位实例 / Slot instance
   * @param card 卡牌 / Card
   * @param definition 槽位定义 / Slot definition
   * @returns 是否成功 / Whether successful
   */
  addCardToSlot(
    slot: SlotInstance, 
    card: GameCard & CardWithTags,
    definition: SlotDefinition
  ): boolean {
    // 检查槽位是否已满
    // Check if slot is full
    if (slot.cards.length >= definition.maxCards) {
      return false
    }
    
    // 检查卡牌是否匹配规则
    // Check if card matches rules
    const result = this.matchCard(card, definition.matchRule)
    if (!result.matched) {
      return false
    }
    
    // 添加卡牌
    // Add card
    slot.cards.push(card)
    
    // 更新累积方面值
    // Update accumulated aspects
    slot.accumulatedAspects = this.accumulateAspects(slot.cards as (GameCard & CardWithTags)[])
    
    // 更新有效性
    // Update validity
    slot.isValid = true
    
    return true
  }
  
  /**
   * 从槽位移除卡牌
   * Remove card from slot
   * 
   * @param slot 槽位实例 / Slot instance
   * @param cardId 卡牌 ID / Card ID
   * @returns 被移除的卡牌，如果不存在返回 null / Removed card, or null if not found
   */
  removeCardFromSlot(slot: SlotInstance, cardId: string): GameCard | null {
    const index = slot.cards.findIndex(c => c.id === cardId)
    if (index === -1) return null
    
    const [removed] = slot.cards.splice(index, 1)
    
    // 更新累积方面值
    // Update accumulated aspects
    slot.accumulatedAspects = this.accumulateAspects(slot.cards as (GameCard & CardWithTags)[])
    
    return removed
  }
  
  /**
   * 清空槽位
   * Clear slot
   * 
   * @param slot 槽位实例 / Slot instance
   * @returns 被清空的卡牌列表 / Cleared cards
   */
  clearSlot(slot: SlotInstance): GameCard[] {
    const cards = [...slot.cards]
    slot.cards = []
    slot.accumulatedAspects = {}
    return cards
  }
  
  // ========== 拖拽状态管理 / Drag State Management ==========
  
  /**
   * 开始从槽位拖拽
   * Start dragging from slot
   */
  startDragFromSlot(panelId: string, slotId: string, card: GameCard): void {
    this._dragState = {
      isDraggingFromSlot: true,
      sourcePanelId: panelId,
      sourceSlotId: slotId,
      draggedCard: card,
      targetSlotId: null,
      canDrop: false
    }
  }
  
  /**
   * 更新拖拽目标
   * Update drag target
   */
  updateDragTarget(slotId: string | null, canDrop: boolean): void {
    this._dragState.targetSlotId = slotId
    this._dragState.canDrop = canDrop
  }
  
  /**
   * 结束拖拽
   * End dragging
   */
  endDrag(): void {
    this._dragState = {
      isDraggingFromSlot: false,
      sourcePanelId: null,
      sourceSlotId: null,
      draggedCard: null,
      targetSlotId: null,
      canDrop: false
    }
  }
  
  /**
   * 检查是否可以放置到槽位
   * Check if can drop to slot
   * 
   * @param card 卡牌 / Card
   * @param definition 槽位定义 / Slot definition
   * @param currentCards 槽位当前卡牌 / Current cards in slot
   * @returns 是否可以放置 / Whether can drop
   */
  canDropToSlot(
    card: GameCard & CardWithTags, 
    definition: SlotDefinition,
    currentCards: GameCard[]
  ): boolean {
    // 检查槽位是否已满
    // Check if slot is full
    if (currentCards.length >= definition.maxCards) {
      return false
    }
    
    // 如果是多卡槽位，检查放入后的方面值
    // If multi-card slot, check aspect values after placing
    if (definition.maxCards > 1 && definition.matchRule.requiredAspects) {
      const combinedCards = [...currentCards, card] as (GameCard & CardWithTags)[]
      return this.matchCardsAspects(combinedCards, definition.matchRule.requiredAspects)
    }
    
    // 单卡模式，直接匹配
    // Single card mode, direct match
    return this.matchCard(card, definition.matchRule).matched
  }
}
