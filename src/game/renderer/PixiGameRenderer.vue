<script setup lang="ts">
/**
 * PixiJS 游戏渲染组件
 * PixiJS Game Renderer Component
 * 
 * 将 PixiJS 渲染器集成到 Vue 组件中
 */

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { PixiGameRenderer } from '../renderer'
import type { CardStack, GameCard } from '@/game/types'
import { useGameStore } from '@/stores/gameStore'

const props = defineProps<{
  stacks: CardStack[]
  selectedStacks: string[]
}>()

const emit = defineEmits<{
  cardClick: [stackId: string, cardId: string]
  stackDragStart: [stackId: string, cardIndex: number, worldX: number, worldY: number]
  stackDragMove: [stackId: string, cardIndex: number, worldX: number, worldY: number]
  stackDragEnd: [stackId: string, cardIndex: number, worldX: number, worldY: number]
  stageClick: []
}>()

const containerRef = ref<HTMLDivElement>()
const gameStore = useGameStore()

let renderer: PixiGameRenderer | null = null

onMounted(async () => {
  if (!containerRef.value) return

  // 创建渲染器
  renderer = new PixiGameRenderer({
    container: containerRef.value,
  })

  await renderer.init()

  // 初始渲染卡牌
  updateCardRender()

  // 注册事件回调
  renderer.on('cardDragStart', (_card: GameCard, stack: CardStack, worldX: number, worldY: number) => {
    emit('stackDragStart', stack.id, 0, worldX, worldY)
  })

  renderer.on('cardDragMove', (_card: GameCard, stack: CardStack, worldX: number, worldY: number) => {
    emit('stackDragMove', stack.id, 0, worldX, worldY)
  })

  renderer.on('cardDragEnd', (_card: GameCard, stack: CardStack, worldX: number, worldY: number) => {
    emit('stackDragEnd', stack.id, 0, worldX, worldY)
  })

  renderer.on('stageClick', () => {
    emit('stageClick')
  })

  // 监听视口状态变化
  watch(() => gameStore.viewport, (viewport) => {
    renderer?.setViewportState({
      scale: viewport.scale,
      translateX: viewport.translateX,
      translateY: viewport.translateY,
    })
  }, { deep: true })
})

// 监听堆叠变化，更新渲染
watch(() => props.stacks, () => {
  updateCardRender()
}, { deep: true })

// 监听选中状态变化
watch(() => props.selectedStacks, () => {
  updateCardRender()
}, { deep: true })

function updateCardRender() {
  if (!renderer) return
  renderer.updateStacks(props.stacks, props.selectedStacks)
}

// 暴露方法给父组件
defineExpose({
  zoom: (delta: number) => renderer?.zoom(delta),
  pan: (dx: number, dy: number) => renderer?.pan(dx, dy),
  setScale: (scale: number) => renderer?.setScale(scale),
  setPan: (x: number, y: number) => renderer?.setPan(x, y),
  screenToWorld: (x: number, y: number) => renderer?.screenToWorld(x, y),
  worldToScreen: (x: number, y: number) => renderer?.worldToScreen(x, y),
  getViewportState: () => renderer?.getViewportState(),
  isDragging: () => renderer?.isDragging ?? false,
})

// 清理
onUnmounted(() => {
  renderer?.destroy()
  renderer = null
})
</script>

<template>
  <div ref="containerRef" class="pixi-game-container"></div>
</template>

<style scoped>
.pixi-game-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

.pixi-game-container :deep(canvas) {
  display: block;
}
</style>
