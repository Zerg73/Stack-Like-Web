/**
 * 游戏引擎 - 核心模块
 * Game Engine - Core Module
 * 
 * 负责坐标系统管理，统一处理所有坐标转换
 * Manages coordinate system and handles all coordinate conversions
 * 业务代码只通过此模块进行坐标操作，避免直接计算
 * Business code should only use this module for coordinate operations
 */

import { gameConfig } from '@/config/game'

/**
 * 坐标系统说明 / Coordinate System Documentation
 * 
 * 1. 屏幕坐标 (Screen Coordinates):
 *    - 浏览器窗口坐标，原点在左上角
 *    - Browser window coordinates, origin at top-left corner
 *    - X 向右为正，Y 向下为正
 *    - X positive to the right, Y positive downward
 * 
 * 2. 世界坐标 (World Coordinates):
 *    - 游戏世界坐标，原点在地图左下角
 *    - Game world coordinates, origin at map bottom-left corner
 *    - X 向右为正，Y 向上为正
 *    - X positive to the right, Y positive upward
 *    - 地图右上角坐标为 (mapWidth, mapHeight)
 *    - Map top-right corner is at (mapWidth, mapHeight)
 *    - 与 CSS bottom 定位一致
 *    - Consistent with CSS bottom positioning
 * 
 * 3. 地图结构 / Map Structure:
 *    - 地图 = ground 区域（可放置卡牌区域）
 *    - Map = ground area (playable area for cards)
 *    - 地图尺寸：2560 x 1440
 *    - Map size: 2560 x 1440
 */
export class CoordinateModule {
  // ========== 配置参数 ==========
  
  /** 缩放比例 / Scale ratio */
  private _scale: number = 1
  
  /** X 轴平移（像素）/ X-axis translation (pixels) */
  private _translateX: number = 0
  
  /** Y 轴平移（像素）/ Y-axis translation (pixels) */
  private _translateY: number = 0
  
  /** 旋转角度（度）/ Rotation angle (degrees) */
  private _rotateX: number = 0
  
  /** 地图宽度 / Map width */
  private readonly _mapWidth: number
  
  /** 地图高度 / Map height */
  private readonly _mapHeight: number
  
  constructor() {
    this._mapWidth = gameConfig.viewport.width
    this._mapHeight = gameConfig.viewport.height
    this._scale = gameConfig.viewport.defaultScale
  }
  
  /**
   * 初始化视口位置
   * Initialize viewport position
   * 
   * 将地图居中显示在窗口中
   * Center the map in the window
   */
  initializeViewport(): void {
    this.centerMap()
  }
  
  /**
   * 将地图居中显示
   * Center the map in the viewport
   */
  centerMap(): void {
    const scaledMapWidth = this._mapWidth * this._scale
    const scaledMapHeight = this._mapHeight * this._scale
    
    // 计算居中位置
    // Calculate center position
    // transform-origin: left bottom，所以：
    // translateX 正值向右移动地图
    // translateY 正值向下移动地图
    this._translateX = (window.innerWidth - scaledMapWidth) / 2
    this._translateY = (window.innerHeight - scaledMapHeight) / 2
  }
  
  // ========== 属性访问器 / Property Accessors ==========
  
  /** 获取当前缩放比例 / Get current scale ratio */
  get scale(): number {
    return this._scale
  }
  
  /** 设置缩放比例 / Set scale ratio */
  set scale(value: number) {
    this._scale = Math.max(
      gameConfig.viewport.minScale,
      Math.min(gameConfig.viewport.maxScale, value)
    )
  }
  
  /** 获取 X 轴平移 / Get X-axis translation */
  get translateX(): number {
    return this._translateX
  }
  
  /** 获取 Y 轴平移 / Get Y-axis translation */
  get translateY(): number {
    return this._translateY
  }
  
  /** 获取旋转角度 / Get rotation angle */
  get rotateX(): number {
    return this._rotateX
  }
  
  /** 设置旋转角度 / Set rotation angle */
  set rotateX(value: number) {
    this._rotateX = value
  }
  
  /** 获取地图宽度 / Get map width */
  get mapWidth(): number {
    return this._mapWidth
  }
  
  /** 获取地图高度 / Get map height */
  get mapHeight(): number {
    return this._mapHeight
  }
  
  /** 获取世界坐标原点 / Get world coordinate origin (always 0, 0) */
  get worldOrigin(): { x: number; y: number } {
    return { x: 0, y: 0 }
  }
  
  /** 获取地图右上角的世界坐标 / Get map top-right world coordinates */
  get mapTopRight(): { x: number; y: number } {
    return { x: this._mapWidth, y: this._mapHeight }
  }
  
  /** 获取地图边界 / Get map bounds */
  get mapBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    return {
      minX: 0,
      maxX: this._mapWidth,
      minY: 0,
      maxY: this._mapHeight
    }
  }
  
  // ========== 核心坐标转换方法 / Core Coordinate Conversion Methods ==========
  
  /**
   * 屏幕坐标转世界坐标
   * Screen to world coordinate conversion
   * 
   * 世界坐标原点在地图左下角 (0, 0)
   * World coordinate origin is at map bottom-left corner (0, 0)
   * 
   * @param screenX 屏幕 X 坐标 / Screen X coordinate
   * @param screenY 屏幕 Y 坐标 / Screen Y coordinate
   * @returns 世界坐标 { x, y } / World coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    // 1. 减去平移
    // 1. Subtract translation
    let x = screenX - this._translateX
    let y = screenY - this._translateY
    
    // 2. 除以缩放
    // 2. Divide by scale
    x /= this._scale
    y /= this._scale
    
    // 3. 转换为世界坐标
    // 3. Convert to world coordinates
    // 世界坐标 X = CSS left 值
    // World coordinate X = CSS left value
    // 世界坐标 Y = CSS bottom 值 = mapHeight - 屏幕转换后的 Y
    // World coordinate Y = CSS bottom value = mapHeight - converted screen Y
    const worldX = x
    const worldY = this._mapHeight - y
    
    return { x: worldX, y: worldY }
  }
  
  /**
   * 世界坐标转屏幕坐标
   * World to screen coordinate conversion
   * 
   * @param worldX 世界 X 坐标 / World X coordinate
   * @param worldY 世界 Y 坐标 / World Y coordinate
   * @returns 屏幕坐标 { x, y } / Screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    // 1. 世界坐标转 CSS 坐标
    // 1. World coordinates to CSS coordinates
    // CSS left = 世界坐标 X
    // CSS left = world coordinate X
    // CSS bottom = 世界坐标 Y
    // CSS bottom = world coordinate Y
    // 屏幕Y = translateY + (mapHeight - CSS bottom) * scale
    // Screen Y = translateY + (mapHeight - CSS bottom) * scale
    let x = worldX * this._scale
    let y = (this._mapHeight - worldY) * this._scale
    
    // 2. 加上平移
    // 2. Add translation
    x += this._translateX
    y += this._translateY
    
    return { x, y }
  }
  
  /**
   * 屏幕坐标增量转世界坐标增量
   * Screen delta to world delta conversion
   * 
   * CSS bottom 定位 / CSS bottom positioning:
   * - bottom 值越大 → 元素越靠上
   * - larger bottom value → element is higher
   * - 鼠标向下移动 (dy > 0) → 希望 bottom 减小 → 世界 Y 减小
   * - mouse moves down (dy > 0) → want bottom to decrease → world Y decreases
   * - 所以需要反转 Y 轴：dy: -dy / scale
   * - so Y-axis needs to be inverted: dy: -dy / scale
   * 
   * @param dx 屏幕 X 增量 / Screen X delta
   * @param dy 屏幕 Y 增量 / Screen Y delta
   * @returns 世界坐标增量 { dx, dy } / World coordinate delta
   */
  screenDeltaToWorldDelta(dx: number, dy: number): { dx: number; dy: number } {
    return {
      dx: dx / this._scale,
      dy: -dy / this._scale  // Y 轴反转 / Y-axis inversion
    }
  }
  
  // ========== 变换样式 / Transform Style ==========
  
  /**
   * 生成 CSS transform 样式
   * Generate CSS transform style
   * 
   * @returns CSS transform 字符串 / CSS transform string
   */
  getTransformStyle(): string {
    const transforms: string[] = []
    
    transforms.push(`translate(${this._translateX}px, ${this._translateY}px)`)
    transforms.push(`scale(${this._scale})`)
    
    if (this._rotateX !== 0) {
      transforms.push(`rotateX(${this._rotateX}deg)`)
    }
    
    return transforms.join(' ')
  }
  
  // ========== 平移控制 / Translation Control ==========
  
  /**
   * 设置平移值
   * Set translation values
   * 
   * @param x X 轴平移 / X-axis translation
   * @param y Y 轴平移 / Y-axis translation
   */
  setTranslate(x: number, y: number): void {
    this._translateX = x
    this._translateY = y
  }
  
  /**
   * 获取平移边界
   * Get translation bounds
   * 
   * @returns 边界值 { minX, maxX, minY, maxY } / Boundary values
   */
  getTranslateBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    const scaledMapWidth = this._mapWidth * this._scale
    const scaledMapHeight = this._mapHeight * this._scale
    
    let minX: number, maxX: number
    if (scaledMapWidth > window.innerWidth) {
      minX = window.innerWidth - scaledMapWidth
      maxX = 0
    } else {
      minX = maxX = (window.innerWidth - scaledMapWidth) / 2
    }
    
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
   * Clamp translation within bounds
   */
  clampTranslate(): void {
    const bounds = this.getTranslateBounds()
    this._translateX = Math.max(bounds.minX, Math.min(bounds.maxX, this._translateX))
    this._translateY = Math.max(bounds.minY, Math.min(bounds.maxY, this._translateY))
  }
  
  // ========== 边界限制 / Boundary Clamping ==========
  
  /**
   * 限制卡牌位置在地图范围内
   * Clamp card position within map boundaries
   * 
   * 卡牌锚点位于左下角，使用 CSS left 和 bottom 定位
   * Card anchor is at bottom-left corner, using CSS left and bottom positioning
   * 
   * 地图边界：
   * Map boundaries:
   * - X: [0, mapWidth]
   * - Y: [0, mapHeight]
   * 
   * @param worldX 世界坐标 X（卡牌左边缘）/ World X coordinate (card left edge)
   * @param worldY 世界坐标 Y（卡牌底边缘）/ World Y coordinate (card bottom edge)
   * @param cardWidth 卡牌宽度（默认使用配置）/ Card width (default from config)
   * @param cardHeight 卡牌高度（默认使用配置）/ Card height (default from config)
   * @returns 限制后的世界坐标 / Clamped world coordinates
   */
  clampCardPosition(
    worldX: number,
    worldY: number,
    cardWidth: number = gameConfig.card.width,
    cardHeight: number = gameConfig.card.height
  ): { x: number; y: number } {
    // 地图边界
    // Map boundaries
    const clampedX = Math.max(0, Math.min(this._mapWidth - cardWidth, worldX))
    const clampedY = Math.max(0, Math.min(this._mapHeight - cardHeight, worldY))
    
    return { x: clampedX, y: clampedY }
  }
  
  /**
   * 检查世界坐标是否在地图范围内
   * Check if world coordinates are within map boundaries
   * 
   * @param worldX 世界 X 坐标 / World X coordinate
   * @param worldY 世界 Y 坐标 / World Y coordinate
   * @param width 元素宽度（可选）/ Element width (optional)
   * @param height 元素高度（可选）/ Element height (optional)
   * @returns 是否在地图范围内 / Whether within map boundaries
   */
  isInMapBounds(
    worldX: number,
    worldY: number,
    width: number = 0,
    height: number = 0
  ): boolean {
    return (
      worldX >= 0 &&
      worldX + width <= this._mapWidth &&
      worldY >= 0 &&
      worldY + height <= this._mapHeight
    )
  }
  
  // ========== 重置 / Reset ==========
  
  /**
   * 重置到默认状态
   * Reset to default state
   */
  reset(): void {
    this._scale = gameConfig.viewport.defaultScale
    this._translateX = 0
    this._translateY = 0
    this._rotateX = 0
  }
}
