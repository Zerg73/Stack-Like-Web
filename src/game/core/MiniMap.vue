<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { gameConfig } from '@/config/game'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const isDragging = ref(false)

// 小地图缩放比例
const minimapScale = computed(() => {
  const { width, height } = gameConfig.minimap
  const { viewport: viewportConfig } = gameConfig
  return Math.min(width / viewportConfig.width, height / viewportConfig.height)
})

const minimapStyle = computed(() => {
  return {
    width: `${gameConfig.viewport.width * minimapScale.value}px`,
    height: `${gameConfig.viewport.height * minimapScale.value}px`
  }
})

// 视口在小地图上的位置
const viewportRectStyle = computed(() => {
  const scale = minimapScale.value
  const { translateX, translateY, scale: viewportScale } = gameStore.viewport
  
  // 屏幕在世界坐标中的尺寸
  const viewWidth = window.innerWidth / viewportScale
  const viewHeight = window.innerHeight / viewportScale
  
  // 视口矩形在小地图上的尺寸
  const rectWidth = viewWidth * scale
  const rectHeight = viewHeight * scale
  
  // 视口矩形在小地图上的位置
  const rectX = -translateX * scale / viewportScale
  const rectY = -translateY * scale / viewportScale
  
  return {
    width: `${rectWidth}px`,
    height: `${rectHeight}px`,
    left: `${rectX}px`,
    top: `${rectY}px`
  }
})

function handleMouseDown(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  updateViewportFromMinimap(e)
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  updateViewportFromMinimap(e)
}

function handleMouseUp() {
  isDragging.value = false
}

function updateViewportFromMinimap(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  
  // 点击位置在小地图上的坐标
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top
  
  // 转换为世界坐标
  const worldX = clickX / minimapScale.value
  const worldY = clickY / minimapScale.value
  
  // 计算新的 translate，使点击位置居中
  const { scale: viewportScale } = gameStore.viewport
  const newTranslateX = -worldX * viewportScale + window.innerWidth / 2
  const newTranslateY = -worldY * viewportScale + window.innerHeight / 2
  
  gameStore.setTranslate(newTranslateX, newTranslateY)
}

// 获取卡牌在小地图上的位置
function getCardStyle(stack: typeof gameStore.currentMap.stacks[0]) {
  const firstCard = stack.cards[0]
  const scale = minimapScale.value
  
  // 世界坐标转小地图坐标
  // 注意：世界坐标原点在左下角，小地图原点在左上角
  const x = firstCard.x * scale
  const y = (gameConfig.viewport.height - firstCard.y) * scale
  
  return {
    left: `${x}px`,
    top: `${y}px`
  }
}

onMounted(() => {
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    class="minimap-container"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <div class="minimap" :style="minimapStyle">
      <div
        v-for="stack in gameStore.currentMap.stacks"
        :key="stack.id"
        class="minimap-card"
        :class="{ selected: gameStore.isStackSelected(stack.id) }"
        :style="getCardStyle(stack)"
      />
      <div class="minimap-viewport" :style="viewportRectStyle" />
    </div>
  </div>
</template>

<style scoped>
.minimap-container {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  z-index: 100;
}

.minimap {
  position: relative;
  background: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
}

.minimap-card {
  position: absolute;
  width: 8px;
  height: 10px;
  background: var(--color-border);
  border-radius: 2px;
}

.minimap-card.selected {
  background: var(--color-primary);
}

.minimap-viewport {
  position: absolute;
  border: 2px solid var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
  border-radius: 2px;
  pointer-events: none;
}
</style>
