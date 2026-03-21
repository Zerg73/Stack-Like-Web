<script setup lang="ts">
import { computed } from 'vue'
import { gameConfig } from '@/config/game'
import { useGameStore } from '@/stores/gameStore'
import type { CardStack } from '@/game/types'
import { CardClickEvent, CardLongpressEvent, StackDragStartEvent, StackClickEvent } from '@/game/events'
import CardStackComponent from './CardStack.vue'

const props = defineProps<{
  stacks: CardStack[]
  selectedStacks: string[]
  draggingStackId: string | null
}>()

const emit = defineEmits<{
  cardClick: [event: CardClickEvent]
  cardLongpress: [event: CardLongpressEvent]
  stackDragStart: [event: StackDragStartEvent]
}>()

const gameStore = useGameStore()

const { width, height } = gameConfig.viewport

// ground 区域样式（地图区域）
// Ground area style (map area)
const groundStyle = computed(() => {
  return {
    width: `${width}px`,
    height: `${height}px`
  }
})

// 检查是否是拖拽目标
function isDropTarget(stackId: string): boolean {
  return gameStore.dropTarget?.id === stackId
}

// 处理堆叠点击
function handleStackClick(event: StackClickEvent) {
  const topCard = event.stack.cards[event.stack.cards.length - 1]
  if (topCard) {
    emit('cardClick', new CardClickEvent(topCard, event.stack, event.mouseEvent, 'CardGrid'))
  }
}

// 处理堆叠拖拽开始
function handleStackDragStart(event: StackDragStartEvent) {
  emit('stackDragStart', event)
}
</script>

<template>
  <div class="card-grid" :style="groundStyle">
    <CardStackComponent
      v-for="stack in stacks"
      :key="stack.id"
      :stack="stack"
      :selected="selectedStacks.includes(stack.id)"
      :is-dragging="draggingStackId === stack.id"
      :is-drop-target="isDropTarget(stack.id)"
      :can-drop="gameStore.canDropOnTarget"
      @click="handleStackClick"
      @drag-start="handleStackDragStart"
    />
  </div>
</template>

<style scoped>
.card-grid {
  position: absolute;
  bottom: 0;
  left: 0;
  transform-origin: left bottom;
  background-color: rgba(34, 197, 94, 0.15);
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}
</style>
