/**
 * 游戏引擎 - 堆叠管理模块
 * 
 * 负责卡牌堆叠的创建、分离、合并等操作
 * 所有操作都基于世界坐标，不涉及屏幕坐标转换
 */

import { gameConfig } from '@/config/game'
import { canStackTypes } from '@/config/cardTypes'
import type { GameCard, CardStack } from '@/game/types'

/** 堆叠中每张卡牌的垂直偏移量（像素）/ Vertical offset per card in stack (pixels) */
/** 等于名字栏高度 32px，确保堆叠时每张卡牌的名字栏刚好露出 */
/** Equal to name strip height 32px, ensuring each card's name strip is just visible */
export const STACK_OFFSET = 32

/**
 * 堆叠管理模块
 * 
 * 提供堆叠相关的所有操作，包括：
 * - 创建堆叠
 * - 分离堆叠
 * - 合并堆叠
 * - 计算堆叠边界
 */
export class StackModule {
  /** 卡牌宽度 */
  private readonly _cardWidth: number
  
  /** 卡牌高度 */
  private readonly _cardHeight: number
  
  /** 碰撞检测的额外边距 */
  private readonly _hitPadding: number = 20
  
  constructor() {
    this._cardWidth = gameConfig.card.width
    this._cardHeight = gameConfig.card.height
  }
  
  // ========== 堆叠创建 ==========
  
  /**
   * 创建新的卡牌堆叠
   * @param x 世界坐标 X
   * @param y 世界坐标 Y（底层卡牌的 Y 坐标）
   * @param typeId 卡牌类型 ID
   * @param name 卡牌名称
   * @param emoji 卡牌表情
   * @param nameKey i18n key（用于翻译）
   * @returns 新创建的堆叠
   */
  createStack(
    x: number,
    y: number,
    typeId: string,
    name: string,
    emoji: string,
    nameKey?: string
  ): CardStack {
    const stackId = `stack_${Date.now()}`
    const cardId = `card_${Date.now()}`
    
    const card: GameCard = {
      id: cardId,
      typeId,
      name,
      nameKey: nameKey || '',
      emoji,
      x,
      y,
      data: {},
      stackId,
      isAdjusting: false  // 初始化为 false，确保 Vue 可以追踪此属性 / Initialize as false, ensure Vue can track this property
    }
    
    return {
      id: stackId,
      cards: [card]
    }
  }
  
  /**
   * 向堆叠添加新卡牌
   * @param stack 目标堆叠
   * @param typeId 卡牌类型 ID
   * @param name 卡牌名称
   * @param emoji 卡牌表情
   * @param nameKey i18n key（用于翻译）
   * @returns 新创建的卡牌
   */
  addCardToStack(
    stack: CardStack,
    typeId: string,
    name: string,
    emoji: string,
    nameKey?: string
  ): GameCard | null {
    if (stack.cards.length === 0) return null
    
    const bottomCard = stack.cards[0]
    const newCard: GameCard = {
      id: `card_${Date.now()}`,
      typeId,
      name,
      nameKey: nameKey || '',
      emoji,
      x: bottomCard.x,
      y: bottomCard.y,  // 所有卡牌的 Y 相同，渲染偏移由 CSS 处理
      data: {},
      stackId: stack.id
    }
    
    stack.cards.push(newCard)
    return newCard
  }
  
  // ========== 堆叠分离 ==========
  
  /**
   * 从指定索引处分离堆叠
   * 
   * 分离逻辑：
   * - 原堆叠保留索引 0 ~ fromIndex-1 的卡牌
   * - 新堆叠包含索引 fromIndex ~ n-1 的卡牌
   * - 新堆叠的 Y 坐标需要调整，保持视觉位置不变
   * 
   * @param stack 源堆叠
   * @param fromIndex 分离起始索引
   * @returns 新创建的堆叠，如果分离失败返回 null
   */
  separateStack(stack: CardStack, fromIndex: number): CardStack | null {
    // fromIndex 必须大于 0 且小于卡牌数量
    if (fromIndex < 1 || fromIndex >= stack.cards.length) return null
    
    const bottomCard = stack.cards[0]
    
    // 分离的卡牌（从 fromIndex 到末尾）
    const separatedCards = stack.cards.splice(fromIndex)
    
    // 创建新堆叠
    const newStackId = `stack_${Date.now()}`
    const newStack: CardStack = {
      id: newStackId,
      cards: separatedCards
    }
    
    // 计算新堆叠的 Y 坐标
    // 渲染时：bottom = -index * STACK_OFFSET
    // 分离前：原卡牌的视觉位置 = bottomCard.y - fromIndex * STACK_OFFSET
    // 分离后：新堆叠底层卡牌的索引变为 0，bottom = 0
    // 所以：新堆叠的 y = bottomCard.y - fromIndex * STACK_OFFSET
    const newY = bottomCard.y - fromIndex * STACK_OFFSET
    
    // 更新分离卡牌的位置
    for (const card of separatedCards) {
      card.stackId = newStackId
      card.x = bottomCard.x
      card.y = newY
    }
    
    return newStack
  }
  
  // ========== 堆叠合并 ==========
  
  /**
   * 检查两个卡牌是否可以堆叠
   * @param card1 卡牌1
   * @param card2 卡牌2
   * @returns 是否可以堆叠
   */
  canStackCards(card1: GameCard, card2: GameCard): boolean {
    return canStackTypes(card1.typeId, card2.typeId)
  }
  
  /**
   * 合并两个堆叠
   * 
   * 合并逻辑：
   * - 源堆叠的所有卡牌添加到目标堆叠末尾
   * - 所有卡牌的 Y 坐标设置为目标堆叠的 Y 坐标
   * - 渲染偏移由 CSS bottom = -index * STACK_OFFSET 处理
   * 
   * @param sourceStack 源堆叠
   * @param targetStack 目标堆叠
   * @returns 是否合并成功
   */
  mergeStacks(sourceStack: CardStack, targetStack: CardStack): boolean {
    if (sourceStack.id === targetStack.id) return false
    
    const sourceCard = sourceStack.cards[0]
    const targetCard = targetStack.cards[0]
    
    if (!sourceCard || !targetCard) return false
    
    // 检查是否可以堆叠
    if (!this.canStackCards(sourceCard, targetCard)) return false
    
    // 更新源堆叠卡牌的位置和 stackId
    for (const card of sourceStack.cards) {
      card.stackId = targetStack.id
      card.x = targetCard.x
      card.y = targetCard.y
    }
    
    // 将源堆叠的卡牌添加到目标堆叠
    targetStack.cards.push(...sourceStack.cards)
    
    return true
  }
  
  // ========== 堆叠移动 ==========
  
  /**
   * 移动堆叠到指定位置
   * @param stack 目标堆叠
   * @param x 世界坐标 X
   * @param y 世界坐标 Y
   */
  moveStack(stack: CardStack, x: number, y: number): void {
    for (const card of stack.cards) {
      card.x = x
      card.y = y
    }
  }
  
  // ========== 边界计算 ==========
  
  /**
   * 计算堆叠的世界坐标边界
   * 
   * 边界计算：
   * - CSS bottom 定位：卡牌从 bottom 位置向上延伸
   * - 底层卡牌（index=0）：bottom=0，底边在 y，顶边在 y + cardHeight
   * - 顶层卡牌（index=n-1）：bottom=-(n-1)*STACK_OFFSET
   * - 堆叠范围：从顶层卡牌底边到底层卡牌顶边
   * 
   * @param stack 卡牌堆叠
   * @returns 边界 { minX, maxX, minY, maxY }
   */
  getStackBounds(stack: CardStack): { minX: number; maxX: number; minY: number; maxY: number } {
    const bottomCard = stack.cards[0]
    if (!bottomCard) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }
    
    const stackCount = stack.cards.length
    
    // X 轴边界
    const minX = bottomCard.x
    const maxX = bottomCard.x + this._cardWidth
    
    // Y 轴边界
    // 顶层卡牌底边 = bottomCard.y - (stackCount - 1) * STACK_OFFSET
    // 底层卡牌顶边 = bottomCard.y + cardHeight
    const minY = bottomCard.y - (stackCount - 1) * STACK_OFFSET
    const maxY = bottomCard.y + this._cardHeight
    
    return { minX, maxX, minY, maxY }
  }
  
  // ========== 碰撞检测 ==========
  
  /**
   * 检查世界坐标点是否在堆叠范围内
   * @param stack 卡牌堆叠
   * @param worldX 世界坐标 X
   * @param worldY 世界坐标 Y
   * @returns 是否在范围内
   */
  isPointInStack(stack: CardStack, worldX: number, worldY: number): boolean {
    const bounds = this.getStackBounds(stack)
    
    return (
      worldX >= bounds.minX - this._hitPadding &&
      worldX <= bounds.maxX + this._hitPadding &&
      worldY >= bounds.minY - this._hitPadding &&
      worldY <= bounds.maxY + this._hitPadding
    )
  }
  
  /**
   * 在堆叠列表中查找指定位置的堆叠
   * @param stacks 堆叠列表
   * @param worldX 世界坐标 X
   * @param worldY 世界坐标 Y
   * @param excludeId 排除的堆叠 ID
   * @returns 找到的堆叠，如果没有返回 null
   */
  findStackAtPosition(
    stacks: CardStack[],
    worldX: number,
    worldY: number,
    excludeId?: string
  ): CardStack | null {
    for (const stack of stacks) {
      if (excludeId && stack.id === excludeId) continue
      if (this.isPointInStack(stack, worldX, worldY)) {
        return stack
      }
    }
    return null
  }
  
  // ========== 工具方法 ==========
  
  /**
   * 获取堆叠的卡牌数量
   * @param stack 卡牌堆叠
   * @returns 卡牌数量
   */
  getStackCount(stack: CardStack): number {
    return stack.cards.length
  }
  
  /**
   * 获取堆叠的顶层卡牌
   * @param stack 卡牌堆叠
   * @returns 顶层卡牌，如果堆叠为空返回 null
   */
  getTopCard(stack: CardStack): GameCard | null {
    if (stack.cards.length === 0) return null
    return stack.cards[stack.cards.length - 1]
  }
  
  /**
   * 获取堆叠的底层卡牌
   * @param stack 卡牌堆叠
   * @returns 底层卡牌，如果堆叠为空返回 null
   */
  getBottomCard(stack: CardStack): GameCard | null {
    return stack.cards[0] || null
  }
}
