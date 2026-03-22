/**
 * 拖拽处理器
 * Drag Handler
 * 
 * 处理卡牌的拖拽交互，与 GameEngine 集成
 */

import { Container, FederatedPointerEvent } from 'pixi.js'
import { CardSprite } from './CardSprite'
import { ViewportController } from './ViewportController'

export class DragHandler {
  private stage: Container
  private viewport: ViewportController
  private cardContainer: Container
  
  private draggingSprite: CardSprite | null = null
  private dragOffset = { x: 0, y: 0 }
  private isDragging: boolean = false

  private onDragStartCallback: ((sprite: CardSprite, worldX: number, worldY: number) => void) | null = null
  private onDragMoveCallback: ((sprite: CardSprite, worldX: number, worldY: number) => void) | null = null
  private onDragEndCallback: ((sprite: CardSprite, worldX: number, worldY: number) => void) | null = null

  constructor(stage: Container, viewport: ViewportController, cardContainer: Container) {
    this.stage = stage
    this.viewport = viewport
    this.cardContainer = cardContainer

    this.setupGlobalEvents()
  }

  /** 设置全局事件 */
  private setupGlobalEvents(): void {
    this.stage.eventMode = 'static'
    
    this.stage.on('pointermove', this.handleGlobalPointerMove)
    this.stage.on('pointerup', this.handleGlobalPointerUp)
    this.stage.on('pointerupoutside', this.handleGlobalPointerUp)
  }

  /** 处理卡牌拖拽开始 */
  handleCardDragStart(sprite: CardSprite, event: FederatedPointerEvent): void {
    this.draggingSprite = sprite
    this.isDragging = true
    
    // 计算拖拽偏移
    const worldPos = this.viewport.screenToWorld(event.global.x, event.global.y)
    this.dragOffset.x = worldPos.x - sprite.x
    this.dragOffset.y = worldPos.y - sprite.y
    
    // 设置拖拽状态
    sprite.dragging = true
    
    // 移动到最上层
    this.cardContainer.removeChild(sprite)
    this.cardContainer.addChild(sprite)

    // 触发回调
    if (this.onDragStartCallback) {
      this.onDragStartCallback(sprite, sprite.x, sprite.y)
    }

    // 停止事件传播
    event.stopPropagation()
  }

  /** 处理全局指针移动 */
  private handleGlobalPointerMove = (event: FederatedPointerEvent): void => {
    if (!this.isDragging || !this.draggingSprite) return

    const worldPos = this.viewport.screenToWorld(event.global.x, event.global.y)
    const newX = worldPos.x - this.dragOffset.x
    const newY = worldPos.y - this.dragOffset.y

    // 更新位置
    this.draggingSprite.updatePosition(newX, newY)

    // 触发回调
    if (this.onDragMoveCallback) {
      this.onDragMoveCallback(this.draggingSprite, newX, newY)
    }
  }

  /** 处理全局指针释放 */
  private handleGlobalPointerUp = (_event: FederatedPointerEvent): void => {
    if (!this.isDragging || !this.draggingSprite) return

    const sprite = this.draggingSprite
    
    // 清除拖拽状态
    sprite.dragging = false
    this.isDragging = false

    // 触发回调
    if (this.onDragEndCallback) {
      this.onDragEndCallback(sprite, sprite.x, sprite.y)
    }

    this.draggingSprite = null
  }

  /** 注册拖拽开始回调 */
  onDragStart(callback: (sprite: CardSprite, worldX: number, worldY: number) => void): void {
    this.onDragStartCallback = callback
  }

  /** 注册拖拽移动回调 */
  onDragMove(callback: (sprite: CardSprite, worldX: number, worldY: number) => void): void {
    this.onDragMoveCallback = callback
  }

  /** 注册拖拽结束回调 */
  onDragEnd(callback: (sprite: CardSprite, worldX: number, worldY: number) => void): void {
    this.onDragEndCallback = callback
  }

  /** 取消拖拽 */
  cancelDrag(): void {
    if (this.draggingSprite) {
      this.draggingSprite.dragging = false
      this.draggingSprite = null
    }
    this.isDragging = false
  }

  /** 获取当前是否正在拖拽 */
  get dragging(): boolean {
    return this.isDragging
  }

  /** 获取当前拖拽的精灵 */
  get currentDraggingSprite(): CardSprite | null {
    return this.draggingSprite
  }

  /** 销毁 */
  destroy(): void {
    this.stage.off('pointermove', this.handleGlobalPointerMove)
    this.stage.off('pointerup', this.handleGlobalPointerUp)
    this.stage.off('pointerupoutside', this.handleGlobalPointerUp)
    this.onDragStartCallback = null
    this.onDragMoveCallback = null
    this.onDragEndCallback = null
  }
}
