<script setup lang="ts">
/**
 * 卡牌堆叠组件
 * Card Stack Component
 * 
 * 显示一堆堆叠的卡牌，处理堆叠的渲染和交互
 * Display a stack of cards, handle rendering and interaction
 */

import { computed } from 'vue'
import type { CardStack as CardStackType } from '@/game/types'
import { StackClickEvent, StackDragStartEvent } from '@/game/events'
import Card from './Card.vue'

/** 名字栏高度 / Name strip height */
const NAME_STRIP_HEIGHT = 32

/** 内容区高度 / Content area height */
const CONTENT_HEIGHT = 75

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
// Stack position (using bottom card position, cards[0])
// 卡牌存储的是世界坐标，CSS 定位直接使用世界坐标
// Card stores world coordinates, CSS positioning uses world coordinates directly
const stackStyle = computed(() => {
  if (props.stack.cards.length === 0) return {}

  const bottomCard = props.stack.cards[0]
  
  // 拖拽中的堆叠应该显示在最上层
  // Dragging stack should be on top
  const baseZIndex = props.isDragging ? 10000 : bottomCard.y
  
  // CSS 坐标 = 世界坐标（地图就是 ground 区域，没有偏移）
  // CSS coordinate = world coordinate (map is ground area, no offset)
  return {
    left: `${bottomCard.x}px`,
    bottom: `${bottomCard.y}px`,
    zIndex: baseZIndex
  }
})

/**
 * 计算每张卡牌的偏移样式
 * Calculate offset style for each card
 * 
 * 锚点在卡牌左下角，名字栏在卡牌顶部
 * Anchor at bottom-left corner, name strip at top of card
 * 
 * CSS bottom: 正值向上，负值向下
 * CSS bottom: positive = up, negative = down
 * 
 * 渲染顺序（从下到上）：
 * Rendering order (bottom to top):
 * - card0 名字栏: bottom=0
 * - card1 名字栏: bottom=-32
 * - card2 名字栏: bottom=-64 (顶层)
 * - card2 内容区: bottom=-139 (顶层，向下延伸75px)
 * 
 * 计算公式：
 * Formula:
 * - 非顶层卡牌: bottom = -index * NAME_STRIP_HEIGHT
 * - 顶层卡牌: bottom = -index * NAME_STRIP_HEIGHT - CONTENT_HEIGHT
 *   (因为内容区在名字栏下方，需要向下偏移)
 */
function getCardStyle(index: number, isTop: boolean) {
  // 基础偏移：每张卡牌的名字栏高度（负值向下）
  // Base offset: name strip height (negative = down in CSS)
  let bottom = -index * NAME_STRIP_HEIGHT
  
  // 顶层卡牌需要额外向下偏移内容区高度
  // Top card needs extra offset for content area
  if (isTop) {
    bottom -= CONTENT_HEIGHT
  }
  
  return {
    bottom: `${bottom}px`,
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
    :data-stack-id="stack.id"
    @click.stop="handleStackClick"
  >
    <div
      v-for="(card, index) in stack.cards"
      :key="card.id"
      class="stack-item"
      :style="getCardStyle(index, index === stack.cards.length - 1)"
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
  bottom: 0;
}
</style>
