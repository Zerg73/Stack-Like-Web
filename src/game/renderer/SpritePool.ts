/**
 * 精灵池
 * Sprite Pool
 * 
 * 复用 PixiJS 显示对象，减少创建/销毁开销
 */

export class SpritePool<T> {
  private available: T[] = []
  private inUse: Set<T> = new Set()
  private factory: () => T
  private reset: (item: T) => void
  private maxSize: number

  constructor(
    factory: () => T,
    reset: (item: T) => void,
    maxSize: number = 100
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize
  }

  /** 预创建精灵 */
  prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      this.available.push(this.factory())
    }
  }

  /** 获取精灵 */
  acquire(): T {
    let item: T
    
    if (this.available.length > 0) {
      item = this.available.pop()!
    } else if (this.inUse.size < this.maxSize) {
      item = this.factory()
    } else {
      // 超过最大池大小，创建一个新的
      item = this.factory()
    }
    
    this.inUse.add(item)
    return item
  }

  /** 归还精灵 */
  release(item: T): void {
    if (!this.inUse.has(item)) {
      return
    }
    
    this.inUse.delete(item)
    this.reset(item)
    this.available.push(item)
  }

  /** 释放所有精灵 */
  releaseAll(): void {
    for (const item of this.inUse) {
      this.reset(item)
      this.available.push(item)
    }
    this.inUse.clear()
  }

  /** 获取使用中的数量 */
  get inUseCount(): number {
    return this.inUse.size
  }

  /** 获取可用的数量 */
  get availableCount(): number {
    return this.available.length
  }

  /** 销毁池 */
  destroy(): void {
    this.releaseAll()
    this.available = []
  }
}

// 懒加载 CardSprite，避免循环依赖
let CardSpriteClass: any = null

function getCardSpriteClass() {
  if (!CardSpriteClass) {
    // 动态导入
    import('./CardSprite').then((module) => {
      CardSpriteClass = module.CardSprite
    })
  }
  return CardSpriteClass
}

/** 卡牌精灵池 */
export class CardSpritePool extends SpritePool<any> {
  constructor(maxSize: number = 200) {
    // 使用懒加载方式获取 CardSprite 类
    const factory = () => {
      const CardSprite = getCardSpriteClass()
      return new CardSprite()
    }
    
    const reset = (sprite: any) => {
      sprite.cardData = null
      sprite.stackData = null
      sprite.selected = false
      sprite.hovered = false
      sprite.dragging = false
      sprite.visible = false
    }
    
    super(factory, reset, maxSize)
  }
}
