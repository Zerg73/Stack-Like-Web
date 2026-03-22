/**
 * 游戏引擎 - 面板管理模块
 * Game Engine - Panel Management Module
 * 
 * 负责面板的创建、打开、关闭和状态管理
 * Handles panel creation, opening, closing and state management
 */

import type { GameCard } from '@/game/types'
import type { 
  PanelDefinition, 
  PanelInstance,
  PanelEvent,
  PanelEventType
} from '@/game/types/panel'
import type { SlotInstance } from '@/game/types/slot'
import type { RecipeDefinition, RecipeMatchResult } from '@/game/types/recipe'
import type { CardFactory, CardConsumeCallback } from './RecipeModule'
import { SlotModule } from './SlotModule'
import { RecipeModule } from './RecipeModule'

/**
 * 面板管理模块
 * Panel Management Module
 * 
 * 提供面板生命周期管理和槽位协调
 * Provides panel lifecycle management and slot coordination
 */
export class PanelModule {
  /** 槽位管理模块 / Slot management module */
  private _slotModule: SlotModule
  
  /** 配方管理模块 / Recipe management module */
  private _recipeModule: RecipeModule
  
  /** 面板定义映射 / Panel definition map */
  private _panelDefinitions: Map<string, PanelDefinition> = new Map()
  
  /** 打开的面板实例 / Open panel instances */
  private _panels: Map<string, PanelInstance> = new Map()
  
  /** 面板层级顺序 / Panel z-index order */
  private _panelOrder: string[] = []
  
  /** 当前活动面板 ID / Currently active panel ID */
  private _activePanelId: string | null = null
  
  /** 下一个实例 ID / Next instance ID */
  private _nextInstanceId: number = 0
  
  /** 事件监听器 / Event listeners */
  private _eventListeners: Map<PanelEventType, Set<(event: PanelEvent) => void>> = new Map()
  
  constructor(slotModule: SlotModule) {
    this._slotModule = slotModule
    this._recipeModule = new RecipeModule()
  }
  
  // ========== 状态访问 / State Accessors ==========
  
  /** 获取所有打开的面板 / Get all open panels */
  get panels(): Map<string, PanelInstance> {
    return new Map(this._panels)
  }
  
  /** 获取活动面板 ID / Get active panel ID */
  get activePanelId(): string | null {
    return this._activePanelId
  }
  
  /** 获取面板层级顺序 / Get panel z-index order */
  get panelOrder(): string[] {
    return [...this._panelOrder]
  }
  
  // ========== 定义注册 / Definition Registration ==========
  
  /**
   * 注册面板定义
   * Register panel definition
   */
  registerPanelDefinition(definition: PanelDefinition): void {
    this._panelDefinitions.set(definition.id, definition)
  }
  
  /**
   * 批量注册面板定义
   * Register multiple panel definitions
   */
  registerPanelDefinitions(definitions: PanelDefinition[]): void {
    for (const def of definitions) {
      this.registerPanelDefinition(def)
    }
  }
  
  /**
   * 注册配方定义
   * Register recipe definition
   */
  registerRecipeDefinition(definition: RecipeDefinition): void {
    this._recipeModule.registerRecipe(definition)
  }
  
  /**
   * 批量注册配方定义
   * Register multiple recipe definitions
   */
  registerRecipeDefinitions(definitions: RecipeDefinition[]): void {
    this._recipeModule.registerRecipes(definitions)
  }
  
  /**
   * 获取面板定义
   * Get panel definition
   */
  getPanelDefinition(id: string): PanelDefinition | undefined {
    return this._panelDefinitions.get(id)
  }
  
  /**
   * 获取配方定义
   * Get recipe definition
   */
  getRecipeDefinition(id: string): RecipeDefinition | undefined {
    return this._recipeModule.getRecipe(id)
  }
  
  /**
   * 设置卡牌工厂
   * Set card factory
   */
  setCardFactory(factory: CardFactory): void {
    this._recipeModule.setCardFactory(factory)
  }
  
  /**
   * 设置卡牌消耗回调
   * Set card consume callback
   */
  setCardConsumeCallback(callback: CardConsumeCallback): void {
    this._recipeModule.setCardConsumeCallback(callback)
  }
  
  // ========== 面板生命周期 / Panel Lifecycle ==========
  
  /**
   * 打开面板
   * Open panel
   * 
   * @param definitionId 面板定义 ID / Panel definition ID
   * @param position 初始位置（可选）/ Initial position (optional)
   * @returns 面板实例 ID，如果失败返回 null / Panel instance ID, or null if failed
   */
  openPanel(definitionId: string, position?: { x: number; y: number }): string | null {
    const definition = this._panelDefinitions.get(definitionId)
    if (!definition) return null
    
    // 检查是否允许多实例
    // Check if multiple instances are allowed
    if (!definition.allowMultiple) {
      const existing = Array.from(this._panels.values())
        .find(p => p.definitionId === definitionId && p.state === 'open')
      if (existing) {
        // 聚焦到现有面板
        // Focus existing panel
        this.focusPanel(existing.id)
        return existing.id
      }
    }
    
    // 创建面板实例
    // Create panel instance
    const instanceId = `panel_${this._nextInstanceId++}`
    const instance: PanelInstance = {
      id: instanceId,
      definitionId,
      slots: definition.slots.map(slotDef => 
        this._slotModule.createSlotInstance(slotDef, instanceId)
      ),
      outputSlot: definition.outputSlot 
        ? this._slotModule.createSlotInstance(definition.outputSlot, instanceId)
        : undefined,
      state: 'opening',
      position: position ?? this.getDefaultPosition(),
      allRequiredFilled: false,
      canExecute: false
    }
    
    this._panels.set(instanceId, instance)
    this._panelOrder.push(instanceId)
    this._activePanelId = instanceId
    
    // 触发打开事件
    // Trigger open event
    this.emitEvent({
      type: 'open',
      panelId: instanceId,
      timestamp: Date.now()
    })
    
    // 动画完成后更新状态
    // Update state after animation completes
    setTimeout(() => {
      const panel = this._panels.get(instanceId)
      if (panel) {
        panel.state = 'open'
      }
    }, 300)
    
    return instanceId
  }
  
  /**
   * 关闭面板
   * Close panel
   * 
   * @param panelId 面板实例 ID / Panel instance ID
   * @returns 被关闭面板中的所有卡牌 / All cards from closed panel
   */
  closePanel(panelId: string): GameCard[] {
    const panel = this._panels.get(panelId)
    if (!panel) return []
    
    panel.state = 'closing'
    
    // 收集所有卡牌
    // Collect all cards
    const allCards: GameCard[] = []
    
    for (const slot of panel.slots) {
      allCards.push(...slot.cards)
    }
    
    if (panel.outputSlot) {
      allCards.push(...panel.outputSlot.cards)
    }
    
    // 触发关闭事件
    // Trigger close event
    this.emitEvent({
      type: 'close',
      panelId,
      timestamp: Date.now()
    })
    
    // 移除面板
    // Remove panel
    this._panels.delete(panelId)
    this._panelOrder = this._panelOrder.filter(id => id !== panelId)
    
    // 更新活动面板
    // Update active panel
    if (this._activePanelId === panelId) {
      this._activePanelId = this._panelOrder[this._panelOrder.length - 1] ?? null
    }
    
    return allCards
  }
  
  /**
   * 聚焦面板
   * Focus panel
   */
  focusPanel(panelId: string): void {
    if (!this._panels.has(panelId)) return
    
    this._activePanelId = panelId
    
    // 更新层级顺序
    // Update z-index order
    this._panelOrder = this._panelOrder.filter(id => id !== panelId)
    this._panelOrder.push(panelId)
  }
  
  /**
   * 关闭所有面板
   * Close all panels
   * 
   * @returns 所有卡牌 / All cards
   */
  closeAllPanels(): GameCard[] {
    const allCards: GameCard[] = []
    
    for (const panelId of [...this._panels.keys()]) {
      allCards.push(...this.closePanel(panelId))
    }
    
    return allCards
  }
  
  // ========== 槽位操作 / Slot Operations ==========
  
  /**
   * 添加卡牌到槽位
   * Add card to slot
   * 
   * @param panelId 面板实例 ID / Panel instance ID
   * @param slotId 槽位 ID / Slot ID
   * @param card 卡牌 / Card
   * @returns 是否成功 / Whether successful
   */
  addCardToSlot(panelId: string, slotId: string, card: GameCard): boolean {
    const panel = this._panels.get(panelId)
    if (!panel) return false
    
    const definition = this._panelDefinitions.get(panel.definitionId)
    if (!definition) return false
    
    // 查找槽位
    // Find slot
    let slot = panel.slots.find(s => s.definitionId === slotId)
    let slotDef = definition.slots.find(s => s.id === slotId)
    
    // 如果不是输入槽，检查输出槽
    // If not input slot, check output slot
    if (!slot && panel.outputSlot?.definitionId === slotId) {
      slot = panel.outputSlot
      slotDef = definition.outputSlot
    }
    
    if (!slot || !slotDef) return false
    
    // 添加卡牌
    // Add card
    const success = this._slotModule.addCardToSlot(
      slot as SlotInstance & { cards: (GameCard & { category?: string; attributes?: string[]; aspects?: Record<string, number> })[] },
      card as GameCard & { category?: string; attributes?: string[]; aspects?: Record<string, number> },
      slotDef
    )
    
    if (success) {
      // 更新面板状态
      // Update panel state
      this.updatePanelState(panel)
      
      // 触发事件
      // Trigger event
      this.emitEvent({
        type: 'card_enter',
        panelId,
        slotId,
        card: { id: card.id, typeId: card.typeId },
        timestamp: Date.now()
      })
    }
    
    return success
  }
  
  /**
   * 从槽位移除卡牌
   * Remove card from slot
   */
  removeCardFromSlot(panelId: string, slotId: string, cardId: string): GameCard | null {
    const panel = this._panels.get(panelId)
    if (!panel) return null
    
    // 查找槽位
    // Find slot
    let slot = panel.slots.find(s => s.definitionId === slotId)
    if (!slot && panel.outputSlot?.definitionId === slotId) {
      slot = panel.outputSlot
    }
    
    if (!slot) return null
    
    const card = this._slotModule.removeCardFromSlot(slot, cardId)
    
    if (card) {
      // 更新面板状态
      // Update panel state
      this.updatePanelState(panel)
      
      // 触发事件
      // Trigger event
      this.emitEvent({
        type: 'card_leave',
        panelId,
        slotId,
        card: { id: card.id, typeId: card.typeId },
        timestamp: Date.now()
      })
    }
    
    return card
  }
  
  /**
   * 获取槽位实例
   * Get slot instance
   */
  getSlot(panelId: string, slotId: string): SlotInstance | undefined {
    const panel = this._panels.get(panelId)
    if (!panel) return undefined
    
    let slot = panel.slots.find(s => s.definitionId === slotId)
    if (!slot && panel.outputSlot?.definitionId === slotId) {
      slot = panel.outputSlot
    }
    
    return slot
  }
  
  // ========== 配方匹配 / Recipe Matching ==========
  
  /**
   * 检查面板是否匹配配方
   * Check if panel matches any recipe
   */
  checkRecipeMatch(panelId: string): RecipeMatchResult | null {
    const panel = this._panels.get(panelId)
    if (!panel) return null
    
    const definition = this._panelDefinitions.get(panel.definitionId)
    if (!definition) return null
    
    // 使用 RecipeModule 进行匹配
    // Use RecipeModule for matching
    const result = this._recipeModule.matchRecipe(panel, definition)
    
    if (result.matched && result.recipe) {
      panel.matchedRecipe = result.recipe
    } else {
      panel.matchedRecipe = undefined
    }
    
    return result
  }
  
  // ========== 配方执行 / Recipe Execution ==========
  
  /**
   * 开始执行配方
   * Start executing recipe
   */
  startRecipeExecution(panelId: string, gameTime: number): boolean {
    const panel = this._panels.get(panelId)
    if (!panel || !panel.matchedRecipe) return false
    
    const executionId = this._recipeModule.startExecution(panel, panel.matchedRecipe, gameTime)
    if (!executionId) return false
    
    // 触发配方开始事件
    // Trigger recipe start event
    this.emitEvent({
      type: 'recipe_start',
      panelId,
      recipe: { id: panel.matchedRecipe.id },
      timestamp: Date.now()
    })
    
    return true
  }
  
  /**
   * 更新配方执行进度
   * Update recipe execution progress
   */
  updateRecipeExecution(panelId: string, currentTime: number): boolean {
    const panel = this._panels.get(panelId)
    if (!panel) return false
    
    const completed = this._recipeModule.updateExecution(panel, currentTime)
    
    if (completed && panel.matchedRecipe) {
      // 完成配方执行
      // Complete recipe execution
      void this._recipeModule.completeExecution(panel, panel.matchedRecipe)
      
      // 触发配方完成事件
      // Trigger recipe complete event
      this.emitEvent({
        type: 'recipe_complete',
        panelId,
        recipe: { id: panel.matchedRecipe.id },
        timestamp: Date.now()
      })
      
      // 更新面板状态
      // Update panel state
      this.updatePanelState(panel)
      
      return true
    }
    
    return false
  }
  
  /**
   * 取消配方执行
   * Cancel recipe execution
   */
  cancelRecipeExecution(panelId: string): void {
    const panel = this._panels.get(panelId)
    if (!panel) return
    
    this._recipeModule.cancelExecution(panel)
    
    // 触发配方失败事件
    // Trigger recipe fail event
    this.emitEvent({
      type: 'recipe_fail',
      panelId,
      timestamp: Date.now()
    })
  }
  
  // ========== 面板状态更新 / Panel State Update ==========
  
  /**
   * 更新面板状态
   * Update panel state
   */
  private updatePanelState(panel: PanelInstance): void {
    const definition = this._panelDefinitions.get(panel.definitionId)
    if (!definition) return
    
    // 检查所有必需槽位是否已填充
    // Check if all required slots are filled
    panel.allRequiredFilled = definition.slots
      .filter(s => s.required)
      .every(slotDef => {
        const slot = panel.slots.find(s => s.definitionId === slotDef.id)
        return slot && slot.cards.length > 0
      })
    
    // 检查配方匹配
    // Check recipe match
    const matchResult = this.checkRecipeMatch(panel.id)
    panel.canExecute = panel.allRequiredFilled && !!matchResult?.matched
  }
  
  // ========== 辅助方法 / Helper Methods ==========
  
  /**
   * 获取默认位置
   * Get default position
   */
  private getDefaultPosition(): { x: number; y: number } {
    // 基于已打开面板数量计算位置偏移
    // Calculate position offset based on number of open panels
    const offset = this._panels.size * 30
    return {
      x: 100 + offset,
      y: 100 + offset
    }
  }
  
  // ========== 事件系统 / Event System ==========
  
  /**
   * 监听事件
   * Listen to event
   */
  on(eventType: PanelEventType, callback: (event: PanelEvent) => void): () => void {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, new Set())
    }
    
    this._eventListeners.get(eventType)!.add(callback)
    
    // 返回取消监听函数
    // Return unsubscribe function
    return () => {
      this._eventListeners.get(eventType)?.delete(callback)
    }
  }
  
  /**
   * 触发事件
   * Emit event
   */
  private emitEvent(event: PanelEvent): void {
    const listeners = this._eventListeners.get(event.type)
    if (listeners) {
      for (const callback of listeners) {
        callback(event)
      }
    }
  }
  
  // ========== 面板移动 / Panel Movement ==========
  
  /**
   * 移动面板位置
   * Move panel position
   */
  movePanel(panelId: string, x: number, y: number): void {
    const panel = this._panels.get(panelId)
    if (!panel) return
    
    panel.position = { x, y }
  }
}
