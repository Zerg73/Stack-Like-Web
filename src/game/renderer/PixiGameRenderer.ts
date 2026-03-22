/**
 * PixiJS 游戏渲染器
 * PixiJS Game Renderer
 * 
 * 整合所有渲染组件，提供统一的渲染接口
 */

import { Container, Graphics, FederatedPointerEvent } from 'pixi.js'
import { PixiApp } from './PixiApplication'
import { CardSprite } from './CardSprite'
import { SpritePool } from './SpritePool'
import { ViewportController } from './ViewportController'
import { DragHandler } from './DragHandler'
import type { CardStack, GameCard } from '@/game/types'

/** 视口配置 */
const VIEWPORT_CONFIG = {
  width: 2000,
  height: 1500,
  minScale: 0.3,
  maxScale: 2,
  defaultScale: 1,
}

export interface RendererOptions {
  container: HTMLElement
}

export interface RendererEvents {
  cardClick: (card: GameCard, stack: CardStack) => void
  cardDragStart: (card: GameCard, stack: CardStack, worldX: number, worldY: number) => void
  cardDragMove: (card: GameCard, stack: CardStack, worldX: number, worldY: number) => void
  cardDragEnd: (card: GameCard, stack: CardStack, worldX: number, worldY: number) => void
  stageClick: () => void
}

export class PixiGameRenderer {
  private pixiApp: PixiApp
  private container: HTMLElement
  
  // 容器层级
  private worldContainer: Container
  private gridContainer: Container
  private cardContainer: Container
  
  // 控制器
  private viewportController: ViewportController
  private dragHandler: DragHandler
  
  // 精灵池
  private cardSpritePool: SpritePool<CardSprite>
  
  // 卡牌映射
  private cardSpriteMap: Map<string, CardSprite> = new Map()
  
  // 事件回调
  private events: RendererEvents = {
    cardClick: () => {},
    cardDragStart: () => {},
    cardDragMove: () => {},
    cardDragEnd: () => {},
    stageClick: () => {},
  }

  constructor(options: RendererOptions) {
    this.container = options.container
    this.pixiApp = new PixiApp({ container: this.container })
    
    // 创建容器
    this.worldContainer = new Container()
    this.gridContainer = new Container()
    this.cardContainer = new Container()
    
    // 创建视口控制器
    this.viewportController = new ViewportController(this.worldContainer)
    
    // 创建精灵池
    this.cardSpritePool = new SpritePool<CardSprite>(
      () => new CardSprite(),
      (sprite) => sprite.reset(),
      200
    )
    
    // 拖拽处理器稍后初始化
    this.dragHandler = null as any
  }

  async init(): Promise<void> {
    await this.pixiApp.init()
    
    // 添加容器层级
    this.pixiApp.stage.addChild(this.worldContainer)
    this.worldContainer.addChild(this.gridContainer)
    this.worldContainer.addChild(this.cardContainer)
    
    // 绘制网格
    this.drawGrid()
    
    // 创建拖拽处理器
    this.dragHandler = new DragHandler(this.pixiApp.stage, this.viewportController, this.cardContainer)
    
    // 设置拖拽回调
    this.dragHandler.onDragStart((sprite, worldX, worldY) => {
      if (sprite.cardData && sprite.stackData) {
        this.events.cardDragStart(sprite.cardData, sprite.stackData, worldX, worldY)
      }
    })
    
    this.dragHandler.onDragMove((sprite, worldX, worldY) => {
      if (sprite.cardData && sprite.stackData) {
        this.events.cardDragMove(sprite.cardData, sprite.stackData, worldX, worldY)
      }
    })
    
    this.dragHandler.onDragEnd((sprite, worldX, worldY) => {
      if (sprite.cardData && sprite.stackData) {
        this.events.cardDragEnd(sprite.cardData, sprite.stackData, worldX, worldY)
      }
    })
    
    // 绑定舞台点击事件
    this.pixiApp.stage.eventMode = 'static'
    this.pixiApp.stage.on('pointerdown', (e: FederatedPointerEvent) => {
      if (e.target === this.pixiApp.stage) {
        this.events.stageClick()
      }
    })
  }

  /** 绘制网格背景 */
  private drawGrid(): void {
    const gridGraphics = new Graphics()
    const gridSize = 40
    const width = VIEWPORT_CONFIG.width
    const height = VIEWPORT_CONFIG.height

    gridGraphics.setStrokeStyle({
      width: 1,
      color: 0x2a2a4a,
    })

    // 绘制垂直线
    for (let x = 0; x <= width; x += gridSize) {
      gridGraphics.moveTo(x, 0)
      gridGraphics.lineTo(x, height)
    }

    // 绘制水平线
    for (let y = 0; y <= height; y += gridSize) {
      gridGraphics.moveTo(0, y)
      gridGraphics.lineTo(width, y)
    }

    gridGraphics.stroke()
    this.gridContainer.addChild(gridGraphics)
  }

  /** 更新所有堆叠 */
  updateStacks(stacks: CardStack[], selectedIds: string[]): void {
    // 收集当前应该存在的卡牌 ID
    const currentCardIds = new Set<string>()
    
    // 遍历所有堆叠
    for (const stack of stacks) {
      for (const card of stack.cards) {
        currentCardIds.add(card.id)
        
        // 获取或创建精灵
        let sprite = this.cardSpriteMap.get(card.id)
        
        if (!sprite) {
          sprite = this.cardSpritePool.acquire()
          sprite.visible = true
          this.cardContainer.addChild(sprite)
          this.cardSpriteMap.set(card.id, sprite)
          
          // 绑定拖拽事件
          sprite.on('pointerdown', (e: FederatedPointerEvent) => {
            if (sprite) {
              this.dragHandler.handleCardDragStart(sprite, e)
            }
          })
        }
        
        // 设置卡牌数据
        sprite.setCard(card, stack)
        
        // 设置选中状态
        sprite.selected = selectedIds.includes(stack.id)
      }
    }
    
    // 移除不存在的卡牌
    for (const [id, sprite] of this.cardSpriteMap) {
      if (!currentCardIds.has(id)) {
        this.cardSpritePool.release(sprite)
        this.cardContainer.removeChild(sprite)
        this.cardSpriteMap.delete(id)
      }
    }
  }

  /** 设置选中状态 */
  setSelected(cardId: string, selected: boolean): void {
    const sprite = this.cardSpriteMap.get(cardId)
    if (sprite) {
      sprite.selected = selected
    }
  }

  /** 设置缩放 */
  setScale(scale: number): void {
    const screen = this.pixiApp.screen
    if (screen) {
      this.viewportController.setScale(scale, screen.width / 2, screen.height / 2)
    }
  }

  /** 缩放 */
  zoom(delta: number): void {
    const screen = this.pixiApp.screen
    if (screen) {
      this.viewportController.zoom(delta, screen.width / 2, screen.height / 2)
    }
  }

  /** 平移 */
  pan(dx: number, dy: number): void {
    this.viewportController.pan(dx, dy)
  }

  /** 设置平移 */
  setPan(x: number, y: number): void {
    this.viewportController.setPan(x, y)
  }

  /** 获取视口状态 */
  getViewportState() {
    return this.viewportController.getState()
  }

  /** 设置视口状态 */
  setViewportState(state: { scale?: number; translateX?: number; translateY?: number }): void {
    this.viewportController.setState(state)
  }

  /** 屏幕坐标转世界坐标 */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return this.viewportController.screenToWorld(screenX, screenY)
  }

  /** 世界坐标转屏幕坐标 */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return this.viewportController.worldToScreen(worldX, worldY)
  }

  /** 获取拖拽状态 */
  get isDragging(): boolean {
    return this.dragHandler?.dragging ?? false
  }

  /** 获取当前拖拽的卡牌 */
  get draggingCard(): GameCard | null {
    const sprite = this.dragHandler?.currentDraggingSprite
    return sprite?.cardData ?? null
  }

  /** 注册事件回调 */
  on<K extends keyof RendererEvents>(event: K, callback: RendererEvents[K]): void {
    this.events[event] = callback
  }

  /** 移除事件回调 */
  off(event: keyof RendererEvents): void {
    this.events[event] = () => {}
  }

  /** 获取 Canvas 元素 */
  getCanvas(): HTMLCanvasElement {
    return this.pixiApp.canvas
  }

  /** 获取视口控制器 */
  getViewportController(): ViewportController {
    return this.viewportController
  }

  /** 销毁 */
  destroy(): void {
    this.dragHandler?.destroy()
    this.cardSpritePool.destroy()
    this.pixiApp.destroy()
    this.cardSpriteMap.clear()
  }
}
