/**
 * 游戏引擎 - 主入口
 * 
 * 统一管理所有游戏模块，提供简洁的 API 给业务层使用
 * 业务代码只与 GameEngine 交互，不直接操作底层模块
 */

import { CoordinateModule } from './CoordinateModule'
import { StackModule, STACK_OFFSET } from './StackModule'
import { DragModule } from './DragModule'
import type { CardStack, GameCard, DropResult } from '@/game/types'

/**
 * 游戏引擎
 * 
 * 职责：
 * 1. 统一管理坐标系统、堆叠、拖拽等模块
 * 2. 提供简洁的 API 给业务层
 * 3. 隐藏底层实现细节
 * 
 * 使用示例：
 * ```typescript
 * const engine = new GameEngine()
 * 
 * // 创建堆叠
 * const stack = engine.createStack(100, 200, 'wood', '木材', '🪵')
 * 
 * // 开始拖拽
 * const startPos = engine.startDrag(stack, 0, screenX, screenY)
 * 
 * // 移动堆叠
 * const newPos = engine.calculateDragPosition(currentScreenX, currentScreenY)
 * engine.moveStack(stack, newPos.x, newPos.y)
 * 
 * // 结束拖拽
 * const result = engine.endDrag(allStacks, currentScreenX, currentScreenY)
 * ```
 */
export class GameEngine {
  /** 坐标模块 */
  readonly coordinate: CoordinateModule
  
  /** 堆叠模块 */
  readonly stack: StackModule
  
  /** 拖拽模块 */
  readonly drag: DragModule
  
  constructor() {
    // 初始化各模块
    this.coordinate = new CoordinateModule()
    this.stack = new StackModule()
    this.drag = new DragModule(this.coordinate, this.stack)
  }
  
  /**
   * 初始化视口
   * Initialize viewport
   */
  initialize(): void {
    this.coordinate.initializeViewport()
  }
  
  // ========== 坐标相关 API ==========
  
  /**
   * 屏幕坐标转世界坐标
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return this.coordinate.screenToWorld(screenX, screenY)
  }
  
  /**
   * 世界坐标转屏幕坐标
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return this.coordinate.worldToScreen(worldX, worldY)
  }
  
  /**
   * 获取 CSS transform 样式
   */
  getTransformStyle(): string {
    return this.coordinate.getTransformStyle()
  }
  
  /**
   * 获取当前缩放比例
   */
  get scale(): number {
    return this.coordinate.scale
  }
  
  /**
   * 设置缩放比例
   */
  set scale(value: number) {
    this.coordinate.scale = value
  }
  
  /**
   * 获取平移值
   */
  get translate(): { x: number; y: number } {
    return { x: this.coordinate.translateX, y: this.coordinate.translateY }
  }
  
  /**
   * 设置平移值
   */
  setTranslate(x: number, y: number): void {
    this.coordinate.setTranslate(x, y)
  }
  
  /**
   * 获取旋转角度
   */
  get rotateX(): number {
    return this.coordinate.rotateX
  }
  
  /**
   * 设置旋转角度
   */
  set rotateX(value: number) {
    this.coordinate.rotateX = value
  }
  
  // ========== 堆叠相关 API ==========
  
  /**
   * 创建新堆叠
   */
  createStack(
    x: number,
    y: number,
    typeId: string,
    name: string,
    emoji: string,
    nameKey?: string
  ): CardStack {
    return this.stack.createStack(x, y, typeId, name, emoji, nameKey)
  }
  
  /**
   * 向堆叠添加卡牌
   */
  addCardToStack(
    stack: CardStack,
    typeId: string,
    name: string,
    emoji: string
  ): GameCard | null {
    return this.stack.addCardToStack(stack, typeId, name, emoji)
  }
  
  /**
   * 移动堆叠
   */
  moveStack(stack: CardStack, x: number, y: number): void {
    this.stack.moveStack(stack, x, y)
  }
  
  /**
   * 分离堆叠
   */
  separateStack(stack: CardStack, fromIndex: number): CardStack | null {
    return this.stack.separateStack(stack, fromIndex)
  }
  
  /**
   * 合并堆叠
   */
  mergeStacks(sourceStack: CardStack, targetStack: CardStack): boolean {
    return this.stack.mergeStacks(sourceStack, targetStack)
  }
  
  /**
   * 检查是否可以堆叠
   */
  canStackCards(card1: GameCard, card2: GameCard): boolean {
    return this.stack.canStackCards(card1, card2)
  }
  
  /**
   * 获取堆叠边界
   */
  getStackBounds(stack: CardStack): { minX: number; maxX: number; minY: number; maxY: number } {
    return this.stack.getStackBounds(stack)
  }
  
  /**
   * 查找指定位置的堆叠
   */
  findStackAtPosition(
    stacks: CardStack[],
    worldX: number,
    worldY: number,
    excludeId?: string
  ): CardStack | null {
    return this.stack.findStackAtPosition(stacks, worldX, worldY, excludeId)
  }
  
  // ========== 拖拽相关 API ==========
  
  /**
   * 开始拖拽
   * 
   * @param stack 目标堆叠
   * @param cardIndex 拖拽的卡牌索引（-1 表示整个堆叠）
   * @param screenX 屏幕 X 坐标
   * @param screenY 屏幕 Y 坐标
   * @param isSeparating 是否是分离操作（默认 false）
   * @returns 拖拽起始的世界坐标
   */
  startDrag(
    stack: CardStack,
    cardIndex: number,
    screenX: number,
    screenY: number,
    isSeparating: boolean = false
  ): { x: number; y: number } | null {
    return this.drag.startDrag(stack, cardIndex, screenX, screenY, isSeparating)
  }
  
  /**
   * 计算拖拽位置
   */
  calculateDragPosition(
    currentScreenX: number,
    currentScreenY: number
  ): { x: number; y: number } {
    return this.drag.calculateDragPosition(currentScreenX, currentScreenY)
  }
  
  /**
   * 结束拖拽
   */
  endDrag(
    stackMap: Map<string, CardStack>,
    currentScreenX: number,
    currentScreenY: number
  ): DropResult {
    return this.drag.endDrag(stackMap, currentScreenX, currentScreenY)
  }
  
  /**
   * 取消拖拽
   */
  cancelDrag(): void {
    this.drag.cancelDrag()
  }
  
  /**
   * 是否正在拖拽
   */
  get isDragging(): boolean {
    return this.drag.isDragging
  }
  
  /**
   * 当前拖拽的堆叠 ID
   */
  get draggingStackId(): string | null {
    return this.drag.draggingStackId
  }
  
  /**
   * 是否是分离操作
   */
  get isSeparating(): boolean {
    return this.drag.isSeparating
  }
  
  /**
   * 被拖拽的卡牌索引
   */
  get draggedCardIndex(): number {
    return this.drag.draggedCardIndex
  }
  
  /**
   * 源堆叠 ID
   */
  get sourceStackId(): string | null {
    return this.drag.sourceStackId
  }
  
  /**
   * 查找放置目标
   */
  findDropTarget(
    screenX: number,
    screenY: number,
    stackMap: Map<string, CardStack>
  ): { target: CardStack | null; canDrop: boolean } {
    return this.drag.findDropTarget(screenX, screenY, stackMap)
  }
  
  // ========== 工具方法 ==========
  
  /**
   * 限制卡牌位置在地图范围内
   * Clamp card position within map boundaries
   * 
   * @param x 世界坐标 X / World coordinate X
   * @param y 世界坐标 Y / World coordinate Y
   * @returns 限制后的世界坐标 / Clamped world coordinates
   */
  clampCardPosition(x: number, y: number): { x: number; y: number } {
    return this.coordinate.clampCardPosition(x, y)
  }
  
  /**
   * 重置引擎状态
   * Reset engine state
   */
  reset(): void {
    this.coordinate.reset()
    this.drag.cancelDrag()
  }
}

// 导出常量
export { STACK_OFFSET }

// 导出模块（供需要直接访问的场景）
export { CoordinateModule } from './CoordinateModule'
export { StackModule } from './StackModule'
export { DragModule } from './DragModule'
