/**
 * 碰撞检测模块
 * Collision Module
 * 
 * 负责卡牌之间的碰撞检测和自动分开
 * Handles collision detection and automatic separation between cards
 */

import type { CardStack, GameCard } from '@/game/types'
import { gameConfig } from '@/config/game'
import { STACK_OFFSET } from './StackModule'

/** 卡牌碰撞盒 / Card bounding box */
export interface CardBounds {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * 碰撞检测模块
 * Collision Module
 */
export class CollisionModule {
  /** 卡牌宽度 / Card width */
  private readonly cardWidth = gameConfig.card.width
  
  /** 卡牌高度 / Card height */
  private readonly cardHeight = gameConfig.card.height
  
  /** 分开时的最小间距 / Minimum spacing when separating */
  private readonly spacing = 10
  
  /**
   * 获取卡牌的碰撞盒
   * Get card bounding box
   * 
   * 注意：卡牌使用 CSS bottom 定位，所以：
   * Note: Cards use CSS bottom positioning, so:
   * - card.y 是 CSS bottom 值
   * - card.y is CSS bottom value
   * - top = bottom + height
   */
  getCardBounds(card: GameCard): CardBounds {
    return {
      left: card.x,
      right: card.x + this.cardWidth,
      bottom: card.y,  // CSS bottom
      top: card.y + this.cardHeight  // CSS top = bottom + height
    }
  }
  
  /**
   * 获取堆叠的碰撞盒（考虑堆叠高度）
   * Get stack bounding box (considering stack height)
   * 
   * 堆叠有多张卡牌时，视觉范围向下延伸
   * When stack has multiple cards, visual bounds extend downward
   * - 顶层卡牌底边 = bottomCard.y - (stackCount - 1) * STACK_OFFSET
   * - 底层卡牌顶边 = bottomCard.y + cardHeight
   */
  getStackBounds(stack: CardStack): CardBounds {
    if (stack.cards.length === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 }
    }
    
    const bottomCard = stack.cards[0]
    const stackCount = stack.cards.length
    
    // X 轴边界 / X-axis bounds
    const left = bottomCard.x
    const right = bottomCard.x + this.cardWidth
    
    // Y 轴边界（CSS bottom 坐标系）
    // Y-axis bounds (CSS bottom coordinate system)
    // bottom = 顶层卡牌底边（视觉最下方）/ bottom = top card's bottom (visually lowest)
    // top = 底层卡牌顶边（视觉最上方）/ top = bottom card's top (visually highest)
    const bottom = bottomCard.y - (stackCount - 1) * STACK_OFFSET
    const top = bottomCard.y + this.cardHeight
    
    return { left, right, top, bottom }
  }
  
  /**
   * 检测两个碰撞盒是否重叠
   * Check if two bounding boxes overlap
   * 
   * 注意：CSS bottom 坐标系中，值越大位置越靠上（视觉上）
   * Note: In CSS bottom coordinate system, larger values are visually higher
   * - bottom 值越大，元素越靠上 / Larger bottom value = visually higher
   * - top 值越大，元素顶部越靠上 / Larger top value = top is visually higher
   */
  checkBoundsOverlap(a: CardBounds, b: CardBounds): boolean {
    // 不重叠的条件：
    // No overlap conditions:
    // 1. a 在 b 上方：a.bottom >= b.top（a 的底部在 b 的顶部之上）
    //    a is above b: a's bottom is above b's top
    // 2. a 在 b 下方：a.top <= b.bottom（a 的顶部在 b 的底部之下）
    //    a is below b: a's top is below b's bottom
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom >= b.top ||  // a 在 b 上方 / a is above b
      a.top <= b.bottom     // a 在 b 下方 / a is below b
    )
  }
  
  /**
   * 检测卡牌是否与现有堆叠碰撞
   * Check if a card collides with existing stacks
   */
  checkCardCollision(card: GameCard, stacks: CardStack[], excludeStackId?: string): boolean {
    const cardBounds = this.getCardBounds(card)
    
    for (const stack of stacks) {
      // 排除指定的堆叠
      // Exclude specified stack
      if (excludeStackId && stack.id === excludeStackId) continue
      
      const stackBounds = this.getStackBounds(stack)
      if (this.checkBoundsOverlap(cardBounds, stackBounds)) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * 查找最近的空闲位置
   * Find nearest free position
   * 
   * @param x 起始 X 坐标 / Starting X coordinate
   * @param y 起始 Y 坐标 / Starting Y coordinate
   * @param stacks 现有堆叠 / Existing stacks
   * @param excludeStackId 排除的堆叠 ID / Excluded stack ID
   * @returns 空闲位置坐标 / Free position coordinates
   */
  findNearestFreePosition(x: number, y: number, stacks: CardStack[], excludeStackId?: string): { x: number, y: number } {
    // 创建临时卡牌用于检测
    // Create temporary card for detection
    const tempCard: GameCard = {
      id: 'temp',
      typeId: 'material',
      name: 'temp',
      nameKey: 'temp',
      emoji: '📦',
      x,
      y,
      data: {},
      stackId: 'temp'
    }
    
    // 如果当前位置没有碰撞，直接返回
    // If no collision at current position, return directly
    if (!this.checkCardCollision(tempCard, stacks, excludeStackId)) {
      return { x, y }
    }
    
    // 螺旋搜索最近的空闲位置
    // Spiral search for nearest free position
    // X 方向步长使用卡牌宽度，Y 方向步长使用卡牌高度
    // X step uses card width, Y step uses card height
    const stepX = this.cardWidth + this.spacing
    const stepY = this.cardHeight + this.spacing
    const maxRadius = 10  // 最大搜索半径 / Maximum search radius
    
    for (let radius = 1; radius <= maxRadius; radius++) {
      // 获取当前半径的所有位置
      // Get all positions at current radius
      const positions = this.getSpiralPositions(radius, stepX, stepY)
      
      // 找到第一个空闲位置就返回
      // Find first free position and return
      for (const offset of positions) {
        const testX = x + offset.dx
        const testY = y + offset.dy
        
        tempCard.x = testX
        tempCard.y = testY
        
        if (!this.checkCardCollision(tempCard, stacks, excludeStackId)) {
          return { x: testX, y: testY }
        }
      }
    }
    
    // 如果找不到空闲位置，返回随机偏移位置
    // If no free position found, return random offset position
    return {
      x: x + (Math.random() - 0.5) * 200,
      y: y + (Math.random() - 0.5) * 200
    }
  }
  
  /**
   * 获取当前半径的螺旋搜索位置
   * Get spiral search positions for current radius only
   * 
   * 只返回当前半径的位置，不包括之前半径
   * Only return positions at current radius, not including previous radii
   */
  private getSpiralPositions(radius: number, stepX: number, stepY: number): Array<{ dx: number, dy: number }> {
    const positions: Array<{ dx: number, dy: number }> = []
    
    // 当前半径的 4 个基本方向：上、下、左、右
    // 4 basic directions at current radius: up, down, left, right
    const directions = [
      { dx: 0, dy: -stepY * radius },   // 上 / Up
      { dx: 0, dy: stepY * radius },    // 下 / Down
      { dx: -stepX * radius, dy: 0 },  // 左 / Left
      { dx: stepX * radius, dy: 0 }    // 右 / Right
    ]
    
    for (const dir of directions) {
      positions.push({ dx: dir.dx, dy: dir.dy })
    }
    
    // 对角线位置
    // Diagonal positions
    const diagonals = [
      { dx: stepX * radius, dy: -stepY * radius },   // 右上 / Top-right
      { dx: stepX * radius, dy: stepY * radius },    // 右下 / Bottom-right
      { dx: -stepX * radius, dy: -stepY * radius },  // 左上 / Top-left
      { dx: -stepX * radius, dy: stepY * radius }    // 左下 / Bottom-left
    ]
    
    for (const dir of diagonals) {
      positions.push({ dx: dir.dx, dy: dir.dy })
    }
    
    return positions
  }
  
  /**
   * 在指定位置附近生成随机偏移位置
   * Generate random offset position near specified location
   */
  getRandomNearbyPosition(x: number, y: number, range: number = 100): { x: number, y: number } {
    return {
      x: x + (Math.random() - 0.5) * range * 2,
      y: y + (Math.random() - 0.5) * range * 2
    }
  }
  
  /**
   * 自动分开卡牌（确保新卡牌不与现有卡牌重叠）
   * Auto separate cards (ensure new card doesn't overlap with existing cards)
   */
  separateCard(card: GameCard, stacks: CardStack[], excludeStackId?: string): { x: number, y: number } {
    const freePos = this.findNearestFreePosition(card.x, card.y, stacks, excludeStackId)
    return freePos
  }
}
