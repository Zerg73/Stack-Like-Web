/**
 * 游戏引擎 - 核心模块
 * 
 * 负责坐标系统管理，统一处理所有坐标转换
 * 业务代码只通过此模块进行坐标操作，避免直接计算
 */

import { gameConfig } from '@/config/game'

/**
 * 坐标系统说明：
 * 
 * 1. 屏幕坐标 (Screen): 
 *    - 浏览器窗口坐标，原点在左上角
 *    - X 向右为正，Y 向下为正
 * 
 * 2. 世界坐标 (World):
 *    - 游戏世界坐标，原点在地图左下角
 *    - X 向右为正，Y 向上为正
 *    - 与 CSS bottom 定位一致
 * 
 * 3. 网格坐标 (Grid):
 *    - 用于对齐到网格的坐标
 *    - gridX = worldX / cellWidth
 *    - gridY = worldY / cellHeight
 */
export class CoordinateModule {
  /** 缩放比例 */
  private _scale: number = 1
  
  /** X 轴平移（像素） */
  private _translateX: number = 0
  
  /** Y 轴平移（像素） */
  private _translateY: number = 0
  
  /** 旋转角度（度） */
  private _rotateX: number = 0
  
  /** 地图宽度 */
  private readonly _mapWidth: number
  
  /** 地图高度 */
  private readonly _mapHeight: number
  
  constructor() {
    this._mapWidth = gameConfig.viewport.width
    this._mapHeight = gameConfig.viewport.height
    this._scale = gameConfig.viewport.defaultScale
  }
  
  // ========== 属性访问器 ==========
  
  /** 获取当前缩放比例 */
  get scale(): number {
    return this._scale
  }
  
  /** 设置缩放比例 */
  set scale(value: number) {
    this._scale = Math.max(
      gameConfig.viewport.minScale,
      Math.min(gameConfig.viewport.maxScale, value)
    )
  }
  
  /** 获取 X 轴平移 */
  get translateX(): number {
    return this._translateX
  }
  
  /** 获取 Y 轴平移 */
  get translateY(): number {
    return this._translateY
  }
  
  /** 获取旋转角度 */
  get rotateX(): number {
    return this._rotateX
  }
  
  /** 设置旋转角度 */
  set rotateX(value: number) {
    this._rotateX = value
  }
  
  /** 获取地图宽度 */
  get mapWidth(): number {
    return this._mapWidth
  }
  
  /** 获取地图高度 */
  get mapHeight(): number {
    return this._mapHeight
  }
  
  // ========== 核心坐标转换方法 ==========
  
  /**
   * 屏幕坐标转世界坐标
   * @param screenX 屏幕 X 坐标
   * @param screenY 屏幕 Y 坐标
   * @returns 世界坐标 { x, y }
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    // 1. 减去平移
    let x = screenX - this._translateX
    let y = screenY - this._translateY
    
    // 2. 除以缩放
    x /= this._scale
    y /= this._scale
    
    // 3. Y 轴反转（屏幕 Y 向下，世界 Y 向上）
    // CSS bottom 定位：bottom 值越大，元素越靠上
    // 所以世界 Y = 地图高度 - 屏幕转换后的 Y
    y = this._mapHeight - y
    
    return { x, y }
  }
  
  /**
   * 世界坐标转屏幕坐标
   * @param worldX 世界 X 坐标
   * @param worldY 世界 Y 坐标
   * @returns 屏幕坐标 { x, y }
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    // 1. Y 轴反转
    let y = this._mapHeight - worldY
    
    // 2. 乘以缩放
    let x = worldX * this._scale
    y *= this._scale
    
    // 3. 加上平移
    x += this._translateX
    y += this._translateY
    
    return { x, y }
  }
  
  /**
   * 屏幕坐标增量转世界坐标增量
   * 
   * CSS bottom 定位：
   * - bottom 值越大 → 元素越靠上
   * - 鼠标向下移动 (dy > 0) → 希望 bottom 减小 → 世界 Y 减小
   * - 所以需要反转 Y 轴：dy: -dy / scale
   * 
   * @param dx 屏幕 X 增量
   * @param dy 屏幕 Y 增量
   * @returns 世界坐标增量 { dx, dy }
   */
  screenDeltaToWorldDelta(dx: number, dy: number): { dx: number; dy: number } {
    return {
      dx: dx / this._scale,
      dy: -dy / this._scale  // Y 轴反转：鼠标向下 → 世界 Y 减小 → bottom 减小
    }
  }
  
  /**
   * 世界坐标转网格坐标
   * @param worldX 世界 X 坐标
   * @param worldY 世界 Y 坐标
   * @returns 网格坐标 { gridX, gridY }
   */
  worldToGrid(worldX: number, worldY: number): { gridX: number; gridY: number } {
    const { cellWidth, cellHeight } = gameConfig.grid
    return {
      gridX: Math.floor(worldX / cellWidth),
      gridY: Math.floor(worldY / cellHeight)
    }
  }
  
  /**
   * 网格坐标转世界坐标（返回格子中心点）
   * @param gridX 网格 X 坐标
   * @param gridY 网格 Y 坐标
   * @returns 世界坐标 { x, y }
   */
  gridToWorld(gridX: number, gridY: number): { x: number; y: number } {
    const { cellWidth, cellHeight } = gameConfig.grid
    return {
      x: gridX * cellWidth + cellWidth / 2,
      y: gridY * cellHeight + cellHeight / 2
    }
  }
  
  /**
   * 屏幕坐标转网格坐标
   * @param screenX 屏幕 X 坐标
   * @param screenY 屏幕 Y 坐标
   * @returns 网格坐标 { gridX, gridY }
   */
  screenToGrid(screenX: number, screenY: number): { gridX: number; gridY: number } {
    const world = this.screenToWorld(screenX, screenY)
    return this.worldToGrid(world.x, world.y)
  }
  
  // ========== 变换样式 ==========
  
  /**
   * 生成 CSS transform 样式
   * @returns CSS transform 字符串
   */
  getTransformStyle(): string {
    const transforms: string[] = []
    
    // 平移
    transforms.push(`translate(${this._translateX}px, ${this._translateY}px)`)
    
    // 缩放
    transforms.push(`scale(${this._scale})`)
    
    // 旋转
    if (this._rotateX !== 0) {
      transforms.push(`rotateX(${this._rotateX}deg)`)
    }
    
    return transforms.join(' ')
  }
  
  // ========== 平移控制 ==========
  
  /**
   * 设置平移值
   * @param x X 轴平移
   * @param y Y 轴平移
   */
  setTranslate(x: number, y: number): void {
    this._translateX = x
    this._translateY = y
  }
  
  /**
   * 获取平移边界
   * @returns 边界值 { minX, maxX, minY, maxY }
   */
  getTranslateBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    // 地图在屏幕上的实际尺寸
    const scaledMapWidth = this._mapWidth * this._scale
    const scaledMapHeight = this._mapHeight * this._scale
    
    // X 轴边界
    let minX: number, maxX: number
    if (scaledMapWidth > window.innerWidth) {
      minX = window.innerWidth - scaledMapWidth
      maxX = 0
    } else {
      minX = maxX = (window.innerWidth - scaledMapWidth) / 2
    }
    
    // Y 轴边界
    let minY: number, maxY: number
    if (scaledMapHeight > window.innerHeight) {
      minY = window.innerHeight - scaledMapHeight
      maxY = 0
    } else {
      minY = maxY = (window.innerHeight - scaledMapHeight) / 2
    }
    
    return { minX, maxX, minY, maxY }
  }
  
  /**
   * 限制平移值在边界内
   */
  clampTranslate(): void {
    const bounds = this.getTranslateBounds()
    this._translateX = Math.max(bounds.minX, Math.min(bounds.maxX, this._translateX))
    this._translateY = Math.max(bounds.minY, Math.min(bounds.maxY, this._translateY))
  }
  
  // ========== 重置 ==========
  
  /**
   * 重置到默认状态
   */
  reset(): void {
    this._scale = gameConfig.viewport.defaultScale
    this._translateX = 0
    this._translateY = 0
    this._rotateX = 0
  }
}
