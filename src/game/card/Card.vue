<script setup lang="ts">
import { computed } from 'vue'
import { getCardColor } from '@/config/cardTypes'
import type { GameCard } from '@/game/types'

const props = defineProps<{
  card: GameCard
  isSelected: boolean
  isTop: boolean
  cardIndex: number       // 卡牌在堆叠中的索引
  isDropTarget?: boolean  // 是否是拖拽目标
  canDrop?: boolean       // 是否可以放置
}>()

// Card 组件只触发原始鼠标事件，由 CardStack 创建事件对象
const emit = defineEmits<{
  click: [event: MouseEvent]
  dragStart: [event: MouseEvent]
}>()

const typeColor = computed(() => getCardColor(props.card.typeId))

const cardStyle = computed(() => ({
  width: '80px',
  // 最顶层的卡牌完整渲染(107px)，其他卡牌仅渲染名称栏(32px)
  height: props.isTop ? '107px' : '32px',
  background: props.isTop ? 'var(--color-surface)' : typeColor.value,
  borderColor: props.isDropTarget 
    ? (props.canDrop ? '#22c55e' : '#ef4444')
    : (props.isSelected ? 'var(--color-primary)' : 'var(--color-border)'),
}))

// 名字栏鼠标按下事件
function handleNameStripMouseDown(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragStart', e)
}

// 内容区域鼠标按下事件（只有最底层卡牌有内容区域）
function handleContentMouseDown(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragStart', e)
}
</script>

<template>
  <div
    class="card"
    :class="{ 
      selected: isSelected, 
      'is-top': isTop,
      'drop-target': isDropTarget,
      'can-drop': canDrop
    }"
    :style="cardStyle"
    @click.stop="emit('click', $event)"
  >
    <div 
      class="name-strip" 
      :style="{ background: typeColor }"
      @mousedown="handleNameStripMouseDown"
    >
      <span class="type-dot"></span>
      <span class="name">{{ card.name }}</span>
    </div>

    <!-- 内容区域（只有最顶层卡牌显示） -->
    <div v-if="isTop" class="content" @mousedown="handleContentMouseDown">
      <span class="emoji">{{ card.emoji }}</span>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.card:hover {
  z-index: 10;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.card.selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary), 0 8px 24px rgba(59, 130, 246, 0.4);
}

.card.is-top {
  border-radius: 8px 8px 0 0;
}

.card.drop-target.can-drop {
  box-shadow: 0 0 0 3px #22c55e, 0 8px 24px rgba(34, 197, 94, 0.4);
}

.card.drop-target:not(.can-drop) {
  box-shadow: 0 0 0 3px #ef4444, 0 8px 24px rgba(239, 68, 68, 0.4);
}

.name-strip {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 6px;
  flex-shrink: 0;
  cursor: grab;
}

.name-strip:active {
  cursor: grabbing;
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
  cursor: grab;
}

.content:active {
  cursor: grabbing;
}

.emoji {
  font-size: 32px;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
}
</style>
