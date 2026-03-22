<script setup lang="ts">
/**
 * PixiJS 卡牌拖拽演示
 * PixiJS Card Drag Demo
 * 
 * 演示 PixiJS 渲染卡牌和拖拽交互
 * Demonstrates PixiJS card rendering and drag interaction
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { Application, Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js'

// 卡牌数据类型
// Card data type
interface CardData {
  id: string
  x: number
  y: number
  name: string
  emoji: string
  color: number
}

// 演示卡牌数据
// Demo card data
const demoCards: CardData[] = [
  { id: '1', x: 100, y: 100, name: '木材', emoji: '🪵', color: 0x8B4513 },
  { id: '2', x: 250, y: 100, name: '石头', emoji: '🪨', color: 0x696969 },
  { id: '3', x: 400, y: 100, name: '浆果', emoji: '🫐', color: 0x4169E1 },
  { id: '4', x: 100, y: 280, name: '村民', emoji: '👨‍🌾', color: 0x228B22 },
  { id: '5', x: 250, y: 280, name: '金币', emoji: '🪙', color: 0xFFD700 },
  { id: '6', x: 400, y: 280, name: '食物', emoji: '🍖', color: 0xCD853F },
]

const containerRef = ref<HTMLDivElement>()

let app: Application | null = null
let worldContainer: Container | null = null   // 世界容器（可平移）
let gridContainer: Container | null = null   // 网格容器
let cardContainer: Container | null = null    // 卡牌容器
const cardSprites = new Map<string, Container>()

// 拖拽状态
// Drag state
let draggingSprite: Container | null = null
let dragOffset = { x: 0, y: 0 }

// 地图拖拽状态
// Map drag state
let isPanning = false
let panStart = { x: 0, y: 0 }
let panStartPos = { x: 0, y: 0 }

// 悬停状态
// Hover state
let hoveredSprite: Container | null = null
const originalIndices = new Map<Container, number>()

onMounted(async () => {
  if (!containerRef.value) return
  
  // 创建 PixiJS 应用
  // Create PixiJS application
  app = new Application()
  await app.init({
    background: 0x1a1a2e,
    resizeTo: containerRef.value,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })
  
  containerRef.value.appendChild(app.canvas)
  
  // 创建世界容器（用于平移视图）
  // Create world container (for panning view)
  worldContainer = new Container()
  app.stage.addChild(worldContainer)
  
  // 创建网格容器
  // Create grid container
  gridContainer = new Container()
  worldContainer.addChild(gridContainer)
  
  // 创建卡牌容器
  // Create card container
  cardContainer = new Container()
  worldContainer.addChild(cardContainer)
  
  // 绘制网格背景
  // Draw grid background
  drawGrid()
  
  // 创建所有卡牌
  // Create all cards
  for (const card of demoCards) {
    createCardSprite(card)
  }
  
  // 启用交互
  // Enable interaction
  app.stage.eventMode = 'static'
  app.stage.hitArea = app.screen
  
  // 背景拖拽事件（平移地图）
  // Background drag events (pan map)
  app.stage.on('pointerdown', handleStagePointerDown)
  app.stage.on('pointermove', handleStagePointerMove)
  app.stage.on('pointerup', handleStagePointerUp)
  app.stage.on('pointerupoutside', handleStagePointerUp)
})

// 绘制网格背景
// Draw grid background
function drawGrid() {
  if (!app || !gridContainer) return
  
  const gridGraphics = new Graphics()
  const gridSize = 40
  const width = 2000  // 更大的网格区域
  const height = 1500
  
  gridGraphics.setStrokeStyle({
    width: 1,
    color: 0x2a2a4a
  })
  
  // 绘制垂直线
  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    gridGraphics.moveTo(x, 0)
    gridGraphics.lineTo(x, height)
  }
  
  // 绘制水平线
  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    gridGraphics.moveTo(0, y)
    gridGraphics.lineTo(width, y)
  }
  
  gridGraphics.stroke()
  gridContainer.addChild(gridGraphics)
}

// 创建卡牌精灵
// Create card sprite
function createCardSprite(card: CardData): Container {
  if (!cardContainer) return new Container()
  
  const container = new Container()
  container.x = card.x
  container.y = card.y
  
  // 卡牌尺寸
  // Card dimensions
  const cardWidth = 80
  const cardHeight = 107
  const nameBarHeight = 32
  const borderRadius = 8
  
  // 绘制卡牌背景
  // Draw card background
  const bg = new Graphics()
    .roundRect(0, 0, cardWidth, cardHeight, borderRadius)
    .fill({ color: 0x2d3748 })
    .stroke({ color: 0x4a5568, width: 2 })
  container.addChild(bg)
  
  // 绘制名字栏
  // Draw name bar
  const nameBar = new Graphics()
    .roundRect(0, 0, cardWidth, nameBarHeight, borderRadius)
    .fill({ color: card.color })
  container.addChild(nameBar)
  
  // 绘制名字栏底部边框（覆盖圆角）
  // Draw name bar bottom border (cover rounded corners)
  const nameBarBottom = new Graphics()
    .rect(0, nameBarHeight - borderRadius, cardWidth, borderRadius)
    .fill({ color: card.color })
  container.addChild(nameBarBottom)
  
  // 绘制类型点
  // Draw type dot
  const dot = new Graphics()
    .circle(16, nameBarHeight / 2, 4)
    .fill({ color: 0xffffff })
  container.addChild(dot)
  
  // 绘制名字文本
  // Draw name text
  const nameText = new Text({
    text: card.name,
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: 'bold',
    }
  })
  nameText.x = 28
  nameText.y = (nameBarHeight - nameText.height) / 2
  container.addChild(nameText)
  
  // 绘制 emoji
  // Draw emoji
  const emojiText = new Text({
    text: card.emoji,
    style: {
      fontSize: 32,
    }
  })
  emojiText.anchor.set(0.5)
  emojiText.x = cardWidth / 2
  emojiText.y = nameBarHeight + (cardHeight - nameBarHeight) / 2
  container.addChild(emojiText)
  
  // 启用交互
  // Enable interaction
  container.eventMode = 'static'
  container.cursor = 'grab'
  
  // 存储卡牌数据
  // Store card data
  ;(container as any).cardData = card
  
  // 记录原始索引
  // Store original index
  originalIndices.set(container, cardContainer.children.length)
  
  // 指针按下事件
  // Pointer down event
  container.on('pointerdown', (e: FederatedPointerEvent) => {
    handleCardPointerDown(e, container)
  })
  
  // 指针悬停事件 - Z轴上浮
  // Pointer hover event - Z-axis lift
  container.on('pointerover', () => {
    handleCardHover(container, true)
  })
  
  container.on('pointerout', () => {
    handleCardHover(container, false)
  })
  
  cardContainer.addChild(container)
  cardSprites.set(card.id, container)
  
  return container
}

// 处理卡牌悬停 - Z轴上浮
// Handle card hover - Z-axis lift
function handleCardHover(sprite: Container, isHovering: boolean) {
  if (draggingSprite) return
  
  if (isHovering) {
    hoveredSprite = sprite
    // 记录当前索引并移动到最后（最上层）
    const currentIndex = cardContainer?.children.indexOf(sprite) ?? -1
    if (currentIndex !== -1 && cardContainer) {
      originalIndices.set(sprite, currentIndex)
      cardContainer.removeChild(sprite)
      cardContainer.addChild(sprite)
    }
    // 轻微上浮效果（通过稍微放大和改变透明度）
    sprite.alpha = 0.95
  } else {
    if (hoveredSprite === sprite) {
      hoveredSprite = null
    }
    // 恢复原始状态
    sprite.alpha = 1
  }
}

// 处理卡牌指针按下
// Handle card pointer down
function handleCardPointerDown(e: FederatedPointerEvent, sprite: Container) {
  // 取消悬停状态
  if (hoveredSprite && hoveredSprite !== sprite) {
    hoveredSprite.alpha = 1
    hoveredSprite = null
  }
  
  draggingSprite = sprite
  sprite.cursor = 'grabbing'
  
  // 计算拖拽偏移
  // Calculate drag offset
  const localPos = e.global
  // 需要考虑世界容器的变换
  const worldPos = toWorldPos(localPos.x, localPos.y)
  dragOffset.x = worldPos.x - sprite.x
  dragOffset.y = worldPos.y - sprite.y
  
  // 提升层级
  // Bring to front
  if (cardContainer) {
    cardContainer.removeChild(sprite)
    cardContainer.addChild(sprite)
  }
  
  // 视觉反馈
  // Visual feedback
  sprite.alpha = 0.8
  
  // 停止事件传播
  // Stop event propagation
  e.stopPropagation()
}

// 处理舞台指针按下
// Handle stage pointer down
function handleStagePointerDown(e: FederatedPointerEvent) {
  // 如果正在拖拽卡牌，不处理
  if (draggingSprite) return
  
  // 开始平移
  isPanning = true
  panStart.x = e.global.x
  panStart.y = e.global.y
  panStartPos.x = worldContainer?.x ?? 0
  panStartPos.y = worldContainer?.y ?? 0
  
  app!.stage.cursor = 'grabbing'
}

// 处理舞台指针移动
// Handle stage pointer move
function handleStagePointerMove(e: FederatedPointerEvent) {
  // 处理卡牌拖拽
  if (draggingSprite) {
    const localPos = e.global
    const worldPos = toWorldPos(localPos.x, localPos.y)
    draggingSprite.x = worldPos.x - dragOffset.x
    draggingSprite.y = worldPos.y - dragOffset.y
    
    // 更新卡牌数据
    const cardData = (draggingSprite as any).cardData as CardData
    if (cardData) {
      cardData.x = draggingSprite.x
      cardData.y = draggingSprite.y
    }
    return
  }
  
  // 处理地图平移
  if (isPanning && worldContainer) {
    const dx = e.global.x - panStart.x
    const dy = e.global.y - panStart.y
    worldContainer.x = panStartPos.x + dx
    worldContainer.y = panStartPos.y + dy
  }
}

// 处理舞台指针释放
// Handle stage pointer up
function handleStagePointerUp() {
  // 处理卡牌释放
  if (draggingSprite) {
    draggingSprite.cursor = 'grab'
    draggingSprite.alpha = 1
    draggingSprite = null
  }
  
  // 处理平移结束
  if (isPanning) {
    isPanning = false
    app!.stage.cursor = 'default'
  }
}

// 屏幕坐标转世界坐标
// Screen to world coordinates
function toWorldPos(screenX: number, screenY: number): { x: number; y: number } {
  if (!worldContainer) return { x: screenX, y: screenY }
  return {
    x: screenX - worldContainer.x,
    y: screenY - worldContainer.y
  }
}

// 清理
// Cleanup
onUnmounted(() => {
  if (app) {
    app.destroy(true)
    app = null
  }
  cardSprites.clear()
  originalIndices.clear()
})

// 返回首页
// Go back to home
const emit = defineEmits<{
  goBack: []
}>()
</script>

<template>
  <div class="pixi-demo">
    <div class="demo-header">
      <h2>PixiJS 卡牌拖拽演示</h2>
      <p>拖拽卡牌 / 拖拽背景移动地图 | Drag cards / Drag background to pan</p>
      <button class="back-btn" @click="emit('goBack')">← 返回首页</button>
    </div>
    <div ref="containerRef" class="pixi-container"></div>
    <div class="demo-info">
      <div class="info-item">
        <span class="label">渲染引擎:</span>
        <span class="value">PixiJS WebGL</span>
      </div>
      <div class="info-item">
        <span class="label">卡牌数量:</span>
        <span class="value">{{ demoCards.length }}</span>
      </div>
      <div class="info-item">
        <span class="label">交互:</span>
        <span class="value">拖拽卡牌、悬停上浮、拖拽背景平移</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pixi-demo {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f0f1a;
}

.demo-header {
  padding: 16px 24px;
  background: #1a1a2e;
  border-bottom: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  gap: 24px;
}

.demo-header h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.demo-header p {
  margin: 0;
  color: #888;
  font-size: 14px;
}

.back-btn {
  margin-left: auto;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #2563eb;
}

.pixi-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.demo-info {
  padding: 12px 24px;
  background: #1a1a2e;
  border-top: 1px solid #2a2a4a;
  display: flex;
  gap: 32px;
}

.info-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.info-item .label {
  color: #888;
}

.info-item .value {
  color: #3b82f6;
  font-weight: 500;
}
</style>
