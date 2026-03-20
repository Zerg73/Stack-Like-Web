<script setup lang="ts">
/**
 * 卡牌堆叠组件
 * 
 * 显示一堆堆叠的卡牌，处理堆叠的渲染和交互
 */

import { computed } from 'vue'
import type { CardStack as CardStackType } from '@/game/types'
import { StackClickEvent, StackDragStartEvent } from '@/game/events'
import { STACK_OFFSET } from '@/game/engine'
import Card from './Card.vue'

const props = defineProps<{
  stack: CardStackType
  selected: boolean
  isDragging?: boolean
  isDropTarget?: boolean
  canDrop?: boolean
}>()

// 使用事件对象类型
const emit = defineEmits<{
  click: [event: StackClickEvent]
  dragStart: [event: StackDragStartEvent]
}>()

// 堆叠位置（使用最底层卡牌的位置，即 cards[0]）
const stackStyle = computed(() => {
  if (props.stack.cards.length === 0) return {}

  const bottomCard = props.stack.cards[0]
  // 拖拽中的堆叠应该显示在最上层
  const baseZIndex = props.isDragging ? 10000 : bottomCard.y
  return {
    left: `${bottomCard.x}px`,
    bottom: `${bottomCard.y}px`,
    zIndex: baseZIndex
  }
})

// 计算每张卡牌的偏移样式
// 数组顺序：index=0 是最底层卡牌，index 越大越靠上
// 原点在左下角，上层卡牌的 offsetY 为负值（向下偏移）
function getCardStyle(index: number) {
  return {
    bottom: `${-index * STACK_OFFSET}px`,
    zIndex: index + 1  // index 越大 zIndex 越大，显示在上层
  }
}

// 处理堆叠点击 - 创建事件对象
function handleStackClick(e: MouseEvent) {
  emit('click', new StackClickEvent(props.stack, e, 'CardStack'))
}

// 处理卡牌拖拽开始 - 创建事件对象
function handleCardDragStart(e: MouseEvent, cardIndex: number) {
  emit('dragStart', new StackDragStartEvent(props.stack, cardIndex, e, 'CardStack'))
}
</script>

<template>
  <div
    class="card-stack"
    :class="{ 
      selected, 
      dragging: isDragging,
      'drop-target': isDropTarget,
      'can-drop': canDrop
    }"
    :style="stackStyle"
    @click.stop="handleStackClick"
  >
    <div
      v-for="(card, index) in stack.cards"
      :key="card.id"
      class="stack-item"
      :style="getCardStyle(index)"
    >
      <Card
        :card="card"
        :is-selected="selected"
        :is-top="index === stack.cards.length - 1"
        :card-index="index"
        :is-drop-target="isDropTarget"
        :can-drop="canDrop"
        @click.stop="(e: MouseEvent) => handleStackClick(e)"
        @drag-start="(e) => handleCardDragStart(e, index)"
      />
    </div>
  </div>
</template>

<style scoped>
.card-stack {
  position: absolute;
  cursor: move;
}

.card-stack:hover {
  z-index: 100;
}

.card-stack.dragging {
  opacity: 0.8;
  cursor: grabbing;
}

.card-stack.drop-target.can-drop {
  box-shadow: 0 0 0 3px #22c55e;
}

.card-stack.drop-target:not(.can-drop) {
  box-shadow: 0 0 0 3px #ef4444;
}

.stack-item {
  position: absolute;
  left: 0;
}
</style>
