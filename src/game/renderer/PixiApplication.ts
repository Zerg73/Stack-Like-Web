/**
 * PixiJS 应用封装
 * PixiJS Application Wrapper
 * 
 * 封装 PixiJS Application 的创建和配置
 */

import { Application, Container, Ticker } from 'pixi.js'

export interface PixiAppOptions {
  container: HTMLElement
  background?: number
  resolution?: number
  antialias?: boolean
}

export class PixiApp {
  public app: Application
  private container: HTMLElement

  constructor(options: PixiAppOptions) {
    this.container = options.container
    
    this.app = new Application()
  }

  async init(options: Partial<PixiAppOptions> = {}): Promise<void> {
    const background = options.background ?? 0x1a1a2e
    const resolution = options.resolution ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
    const antialias = options.antialias ?? true

    await this.app.init({
      background,
      resizeTo: this.container,
      resolution,
      antialias,
      autoDensity: true,
    })

    this.container.appendChild(this.app.canvas)
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true })
  }

  get canvas(): HTMLCanvasElement {
    return this.app.canvas
  }

  get stage(): Container {
    return this.app.stage as Container
  }

  get ticker(): Ticker {
    return this.app.ticker
  }

  get screen() {
    return this.app.screen
  }
}
