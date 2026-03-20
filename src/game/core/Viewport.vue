<script setup lang="ts">
/**
 * 视口组件
 * 
 * 负责渲染游戏世界的可视区域
 * 处理缩放、平移等视口变换
 */

import { computed, ref, onMounted, onUnmounted } from 'vue'
import { gameConfig } from '@/config/game'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const containerRef = ref<HTMLElement | null>(null)

// 使用引擎的 transform 样式
const transformStyle = computed(() => ({
  transform: gameStore.engine.getTransformStyle()
}))

// 只有 rotateX 变化时才启用 transition，pan 时禁用
const animationStyle = computed(() => {
  // pan 状态下不使用 transition，让拖拽跟手
  if (gameStore.drag.isPanning) {
    return { transition: 'none' }
  }
  // rotateX 变化时使用平滑过渡
  return {
    transition: `transform ${gameConfig.perspective.animationDuration}ms ease-out`
  }
})

function handleWheel(e: WheelEvent) {
  e.preventDefault()

  const delta = e.deltaY > 0 ? -gameConfig.controls.zoomStep : gameConfig.controls.zoomStep
  gameStore.setScale(gameStore.viewport.scale + delta)
}

function handleMouseDown(e: MouseEvent) {
  if (e.button === 0) {
    gameStore.startPan(e.clientX, e.clientY)
  }
}

function handleMouseMove(e: MouseEvent) {
  gameStore.updatePan(e.clientX, e.clientY)
}

function handleMouseUp() {
  gameStore.endPan()
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
}

function setupTouchEvents() {
  if (!containerRef.value) return

  let lastDistance = 0

  function getDistance(touch1: Touch, touch2: Touch) {
    return Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
  }

  containerRef.value.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      gameStore.startPan(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      lastDistance = getDistance(e.touches[0], e.touches[1])
    }
  }, { passive: true })

  containerRef.value.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && gameStore.drag.isPanning) {
      gameStore.updatePan(e.touches[0].clientX, e.touches[0].clientY)
    } else if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const delta = (currentDistance - lastDistance) * 0.01
      gameStore.setScale(gameStore.viewport.scale + delta)
      lastDistance = currentDistance
    }
  }, { passive: true })

  containerRef.value.addEventListener('touchend', () => {
    gameStore.endPan()
  }, { passive: true })
}

onMounted(() => {
  setupTouchEvents()
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    ref="containerRef"
    class="viewport"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @contextmenu="handleContextMenu"
  >
    <div class="viewport-content" :style="{ ...transformStyle, ...animationStyle }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  cursor: grab;
  background: var(--color-background);
}

.viewport:active {
  cursor: grabbing;
}

.viewport-content {
  transform-origin: left bottom;
  will-change: transform;
}
</style>
