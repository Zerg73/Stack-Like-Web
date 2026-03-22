<script setup lang="ts">
/**
 * 拖拽层组件
 * Drag Layer Component
 * 
 * 用于渲染正在拖拽的卡牌，层级高于面板
 * Renders dragging cards, layer above panels
 */

import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { getCardColor } from '@/config/cardTypes'

const gameStore = useGameStore()

// 名字栏高度 / Name strip height
const NAME_STRIP_HEIGHT = 32

// 内容区高度 / Content area height
const CONTENT_HEIGHT = 75

// Viewport 容器的屏幕位置 / Viewport container screen position
const viewportRect = ref<DOMRect | null>(null)

// 正在拖拽的堆叠 ID
const draggingStackId = computed(() => gameStore.draggingStackId)

// 获取正在拖拽的堆叠
const draggingStack = computed(() => {
  if (!draggingStackId.value) return null
  return gameStore.currentMap.stacks.find(s => s.id === draggingStackId.value)
})

// 计算卡牌堆叠的总高度
// Calculate total height of card stack
const totalHeight = computed(() => {
  if (!draggingStack.value) return 0
  const cardCount = draggingStack.value.cards.length
  // 总高度 = 名字栏高度 * 卡牌数 + 内容区高度（只有顶层有）
  // Total height = name strip height * card count + content height (only top card has)
  return cardCount * NAME_STRIP_HEIGHT + CONTENT_HEIGHT
})

// 将世界坐标转换为屏幕坐标（相对于浏览器视口）
// Convert world coordinates to screen coordinates (relative to browser viewport)
const screenPosition = computed(() => {
  if (!draggingStack.value) return null
  
  const card = draggingStack.value.cards[0]
  if (!card) return null
  
  // 使用 gameStore 的坐标转换方法（相对于 Viewport 容器）
  // Use gameStore's coordinate conversion (relative to Viewport container)
  const viewportPos = gameStore.worldToScreen(card.x, card.y)
  
  // 加上 Viewport 容器在浏览器视口中的位置
  // Add Viewport container's position in browser viewport
  if (viewportRect.value) {
    return {
      x: viewportRect.value.left + viewportPos.x,
      y: viewportRect.value.top + viewportPos.y
    }
  }
  
  return viewportPos
})

// 卡牌样式（使用屏幕坐标）
// Card style (using screen coordinates)
const cardStyle = computed(() => {
  if (!screenPosition.value || !draggingStack.value) return {}
  
  return {
    position: 'fixed' as const,
    left: `${screenPosition.value.x}px`,
    top: `${screenPosition.value.y - totalHeight.value}px`,
    width: '80px',
    height: `${totalHeight.value}px`,
    zIndex: 10000,
    pointerEvents: 'none' as const
  }
})

/**
 * 计算每张卡牌的偏移样式（使用 top 定位）
 * Calculate offset style for each card (using top positioning)
 */
function getCardOffsetStyle(index: number, _isTop: boolean) {
  // 从顶部向下偏移
  // Offset from top going down
  const top = index * NAME_STRIP_HEIGHT
  
  return {
    position: 'absolute' as const,
    left: '0',
    top: `${top}px`,
    zIndex: index + 1
  }
}

// 更新 Viewport 容器的位置 / Update Viewport container position
function updateViewportRect() {
  const viewport = document.querySelector('.viewport')
  if (viewport) {
    viewportRect.value = viewport.getBoundingClientRect()
  }
}

onMounted(() => {
  updateViewportRect()
  window.addEventListener('resize', updateViewportRect)
  window.addEventListener('scroll', updateViewportRect)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportRect)
  window.removeEventListener('scroll', updateViewportRect)
})
</script>

<template>
  <div v-if="draggingStack && screenPosition" class="drag-layer">
    <div :style="cardStyle" class="dragging-cards">
      <!-- 渲染拖拽中的卡牌 / Render dragging card -->
      <div
        v-for="(card, index) in draggingStack.cards"
        :key="card.id"
        class="drag-card"
        :class="{ 'is-top': index === draggingStack.cards.length - 1 }"
        :style="getCardOffsetStyle(index, index === draggingStack.cards.length - 1)"
      >
        <div class="name-strip" :style="{ background: getCardColor(card.typeId) }">
          <span class="type-dot"></span>
          <span class="name">{{ card.nameKey ? $t(card.nameKey) : card.name }}</span>
        </div>
        <div v-if="index === draggingStack.cards.length - 1" class="content">
          <span class="emoji">{{ card.emoji }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drag-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
}

.dragging-cards {
  position: relative;
}

.drag-card {
  position: absolute;
  left: 0;
  width: 80px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  user-select: none;
  pointer-events: none;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
}

.drag-card.is-top {
  height: 107px;
  background: linear-gradient(180deg, rgba(40, 40, 50, 0.95), rgba(30, 30, 40, 0.95));
}

.drag-card:not(.is-top) {
  height: 32px;
}

.name-strip {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 6px;
  flex-shrink: 0;
  border-radius: 6px 6px 0 0;
}

.drag-card:not(.is-top) .name-strip {
  border-radius: 6px;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.name {
  font-size: 12px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
}

.emoji {
  font-size: 32px;
}
</style>
