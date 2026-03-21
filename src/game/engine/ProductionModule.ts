/**
 * 生产模块
 * Production Module
 * 
 * 负责建筑的生产逻辑，包括：
 * - 检测建筑是否有单位卡
 * - 启动/停止生产计时器
 * - 产出卡牌
 * 
 * Handles building production logic including:
 * - Detecting if building has unit cards
 * - Starting/stopping production timers
 * - Spawning output cards
 */

import type { CardStack } from '@/game/types'

/** 生产回调参数 / Production callback parameters */
export interface ProductionCallbackParams {
  buildingStack: CardStack
  outputConfig: {
    typeId: string
    nameKey: string
    emoji: string
  }
}

/** 时间模块接口（只包含生产需要的方法）/ Time module interface (only methods needed for production) */
export interface ITimeModule {
  startTimer(id: string, durationMinutes: number, onComplete: () => void): void
  cancelTimer(id: string): void
  getTimerProgress(id: string): number
  getTimer(id: string): { remainingMinutes: number } | undefined
}

/** 碰撞模块接口（只包含生产需要的方法）/ Collision module interface (only methods needed for production) */
export interface ICollisionModule {
  getRandomNearbyPosition(x: number, y: number, range?: number): { x: number, y: number }
  findNearestFreePosition(x: number, y: number, stacks: CardStack[], excludeStackId?: string): { x: number, y: number }
}

/**
 * 生产模块
 * Production Module
 */
export class ProductionModule {
  private getTimeModule: () => ITimeModule
  private getAllStacks: () => CardStack[]
  private createCardCallback: (params: ProductionCallbackParams) => void
  
  constructor(
    getTimeModule: () => ITimeModule,
    _getCollisionModule: () => ICollisionModule,
    getAllStacks: () => CardStack[],
    createCardCallback: (params: ProductionCallbackParams) => void
  ) {
    this.getTimeModule = getTimeModule
    this.getAllStacks = getAllStacks
    this.createCardCallback = createCardCallback
  }
  
  /**
   * 检查堆叠是否是建筑
   * Check if stack is a building
   */
  isBuildingStack(stack: CardStack): boolean {
    if (stack.cards.length === 0) return false
    const bottomCard = stack.cards[0]
    return bottomCard.typeId === 'building' && bottomCard.buildingData !== undefined
  }
  
  /**
   * 检查建筑是否有单位卡
   * Check if building has unit cards
   */
  hasUnitInBuilding(stack: CardStack): boolean {
    if (stack.cards.length <= 1) return false
    // 检查是否有单位卡（第二张卡开始）
    // Check if there are unit cards (starting from second card)
    for (let i = 1; i < stack.cards.length; i++) {
      if (stack.cards[i].typeId === 'unit') {
        return true
      }
    }
    return false
  }
  
  /**
   * 处理堆叠变化
   * Handle stack change
   * 
   * 当卡牌被添加到或从堆叠中移除时调用
   * Called when a card is added to or removed from a stack
   */
  handleStackChange(stack: CardStack): void {
    if (!this.isBuildingStack(stack)) return
    
    const bottomCard = stack.cards[0]
    const buildingData = bottomCard.buildingData
    
    if (!buildingData) return
    
    const hasUnit = this.hasUnitInBuilding(stack)
    
    if (hasUnit) {
      // 有单位，启动生产
      // Has unit, start production
      this.startProduction(stack)
    } else {
      // 没有单位，停止生产
      // No unit, stop production
      this.stopProduction(stack)
    }
  }
  
  /**
   * 启动生产
   * Start production
   */
  private startProduction(stack: CardStack): void {
    if (stack.cards.length === 0) return
    
    const bottomCard = stack.cards[0]
    const buildingData = bottomCard.buildingData
    
    if (!buildingData) return
    
    // 如果已经有计时器在运行，不重复启动
    // If timer is already running, don't restart
    if (buildingData.productionTimerId) return
    
    // 创建计时器 ID
    // Create timer ID
    const timerId = `production_${stack.id}_${Date.now()}`
    buildingData.productionTimerId = timerId
    
    // 启动计时器
    // Start timer
    this.getTimeModule().startTimer(
      timerId,
      buildingData.productionInterval,
      () => this.onProductionComplete(stack)
    )
  }
  
  /**
   * 停止生产
   * Stop production
   */
  private stopProduction(stack: CardStack): void {
    if (stack.cards.length === 0) return
    
    const bottomCard = stack.cards[0]
    const buildingData = bottomCard.buildingData
    
    if (!buildingData || !buildingData.productionTimerId) return
    
    // 取消计时器
    // Cancel timer
    this.getTimeModule().cancelTimer(buildingData.productionTimerId)
    buildingData.productionTimerId = undefined
  }
  
  /**
   * 生产完成回调
   * Production complete callback
   */
  private onProductionComplete(stack: CardStack): void {
    if (stack.cards.length === 0) return
    
    const bottomCard = stack.cards[0]
    const buildingData = bottomCard.buildingData
    
    if (!buildingData) return
    
    // 检查是否还有单位
    // Check if still has unit
    if (!this.hasUnitInBuilding(stack)) {
      buildingData.productionTimerId = undefined
      return
    }
    
    // 产出卡牌
    // Spawn output card
    this.createCardCallback({
      buildingStack: stack,
      outputConfig: {
        typeId: buildingData.outputTypeId,
        nameKey: buildingData.outputNameKey,
        emoji: buildingData.outputEmoji
      }
    })
    
    // 重新启动计时器（循环生产）
    // Restart timer (loop production)
    buildingData.productionTimerId = undefined
    this.startProduction(stack)
  }
  
  /**
   * 获取建筑的生产进度
   * Get building production progress
   */
  getProductionProgress(stack: CardStack): number {
    if (stack.cards.length === 0) return 0
    
    const bottomCard = stack.cards[0]
    const buildingData = bottomCard.buildingData
    
    if (!buildingData || !buildingData.productionTimerId) return 0
    
    return this.getTimeModule().getTimerProgress(buildingData.productionTimerId)
  }
  
  /**
   * 获取建筑的生产剩余时间
   * Get building production remaining time
   */
  getProductionRemaining(stack: CardStack): number {
    if (stack.cards.length === 0) return 0
    
    const bottomCard = stack.cards[0]
    const buildingData = bottomCard.buildingData
    
    if (!buildingData || !buildingData.productionTimerId) return 0
    
    const timer = this.getTimeModule().getTimer(buildingData.productionTimerId)
    return timer?.remainingMinutes ?? 0
  }
  
  /**
   * 初始化所有建筑的生产状态
   * Initialize production state for all buildings
   */
  initializeAllProductions(): void {
    const stacks = this.getAllStacks()
    for (const stack of stacks) {
      if (this.isBuildingStack(stack) && this.hasUnitInBuilding(stack)) {
        this.startProduction(stack)
      }
    }
  }
  
  /**
   * 停止所有生产
   * Stop all productions
   */
  stopAllProductions(): void {
    const stacks = this.getAllStacks()
    for (const stack of stacks) {
      if (this.isBuildingStack(stack)) {
        this.stopProduction(stack)
      }
    }
  }
}
