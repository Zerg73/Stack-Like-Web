/**
 * 卡牌精灵
 * Card Sprite
 * 
 * 使用 PixiJS Graphics 绘制卡牌，支持选中/悬停/拖拽状态
 */

import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js'
import type { GameCard, CardStack } from '@/game/types'
import { getCardColor } from '@/config/cardTypes'

/** 卡牌尺寸 */
export const CARD_WIDTH = 80
export const CARD_HEIGHT = 107
export const NAME_BAR_HEIGHT = 32
export const BORDER_RADIUS = 8

/** 状态颜色 */
const COLORS = {
  background: 0x2d3748,
  border: 0x4a5568,
  borderSelected: 0xf6ad55,
  borderHover: 0x68d391,
  text: 0xffffff,
}

export class CardSprite extends Container {
  /** 卡牌数据 */
  cardData: GameCard | null = null

  /** 堆叠数据 */
  stackData: CardStack | null = null

  /** 背景图形 */
  private background: Graphics

  /** 名字栏图形 */
  private nameBar: Graphics

  /** 名字栏底部装饰 */
  private nameBarBottom: Graphics

  /** 类型点 */
  private typeDot: Graphics

  /** 名字文本 */
  private nameText: Text

  /** Emoji 文本 */
  private emojiText: Text

  /** 是否选中 */
  private _selected: boolean = false

  /** 是否悬停 */
  private _hovered: boolean = false

  /** 是否正在拖拽 */
  private _dragging: boolean = false

  constructor() {
    super()

    // 创建背景
    this.background = new Graphics()
    this.addChild(this.background)

    // 创建名字栏
    this.nameBar = new Graphics()
    this.addChild(this.nameBar)

    // 创建名字栏底部装饰
    this.nameBarBottom = new Graphics()
    this.addChild(this.nameBarBottom)

    // 创建类型点
    this.typeDot = new Graphics()
    this.addChild(this.typeDot)

    // 创建名字文本
    this.nameText = new Text({
      text: '',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        fill: COLORS.text,
        fontWeight: 'bold',
      },
    })
    this.addChild(this.nameText)

    // 创建 Emoji 文本
    this.emojiText = new Text({
      text: '',
      style: {
        fontSize: 32,
      },
    })
    this.emojiText.anchor.set(0.5)
    this.addChild(this.emojiText)

    // 启用交互
    this.eventMode = 'static'
    this.cursor = 'grab'

    // 绑定事件
    this.on('pointerdown', this.handlePointerDown)
    this.on('pointerover', this.handlePointerOver)
    this.on('pointerout', this.handlePointerOut)
  }

  /** 设置卡牌数据并渲染 */
  setCard(card: GameCard, stack: CardStack): void {
    this.cardData = card
    this.stackData = stack
    this.renderCard()
  }

  /** 渲染卡牌 */
  private renderCard(): void {
    if (!this.cardData) return

    const card = this.cardData

    // 设置位置
    this.x = card.x
    this.y = card.y

    // 获取卡牌颜色
    const cardColor = getCardColor(card.typeId)

    // 清除旧图形
    this.background.clear()
    this.nameBar.clear()
    this.nameBarBottom.clear()
    this.typeDot.clear()

    // 绘制背景
    this.background.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS)
    this.background.fill({ color: COLORS.background })
    this.background.stroke({ 
      color: this._selected ? COLORS.borderSelected : COLORS.border,
      width: this._selected ? 3 : 2 
    })

    // 绘制名字栏
    this.nameBar.roundRect(0, 0, CARD_WIDTH, NAME_BAR_HEIGHT, BORDER_RADIUS)
    this.nameBar.fill({ color: cardColor })

    // 绘制名字栏底部装饰
    this.nameBarBottom.rect(0, NAME_BAR_HEIGHT - BORDER_RADIUS, CARD_WIDTH, BORDER_RADIUS)
    this.nameBarBottom.fill({ color: cardColor })

    // 绘制类型点
    this.typeDot.circle(16, NAME_BAR_HEIGHT / 2, 4)
    this.typeDot.fill({ color: COLORS.text })

    // 设置名字
    this.nameText.text = card.name
    this.nameText.x = 28
    this.nameText.y = (NAME_BAR_HEIGHT - this.nameText.height) / 2

    // 设置 Emoji
    this.emojiText.text = card.emoji
    this.emojiText.x = CARD_WIDTH / 2
    this.emojiText.y = NAME_BAR_HEIGHT + (CARD_HEIGHT - NAME_BAR_HEIGHT) / 2
  }

  /** 更新卡牌位置 */
  updatePosition(x: number, y: number): void {
    this.x = x
    this.y = y
    if (this.cardData) {
      this.cardData.x = x
      this.cardData.y = y
    }
  }

  /** 设置选中状态 */
  set selected(value: boolean) {
    this._selected = value
    this.renderCard()
  }

  get selected(): boolean {
    return this._selected
  }

  /** 设置悬停状态 */
  set hovered(value: boolean) {
    if (this._hovered === value) return
    this._hovered = value
    
    if (value) {
      this.alpha = 0.95
      if (this.parent) {
        this.parent.removeChild(this)
        this.parent.addChild(this)
      }
    } else {
      this.alpha = 1
    }
  }

  get hovered(): boolean {
    return this._hovered
  }

  /** 设置拖拽状态 */
  set dragging(value: boolean) {
    this._dragging = value
    if (value) {
      this.alpha = 0.8
      this.cursor = 'grabbing'
      if (this.parent) {
        this.parent.removeChild(this)
        this.parent.addChild(this)
      }
    } else {
      this.alpha = 1
      this.cursor = 'grab'
    }
  }

  get dragging(): boolean {
    return this._dragging
  }

  /** 重置状态 */
  reset(): void {
    this.cardData = null
    this.stackData = null
    this._selected = false
    this._hovered = false
    this._dragging = false
    this.visible = false
    this.alpha = 1
  }

  /** 指针按下事件 */
  private handlePointerDown = (e: FederatedPointerEvent): void => {
    this.dragging = true
    e.stopPropagation()
  }

  /** 指针悬停事件 */
  private handlePointerOver = (): void => {
    this.hovered = true
  }

  /** 指针离开事件 */
  private handlePointerOut = (): void => {
    if (!this._dragging) {
      this.hovered = false
    }
  }

  /** 销毁 */
  override destroy(): void {
    this.background.destroy()
    this.nameBar.destroy()
    this.nameBarBottom.destroy()
    this.typeDot.destroy()
    this.nameText.destroy()
    this.emojiText.destroy()
    super.destroy()
  }
}
