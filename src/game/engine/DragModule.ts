/**
 * 游戏引擎 - 拖拽管理模块
 * Game Engine - Drag Management Module
 * 
 * 负责处理卡牌拖拽的完整生命周期：
 * Handles the complete lifecycle of card dragging:
 * - 开始拖拽 / Start dragging
 * - 拖拽移动 / Drag movement
 * - 结束拖拽 / End dragging
 * - 分离堆叠 / Separate stacks
 * - 合并堆叠 / Merge stacks
 */

import type { CardStack, DropResult } from '@/game/types'
import { CoordinateModule } from './CoordinateModule'
import { StackModule } from './StackModule'

/**
 * 拖拽状态
 * Drag context state
 */
export interface DragContext {
  /** 是否正在拖拽 / Whether currently dragging */
  isDragging: boolean
  
  /** 正在拖拽的堆叠 ID / ID of the stack being dragged */
  draggingStackId: string | null
  
  /** 源堆叠 ID（分离前的原始堆叠）/ Source stack ID (before separation) */
  sourceStackId: string | null
  
  /** 拖拽开始的屏幕坐标 / Screen coordinates at drag start */
  startScreenX: number
  startScreenY: number
  
  /** 拖拽开始的世界坐标 / World coordinates at drag start */
  startWorldX: number
  startWorldY: number
  
  /** 拖拽的卡牌索引（-1 表示整个堆叠）/ Card index being dragged (-1 for entire stack) */
  draggedCardIndex: number
  
  /** 是否是分离操作 / Whether this is a separation operation */
  isSeparating: boolean
}

/**
 * 拖拽管理模块
 * Drag Management Module
 * 
 * 提供拖拽相关的所有操作，统一处理屏幕坐标和世界坐标的转换
 * Provides all drag-related operations, handling screen and world coordinate conversion
 */
export class DragModule {
  /** 坐标模块引用 / Reference to coordinate module */
  private _coordinate: CoordinateModule
  
  /** 堆叠模块引用 / Reference to stack module */
  private _stack: StackModule
  
  /** 当前拖拽上下文 / Current drag context */
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
  
  // ========== 状态访问 / State Accessors ==========
  
  /** 获取当前拖拽上下文 / Get current drag context */
  get context(): DragContext {
    return { ...this._context }
  }
  
  /** 是否正在拖拽 / Whether currently dragging */
  get isDragging(): boolean {
    return this._context.isDragging
  }
  
  /** 当前拖拽的堆叠 ID / ID of the stack being dragged */
  get draggingStackId(): string | null {
    return this._context.draggingStackId
  }
  
  /** 是否是分离操作 / Whether this is a separation operation */
  get isSeparating(): boolean {
    return this._context.isSeparating
  }
  
  /** 被拖拽的卡牌索引 / Index of the card being dragged */
  get draggedCardIndex(): number {
    return this._context.draggedCardIndex
  }
  
  /** 源堆叠 ID / Source stack ID */
  get sourceStackId(): string | null {
    return this._context.sourceStackId
  }
  
  // ========== 拖拽生命周期 / Drag Lifecycle ==========
  
  /**
   * 开始拖拽
   * Start dragging
   * 
   * 注意：此方法假设堆叠已经分离（如果需要的话）
   * Note: This method assumes the stack has already been separated if needed
   * 分离操作应该由调用方（如 gameStore）处理
   * Separation should be handled by the caller (e.g., gameStore)
   * 
   * @param stack 目标堆叠 / Target stack
   * @param cardIndex 拖拽的卡牌索引（-1 表示整个堆叠）/ Card index (-1 for entire stack)
   * @param screenX 屏幕 X 坐标 / Screen X coordinate
   * @param screenY 屏幕 Y 坐标 / Screen Y coordinate
   * @param isSeparating 是否是分离操作（默认 false）/ Whether separating (default false)
   * @returns 拖拽起始的世界坐标，如果失败返回 null / Starting world coordinates, or null if failed
   */
  startDrag(
    stack: CardStack,
    cardIndex: number,
    screenX: number,
    screenY: number,
    isSeparating: boolean = false
  ): { x: number; y: number } | null {
    if (stack.cards.length === 0) return null
    
    // 记录拖拽开始状态
    // Record drag start state
    this._context.isDragging = true
    this._context.sourceStackId = stack.id
    this._context.startScreenX = screenX
    this._context.startScreenY = screenY
    this._context.draggedCardIndex = cardIndex
    this._context.draggingStackId = stack.id
    this._context.isSeparating = isSeparating
    
    // 获取底层卡牌的世界坐标
    // Get bottom card's world coordinates
    const bottomCard = stack.cards[0]
    this._context.startWorldX = bottomCard.x
    this._context.startWorldY = bottomCard.y
    
    return { x: bottomCard.x, y: bottomCard.y }
  }
  
  /**
   * 计算拖拽移动后的世界坐标
   * Calculate world coordinates after drag movement
   * 
   * @param currentScreenX 当前屏幕 X 坐标 / Current screen X coordinate
   * @param currentScreenY 当前屏幕 Y 坐标 / Current screen Y coordinate
   * @returns 新的世界坐标（已限制在地图边界内）/ New world coordinates (clamped to map boundaries)
   */
  calculateDragPosition(
    currentScreenX: number,
    currentScreenY: number
  ): { x: number; y: number } {
    // 计算屏幕坐标增量
    // Calculate screen coordinate delta
    const dx = currentScreenX - this._context.startScreenX
    const dy = currentScreenY - this._context.startScreenY
    
    // 转换为世界坐标增量
    // Convert to world coordinate delta
    const worldDelta = this._coordinate.screenDeltaToWorldDelta(dx, dy)
    
    // 计算新的世界坐标
    // Calculate new world coordinates
    const newX = this._context.startWorldX + worldDelta.dx
    const newY = this._context.startWorldY + worldDelta.dy
    
    // 限制在地图边界内
    // Clamp to map boundaries
    return this._coordinate.clampCardPosition(newX, newY)
  }
  
  /**
   * 结束拖拽
   * End dragging
   * 
   * @param stackMap 堆叠 ID 到堆叠对象的映射 / Map of stack ID to stack object
   * @param currentScreenX 当前屏幕 X 坐标 / Current screen X coordinate
   * @param currentScreenY 当前屏幕 Y 坐标 / Current screen Y coordinate
   * @returns 放置结果 / Drop result
   */
  endDrag(
    stackMap: Map<string, CardStack>,
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
    
    // 使用 elementFromPoint 查找目标
    // Use elementFromPoint to find target
    const targetStack = this.findStackByElement(
      currentScreenX,
      currentScreenY,
      this._context.draggingStackId,
      stackMap
    )
    
    // 尝试合并
    // Try to merge
    if (targetStack) {
      const draggingStack = stackMap.get(this._context.draggingStackId)
      if (draggingStack) {
        const sourceCard = draggingStack.cards[0]
        const targetCard = targetStack.cards[0]
        
        if (sourceCard && targetCard && this._stack.canStackCards(sourceCard, targetCard)) {
          this._stack.mergeStacks(draggingStack, targetStack)
          result.type = 'merge'
          result.targetStackId = targetStack.id
        }
      }
    }
    
    this.resetContext()
    return result
  }
  
  /**
   * 取消拖拽
   * Cancel dragging
   */
  cancelDrag(): void {
    this.resetContext()
  }
  
  /**
   * 重置拖拽上下文
   * Reset drag context
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
  
  // ========== 辅助方法 / Helper Methods ==========
  
  /**
   * 获取当前鼠标的世界坐标
   * Get current mouse world position
   * 
   * @param screenX 屏幕 X 坐标 / Screen X coordinate
   * @param screenY 屏幕 Y 坐标 / Screen Y coordinate
   * @returns 世界坐标 / World coordinates
   */
  getMouseWorldPosition(screenX: number, screenY: number): { x: number; y: number } {
    return this._coordinate.screenToWorld(screenX, screenY)
  }
  
  /**
   * 使用 elementFromPoint 查找鼠标位置的堆叠
   * Find stack at mouse position using elementFromPoint
   * 
   * 优点 / Advantages:
   * - 像素级精确碰撞检测 / Pixel-perfect collision detection
   * - 自动处理 z-index 层级 / Automatic z-index handling
   * - 自动处理 transform 缩放/平移 / Automatic transform handling
   * - 无需手动计算边界 / No manual boundary calculation
   * 
   * @param screenX 屏幕 X 坐标 / Screen X coordinate
   * @param screenY 屏幕 Y 坐标 / Screen Y coordinate
   * @param excludeId 排除的堆叠 ID（通常是正在拖拽的堆叠）/ Stack ID to exclude
   * @param stackMap 堆叠 ID 到堆叠对象的映射 / Map of stack ID to stack object
   * @returns 目标堆叠，如果没有返回 null / Target stack, or null if not found
   */
  findStackByElement(
    screenX: number,
    screenY: number,
    excludeId: string | null,
    stackMap: Map<string, CardStack>
  ): CardStack | null {
    // 临时隐藏拖拽元素，避免检测到自己
    // Temporarily hide dragging element to avoid self-detection
    const draggingEl = excludeId 
      ? document.querySelector(`[data-stack-id="${excludeId}"]`) as HTMLElement | null
      : null
    
    if (draggingEl) {
      draggingEl.style.pointerEvents = 'none'
    }
    
    try {
      // 获取鼠标位置的最上层元素
      // Get topmost element at mouse position
      const el = document.elementFromPoint(screenX, screenY)
      
      // 向上查找堆叠容器
      // Find stack container ancestor
      const stackEl = el?.closest('[data-stack-id]') as HTMLElement | null
      
      if (!stackEl) {
        return null
      }
      
      const stackId = stackEl.dataset.stackId
      if (!stackId || stackId === excludeId) {
        return null
      }
      
      // O(1) 查找堆叠数据
      // O(1) lookup for stack data
      return stackMap.get(stackId) || null
    } finally {
      // 恢复拖拽元素的 pointerEvents
      // Restore pointer events for dragging element
      if (draggingEl) {
        draggingEl.style.pointerEvents = ''
      }
    }
  }
  
  /**
   * 查找当前鼠标位置的放置目标（用于拖拽过程中的视觉反馈）
   * Find drop target at current mouse position (for visual feedback during drag)
   * 
   * @param screenX 屏幕 X 坐标 / Screen X coordinate
   * @param screenY 屏幕 Y 坐标 / Screen Y coordinate
   * @param stackMap 堆叠 ID 到堆叠对象的映射 / Map of stack ID to stack object
   * @returns 目标堆叠和是否可放置 / Target stack and whether can drop
   */
  findDropTarget(
    screenX: number,
    screenY: number,
    stackMap: Map<string, CardStack>
  ): { target: CardStack | null; canDrop: boolean } {
    if (!this._context.draggingStackId) {
      return { target: null, canDrop: false }
    }
    
    const targetStack = this.findStackByElement(
      screenX,
      screenY,
      this._context.draggingStackId,
      stackMap
    )
    
    if (!targetStack) {
      return { target: null, canDrop: false }
    }
    
    const draggingStack = stackMap.get(this._context.draggingStackId)
    if (!draggingStack) {
      return { target: null, canDrop: false }
    }
    
    const sourceCard = draggingStack.cards[0]
    const targetCard = targetStack.cards[0]
    
    const canDrop = sourceCard && targetCard && this._stack.canStackCards(sourceCard, targetCard)
    
    return { target: targetStack, canDrop: !!canDrop }
  }
}
