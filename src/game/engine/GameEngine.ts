/**
 * 游戏引擎 - 主入口
 * 
 * 统一管理所有游戏模块，提供简洁的 API 给业务层使用
 * 业务代码只与 GameEngine 交互，不直接操作底层模块
 */

import { CoordinateModule } from './CoordinateModule'
import { StackModule, STACK_OFFSET } from './StackModule'
import { DragModule } from './DragModule'
import { TimeModule } from './TimeModule'
import { CollisionModule } from './CollisionModule'
import type { CardStack, GameCard, DropResult } from '@/game/types'
import { gameConfig } from '@/config/game'

/**
 * 游戏引擎
 * 
 * 职责：
 * 1. 统一管理坐标系统、堆叠、拖拽、时间等模块
 * 2. 提供简洁的 API 给业务层
 * 3. 隐藏底层实现细节
 * 4. 管理 FixedUpdate 游戏循环
 * 
 * 使用示例：
 * ```typescript
 * const engine = new GameEngine()
 * 
 * // 启动游戏循环
 * engine.start()
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
 * 
 * // 停止游戏循环
 * engine.stop()
 * ```
 */
export class GameEngine {
  /** 坐标模块 */
  readonly coordinate: CoordinateModule
  
  /** 堆叠模块 */
  readonly stack: StackModule
  
  /** 拖拽模块 */
  readonly drag: DragModule
  
  /** 时间模块 */
  readonly time: TimeModule
  
  /** 碰撞检测模块 */
  readonly collision: CollisionModule
  
  // ========== FixedUpdate 相关 / FixedUpdate related ==========
  
  /** 固定 tick 间隔（毫秒）/ Fixed tick interval (ms) */
  private readonly fixedTickInterval: number = gameConfig.time.fixedTickInterval
  
  /** 累积时间（毫秒）/ Accumulated time (ms) */
  private accumulatedTime: number = 0
  
  /** 上一帧时间 / Last frame time */
  private lastFrameTime: number = 0
  
  /** 动画帧 ID / Animation frame ID */
  private animationFrameId: number | null = null
  
  /** 游戏时间累积（游戏毫秒）/ Game time accumulation (game ms) */
  private gameMsAccumulated: number = 0
  
  /** 是否已启动 / Is started */
  private _isRunning: boolean = false
  
  constructor() {
    // 初始化各模块
    this.coordinate = new CoordinateModule()
    this.stack = new StackModule()
    this.drag = new DragModule(this.coordinate, this.stack)
    this.time = new TimeModule()
    this.collision = new CollisionModule()
  }
  
  /**
   * 是否正在运行
   * Is engine running
   */
  get isRunning(): boolean {
    return this._isRunning
  }
  
  /**
   * 启动游戏循环
   * Start game loop
   */
  start(): void {
    if (this._isRunning) return
    
    this._isRunning = true
    this.lastFrameTime = performance.now()
    this.tick()
  }
  
  /**
   * 停止游戏循环
   * Stop game loop
   */
  stop(): void {
    this._isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
  
  /**
   * 主循环（使用 requestAnimationFrame）
   * Main loop (using requestAnimationFrame)
   */
  private tick(): void {
    if (!this._isRunning) return
    
    const now = performance.now()
    const deltaTime = now - this.lastFrameTime
    this.lastFrameTime = now
    
    // 累积时间
    // Accumulate time
    this.accumulatedTime += deltaTime
    
    // FixedUpdate：每 fixedTickInterval 毫秒执行一次
    // FixedUpdate: execute every fixedTickInterval ms
    while (this.accumulatedTime >= this.fixedTickInterval) {
      this.accumulatedTime -= this.fixedTickInterval
      this.fixedUpdate()
    }
    
    // 继续下一帧
    // Continue to next frame
    this.animationFrameId = requestAnimationFrame(() => this.tick())
  }
  
  /**
   * 固定时间更新（处理游戏逻辑）
   * Fixed time update (handle game logic)
   * 
   * 每 fixedTickInterval 毫秒调用一次，与帧率无关
   * Called every fixedTickInterval ms, independent of frame rate
   */
  private fixedUpdate(): void {
    if (this.time.isPaused) return
    
    // 计算本次 tick 的游戏时间增量
    // Calculate game time delta for this tick
    // 标准速度：10秒现实 = 1游戏分钟 = 60游戏秒
    // Normal speed: 10s real = 1 game minute = 60 game seconds
    // 所以 20ms 现实 = 20/10000 * 60 * 1000 = 120 游戏毫秒
    // So 20ms real = 20/10000 * 60 * 1000 = 120 game ms
    const gameMsPerTick = (this.fixedTickInterval * 60 * 1000) / (this.time.secondsPerGameMinute * 1000)
    this.gameMsAccumulated += gameMsPerTick
    
    // 当累积超过 1000 游戏毫秒（1 游戏秒）时，更新时间
    // When accumulated exceeds 1000 game ms (1 game second), update time
    if (this.gameMsAccumulated >= 1000) {
      const gameSecondsDelta = Math.floor(this.gameMsAccumulated / 1000)
      this.gameMsAccumulated %= 1000
      
      // 更新时间模块
      // Update time module
      this.time.update(gameSecondsDelta)
    }
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
    this.time.reset()
    this.gameMsAccumulated = 0
    this.accumulatedTime = 0
  }
}

// 导出常量
export { STACK_OFFSET }

// 导出模块（供需要直接访问的场景）
export { CoordinateModule } from './CoordinateModule'
export { StackModule } from './StackModule'
export { DragModule } from './DragModule'
export { TimeModule } from './TimeModule'
export { CollisionModule } from './CollisionModule'
export { ProductionModule } from './ProductionModule'
