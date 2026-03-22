/**
 * 视口控制器
 * Viewport Controller
 * 
 * 管理游戏的缩放和平移
 */

import { Container } from 'pixi.js'
import { gameConfig } from '@/config/game'

export interface ViewportState {
  scale: number
  translateX: number
  translateY: number
}

export class ViewportController {
  private container: Container
  private _scale: number = 1
  private _translateX: number = 0
  private _translateY: number = 0
  private minScale: number
  private maxScale: number

  constructor(container: Container) {
    this.container = container
    this.minScale = gameConfig.viewport.minScale
    this.maxScale = gameConfig.viewport.maxScale
    this.updateTransform()
  }

  /** 设置缩放 */
  setScale(value: number, centerX?: number, centerY?: number): void {
    const oldScale = this._scale
    this._scale = Math.max(this.minScale, Math.min(this.maxScale, value))
    
    // 以指定点为中心进行缩放
    if (centerX !== undefined && centerY !== undefined && this._scale !== oldScale) {
      const scaleRatio = this._scale / oldScale
      this._translateX = centerX - (centerX - this._translateX) * scaleRatio
      this._translateY = centerY - (centerY - this._translateY) * scaleRatio
    }
    
    this.updateTransform()
  }

  /** 缩放（增量） */
  zoom(delta: number, centerX: number, centerY: number): void {
    this.setScale(this._scale + delta, centerX, centerY)
  }

  /** 设置平移 */
  setPan(x: number, y: number): void {
    this._translateX = x
    this._translateY = y
    this.updateTransform()
  }

  /** 平移（增量） */
  pan(dx: number, dy: number): void {
    this._translateX += dx
    this._translateY += dy
    this.updateTransform()
  }

  /** 重置视口 */
  reset(): void {
    this._scale = gameConfig.viewport.defaultScale
    this._translateX = 0
    this._translateY = 0
    this.updateTransform()
  }

  /** 获取视口状态 */
  getState(): ViewportState {
    return {
      scale: this._scale,
      translateX: this._translateX,
      translateY: this._translateY,
    }
  }

  /** 设置视口状态 */
  setState(state: Partial<ViewportState>): void {
    if (state.scale !== undefined) {
      this._scale = state.scale
    }
    if (state.translateX !== undefined) {
      this._translateX = state.translateX
    }
    if (state.translateY !== undefined) {
      this._translateY = state.translateY
    }
    this.updateTransform()
  }

  /** 更新变换矩阵 */
  private updateTransform(): void {
    this.container.scale.set(this._scale)
    this.container.position.set(this._translateX, this._translateY)
  }

  /** 屏幕坐标转世界坐标 */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this._translateX) / this._scale,
      y: (screenY - this._translateY) / this._scale,
    }
  }

  /** 世界坐标转屏幕坐标 */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this._scale + this._translateX,
      y: worldY * this._scale + this._translateY,
    }
  }

  /** 获取当前缩放 */
  get scale(): number {
    return this._scale
  }

  /** 获取当前平移 X */
  get translateX(): number {
    return this._translateX
  }

  /** 获取当前平移 Y */
  get translateY(): number {
    return this._translateY
  }
}
