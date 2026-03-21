<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { gameConfig } from '@/config/game'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const isDragging = ref(false)

const mapHeight = gameConfig.viewport.height

const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

function updateWindowSize() {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

const viewportWorldWidth = computed(() => windowWidth.value / gameStore.viewport.scale)
const viewportWorldHeight = computed(() => windowHeight.value / gameStore.viewport.scale)

const viewportBottomLeft = computed(() => {
  const { translateX, translateY, scale } = gameStore.viewport
  const worldX = -translateX / scale
  const worldY = mapHeight - (windowHeight.value - translateY) / scale
  return { x: worldX, y: worldY }
})

const minimapScale = computed(() => {
  const { width } = gameConfig.minimap
  return width / viewportWorldWidth.value
})

const minimapStyle = computed(() => {
  const height = viewportWorldHeight.value * minimapScale.value
  return {
    width: `${gameConfig.minimap.width}px`,
    height: `${height}px`
  }
})

const visibleStacks = computed(() => {
  const { x: viewX, y: viewY } = viewportBottomLeft.value
  const viewWidth = viewportWorldWidth.value
  const viewHeight = viewportWorldHeight.value
  
  const padding = gameConfig.card.width
  
  return gameStore.currentMap.stacks.filter(stack => {
    const card = stack.cards[0]
    if (!card) return false
    return (
      card.x >= viewX - padding &&
      card.x <= viewX + viewWidth + padding &&
      card.y >= viewY - padding &&
      card.y <= viewY + viewHeight + padding
    )
  })
})

function getCardStyle(stack: typeof gameStore.currentMap.stacks[0]) {
  const firstCard = stack.cards[0]
  if (!firstCard) return {}
  
  const scale = minimapScale.value
  const { x: viewX, y: viewY } = viewportBottomLeft.value
  
  const relX = (firstCard.x - viewX) * scale
  const relY = (firstCard.y - viewY) * scale
  
  const cardCount = stack.cards.length
  const baseSize = 8
  const sizeMultiplier = Math.min(1 + cardCount * 0.1, 2)
  const cardSize = baseSize * sizeMultiplier
  
  return {
    left: `${relX}px`,
    bottom: `${relY}px`,
    width: `${cardSize}px`,
    height: `${cardSize * 1.25}px`,
    opacity: Math.min(0.5 + cardCount * 0.1, 1)
  }
}

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

function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  updateViewportFromMinimap(e.touches[0])
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  updateViewportFromMinimap(e.touches[0])
}

function handleTouchEnd() {
  isDragging.value = false
}

function updateViewportFromMinimap(clientPos: { clientX: number; clientY: number }) {
  const minimapEl = document.querySelector('.minimap') as HTMLElement
  if (!minimapEl) return
  
  const rect = minimapEl.getBoundingClientRect()
  
  const clickX = clientPos.clientX - rect.left
  const clickY = clientPos.clientY - rect.top
  
  const minimapHeight = rect.height
  
  const relX = clickX
  const relY = minimapHeight - clickY
  
  const worldX = viewportBottomLeft.value.x + relX / minimapScale.value
  const worldY = viewportBottomLeft.value.y + relY / minimapScale.value
  
  const { scale: viewportScale } = gameStore.viewport
  const newTranslateX = -worldX * viewportScale + windowWidth.value / 2
  const newTranslateY = (worldY - mapHeight) * viewportScale + windowHeight.value / 2
  
  gameStore.engine.coordinate.setTranslate(newTranslateX, newTranslateY)
  gameStore.engine.coordinate.clampTranslate()
}

onMounted(() => {
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('resize', updateWindowSize)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('resize', updateWindowSize)
})
</script>

<template>
  <div
    class="minimap-container"
    :class="{ dragging: isDragging }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div class="minimap" :style="minimapStyle">
      <div
        v-for="stack in visibleStacks"
        :key="stack.id"
        class="minimap-card"
        :class="{ selected: gameStore.isStackSelected(stack.id) }"
        :style="getCardStyle(stack)"
      >
        <span v-if="stack.cards.length > 1" class="stack-count">
          {{ stack.cards.length }}
        </span>
      </div>
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
  transition: box-shadow 0.2s ease;
}

.minimap-container.dragging {
  box-shadow: 0 0 0 2px var(--color-primary);
}

.minimap {
  position: relative;
  background: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
}

.minimap-card {
  position: absolute;
  min-width: 8px;
  min-height: 10px;
  background: var(--color-border);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.1s, height 0.1s, opacity 0.1s;
}

.minimap-card.selected {
  background: var(--color-primary);
}

.stack-count {
  font-size: 8px;
  font-weight: bold;
  color: var(--color-background);
  line-height: 1;
}
</style>
