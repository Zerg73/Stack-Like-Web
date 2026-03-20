/**
 * 游戏引擎 - 拖拽管理模块
 * 
 * 负责处理卡牌拖拽的完整生命周期：
 * - 开始拖拽
 * - 拖拽移动
 * - 结束拖拽
 * - 分离堆叠
 * - 合并堆叠
 */

import type { CardStack, DragState, DropResult } from '@/game/types'
import { CoordinateModule } from './CoordinateModule'
import { StackModule } from './StackModule'

/**
 * 拖拽状态
 */
export interface DragContext {
  /** 是否正在拖拽 */
  isDragging: boolean
  
  /** 正在拖拽的堆叠 ID */
  draggingStackId: string | null
  
  /** 源堆叠 ID（分离前的原始堆叠） */
  sourceStackId: string | null
  
  /** 拖拽开始的屏幕坐标 */
  startScreenX: number
  startScreenY: number
  
  /** 拖拽开始的世界坐标 */
  startWorldX: number
  startWorldY: number
  
  /** 拖拽的卡牌索引（-1 表示整个堆叠） */
  draggedCardIndex: number
  
  /** 是否是分离操作 */
  isSeparating: boolean
}

/**
 * 拖拽管理模块
 * 
 * 提供拖拽相关的所有操作，统一处理屏幕坐标和世界坐标的转换
 */
export class DragModule {
  /** 坐标模块引用 */
  private _coordinate: CoordinateModule
  
  /** 堆叠模块引用 */
  private _stack: StackModule
  
  /** 当前拖拽上下文 */
  private _context: DragContext = {
    isDragging: false,
    draggingStackId: null,
    sourceStackId: null,
    startScreenX: 0,
    startScreenY: 0,
    startWorldX: 0,
    startWorldY: 0,
    draggedCardIndex: -1,
    isSeparating: false
  }
  
  constructor(coordinate: CoordinateModule, stack: StackModule) {
    this._coordinate = coordinate
    this._stack = stack
  }
  
  // ========== 状态访问 ==========
  
  /** 获取当前拖拽上下文 */
  get context(): DragContext {
    return { ...this._context }
  }
  
  /** 是否正在拖拽 */
  get isDragging(): boolean {
    return this._context.isDragging
  }
  
  /** 当前拖拽的堆叠 ID */
  get draggingStackId(): string | null {
    return this._context.draggingStackId
  }
  
  /** 是否是分离操作 */
  get isSeparating(): boolean {
    return this._context.isSeparating
  }
  
  // ========== 拖拽生命周期 ==========
  
  /**
   * 开始拖拽
   * 
   * 注意：此方法假设堆叠已经分离（如果需要的话）
   * 分离操作应该由调用方（如 gameStore）处理
   * 
   * @param stack 目标堆叠
   * @param cardIndex 拖拽的卡牌索引（-1 表示整个堆叠，目前未使用）
   * @param screenX 屏幕 X 坐标
   * @param screenY 屏幕 Y 坐标
   * @returns 拖拽起始的世界坐标，如果失败返回 null
   */
  startDrag(
    stack: CardStack,
    cardIndex: number,
    screenX: number,
    screenY: number
  ): { x: number; y: number } | null {
    if (stack.cards.length === 0) return null
    
    // 记录拖拽开始状态
    this._context.isDragging = true
    this._context.sourceStackId = stack.id
    this._context.startScreenX = screenX
    this._context.startScreenY = screenY
    this._context.draggedCardIndex = cardIndex
    this._context.draggingStackId = stack.id
    this._context.isSeparating = false
    
    // 获取底层卡牌的世界坐标
    const bottomCard = stack.cards[0]
    this._context.startWorldX = bottomCard.x
    this._context.startWorldY = bottomCard.y
    
    return { x: bottomCard.x, y: bottomCard.y }
  }
  
  /**
   * 计算拖拽移动后的世界坐标
   * 
   * @param currentScreenX 当前屏幕 X 坐标
   * @param currentScreenY 当前屏幕 Y 坐标
   * @returns 新的世界坐标
   */
  calculateDragPosition(
    currentScreenX: number,
    currentScreenY: number
  ): { x: number; y: number } {
    // 计算屏幕坐标增量
    const dx = currentScreenX - this._context.startScreenX
    const dy = currentScreenY - this._context.startScreenY
    
    // 转换为世界坐标增量
    const worldDelta = this._coordinate.screenDeltaToWorldDelta(dx, dy)
    
    // 计算新的世界坐标
    return {
      x: this._context.startWorldX + worldDelta.dx,
      y: this._context.startWorldY + worldDelta.dy
    }
  }
  
  /**
   * 结束拖拽
   * 
   * @param stacks 所有堆叠列表
   * @param currentScreenX 当前屏幕 X 坐标（未使用，保留兼容性）
   * @param currentScreenY 当前屏幕 Y 坐标（未使用，保留兼容性）
   * @returns 放置结果
   */
  endDrag(
    stacks: CardStack[],
    currentScreenX: number,
    currentScreenY: number
  ): DropResult {
    const result: DropResult = {
      type: 'none',
      sourceStackId: this._context.sourceStackId || undefined
    }
    
    if (!this._context.draggingStackId) {
      this.resetContext()
      return result
    }
    
    // 查找拖拽的堆叠
    const draggingStack = stacks.find(s => s.id === this._context.draggingStackId)
    if (!draggingStack) {
      this.resetContext()
      return result
    }
    
    // 使用卡牌当前的世界坐标来判断合并位置
    const bottomCard = draggingStack.cards[0]
    if (!bottomCard) {
      this.resetContext()
      return result
    }
    
    // 查找目标位置的堆叠（排除自己）
    const targetStack = this._stack.findStackAtPosition(
      stacks,
      bottomCard.x,
      bottomCard.y,
      this._context.draggingStackId
    )
    
    // 尝试合并
    if (targetStack) {
      const sourceCard = draggingStack.cards[0]
      const targetCard = targetStack.cards[0]
      
      if (sourceCard && targetCard && this._stack.canStackCards(sourceCard, targetCard)) {
        this._stack.mergeStacks(draggingStack, targetStack)
        result.type = 'merge'
        result.targetStackId = targetStack.id
      }
      // 无法合并时，保持卡牌当前位置不变
    }
    // 没有目标堆叠时，保持卡牌当前位置不变
    
    this.resetContext()
    return result
  }
  
  /**
   * 取消拖拽
   */
  cancelDrag(): void {
    this.resetContext()
  }
  
  /**
   * 重置拖拽上下文
   */
  private resetContext(): void {
    this._context = {
      isDragging: false,
      draggingStackId: null,
      sourceStackId: null,
      startScreenX: 0,
      startScreenY: 0,
      startWorldX: 0,
      startWorldY: 0,
      draggedCardIndex: -1,
      isSeparating: false
    }
  }
  
  // ========== 辅助方法 ==========
  
  /**
   * 获取当前鼠标的世界坐标
   * @param screenX 屏幕 X 坐标
   * @param screenY 屏幕 Y 坐标
   * @returns 世界坐标
   */
  getMouseWorldPosition(screenX: number, screenY: number): { x: number; y: number } {
    return this._coordinate.screenToWorld(screenX, screenY)
  }
  
  /**
   * 查找当前鼠标位置的放置目标
   * 
   * 注意：此方法用于拖拽过程中的视觉反馈，使用鼠标位置判断
   * 而非卡牌位置，因为卡牌位置可能与鼠标有偏移
   * 
   * @param stacks 所有堆叠列表
   * @param screenX 屏幕 X 坐标
   * @param screenY 屏幕 Y 坐标
   * @returns 目标堆叠和是否可放置
   */
  findDropTarget(
    stacks: CardStack[],
    screenX: number,
    screenY: number
  ): { target: CardStack | null; canDrop: boolean } {
    if (!this._context.draggingStackId) {
      return { target: null, canDrop: false }
    }
    
    // 使用卡牌当前位置来判断合并目标（与 endDrag 保持一致）
    const draggingStack = stacks.find(s => s.id === this._context.draggingStackId)
    if (!draggingStack || !draggingStack.cards[0]) {
      return { target: null, canDrop: false }
    }
    
    const bottomCard = draggingStack.cards[0]
    
    const target = this._stack.findStackAtPosition(
      stacks,
      bottomCard.x,
      bottomCard.y,
      this._context.draggingStackId
    )
    
    if (!target) {
      return { target: null, canDrop: false }
    }
    
    const sourceCard = draggingStack.cards[0]
    const targetCard = target.cards[0]
    
    const canDrop = sourceCard && targetCard && this._stack.canStackCards(sourceCard, targetCard)
    
    return { target, canDrop: !!canDrop }
  }
}
