<script setup lang="ts">
/**
 * 面板槽位组件
 * Panel Slot Component
 * 
 * 可接受卡牌拖入的槽位，显示当前卡牌和匹配状态
 * Slot that accepts card drops, shows current cards and match status
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCategoryColor } from '@/config/tags'
import type { SlotInstance, SlotDefinition } from '@/game/types/slot'
import type { GameCard } from '@/game/types'

const props = defineProps<{
  /** 槽位实例 / Slot instance */
  slot: SlotInstance
  /** 槽位定义 / Slot definition */
  definition: SlotDefinition
  /** 所属面板 ID / Parent panel ID */
  panelId: string
  /** 是否是拖拽目标 / Is drag target */
  isDropTarget?: boolean
  /** 是否可以放置 / Can drop */
  canDrop?: boolean
}>()

const emit = defineEmits<{
  /** 卡牌拖入 / Card drag enter */
  cardEnter: [cardId: string]
  /** 卡牌拖出 / Card drag leave */
  cardLeave: []
  /** 卡牌放置 / Card drop */
  cardDrop: [cardId: string]
  /** 卡牌点击（从槽位取出）/ Card click (remove from slot) */
  cardClick: [card: GameCard]
}>()

const { t } = useI18n()

// 是否正在拖拽悬停 / Is dragging over
const isDragOver = ref(false)

// 槽位名称
const slotName = computed(() => t(props.definition.nameKey))

// 槽位是否为空
const isEmpty = computed(() => props.slot.cards.length === 0)

// 槽位是否已满
const isFull = computed(() => props.slot.cards.length >= props.definition.maxCards)

// 槽位状态样式类
const slotClasses = computed(() => ({
  'panel-slot': true,
  'is-empty': isEmpty.value,
  'is-full': isFull.value,
  'is-drop-target': props.isDropTarget || isDragOver.value,
  'can-drop': props.canDrop,
  'cannot-drop': isDragOver.value && !props.canDrop,
  'is-valid': props.slot.isValid,
  'is-required': props.definition.required,
  'is-output': props.definition.type === 'output'
}))

// 处理拖拽进入
function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
  
  // 获取拖拽的卡牌 ID
  const cardId = e.dataTransfer?.getData('text/plain')
  if (cardId) {
    emit('cardEnter', cardId)
  }
}

// 处理拖拽离开
function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  emit('cardLeave')
}

// 处理拖拽悬停
function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (props.canDrop) {
    e.dataTransfer!.dropEffect = 'move'
  } else {
    e.dataTransfer!.dropEffect = 'none'
  }
}

// 处理放置
function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  
  const cardId = e.dataTransfer?.getData('text/plain')
  if (cardId && props.canDrop) {
    emit('cardDrop', cardId)
  }
}

// 处理卡牌点击
function handleCardClick(card: GameCard) {
  emit('cardClick', card)
}

// 获取卡牌颜色
function getCardColor(card: GameCard): string {
  // 使用分类颜色或类型颜色
  const cardWithCategory = card as GameCard & { category?: string }
  if (cardWithCategory.category) {
    return getCategoryColor(cardWithCategory.category)
  }
  return '#6b7280'
}
</script>

<template>
  <div
    :class="slotClasses"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- 槽位标题 / Slot header -->
    <div class="slot-header">
      <span class="slot-name">{{ slotName }}</span>
      <span v-if="definition.required" class="required-indicator">●</span>
      <span class="card-count">{{ slot.cards.length }}/{{ definition.maxCards }}</span>
    </div>
    
    <!-- 槽位内容 / Slot content -->
    <div class="slot-content">
      <!-- 空槽位提示 / Empty slot hint -->
      <div v-if="isEmpty" class="empty-hint">
        <span class="hint-icon">+</span>
        <span class="hint-text">{{ t('ui.panelSlot.dropHint') }}</span>
      </div>
      
      <!-- 卡牌列表 / Card list -->
      <div v-else class="card-list">
        <div
          v-for="card in slot.cards"
          :key="card.id"
          class="slot-card"
          :style="{ borderColor: getCardColor(card) }"
          @click.stop="handleCardClick(card)"
        >
          <div class="card-emoji">{{ card.emoji }}</div>
          <div class="card-name">{{ card.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- 拖拽覆盖层 / Drag overlay -->
    <Transition name="fade">
      <div v-if="isDragOver" class="drag-overlay" :class="{ 'can-drop': canDrop }">
        <span v-if="canDrop" class="drop-icon">✓</span>
        <span v-else class="drop-icon">✕</span>
      </div>
    </Transition>
    
    <!-- 方面值显示（多卡槽位）/ Aspect values display -->
    <div
      v-if="definition.maxCards > 1 && slot.accumulatedAspects"
      class="aspects-display"
    >
      <span
        v-for="(value, aspect) in slot.accumulatedAspects"
        :key="aspect"
        class="aspect-item"
      >
        {{ aspect }}: {{ value }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.panel-slot {
  position: relative;
  min-width: 100px;
  min-height: 80px;
  background: rgba(30, 30, 40, 0.9);
  border: 2px solid rgba(100, 100, 120, 0.5);
  border-radius: 8px;
  transition: all 0.2s ease;
  pointer-events: auto;
}

.panel-slot:hover {
  border-color: rgba(150, 150, 170, 0.7);
}

.panel-slot.is-drop-target {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.panel-slot.can-drop {
  border-color: #22c55e;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.panel-slot.cannot-drop {
  border-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.panel-slot.is-output {
  background: rgba(20, 40, 30, 0.9);
  border-color: rgba(34, 197, 94, 0.3);
}

.slot-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid rgba(100, 100, 120, 0.3);
  font-size: 12px;
}

.slot-name {
  color: rgba(200, 200, 220, 0.9);
  font-weight: 500;
}

.required-indicator {
  color: #f59e0b;
  font-size: 8px;
}

.card-count {
  margin-left: auto;
  color: rgba(150, 150, 170, 0.7);
  font-size: 11px;
}

.slot-content {
  padding: 8px;
  min-height: 60px;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: rgba(150, 150, 170, 0.5);
}

.hint-icon {
  font-size: 24px;
  font-weight: 300;
  margin-bottom: 4px;
}

.hint-text {
  font-size: 11px;
}

.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.slot-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50px;
  padding: 6px;
  background: rgba(50, 50, 60, 0.8);
  border: 2px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.slot-card:hover {
  transform: translateY(-2px);
}

.card-emoji {
  font-size: 20px;
  line-height: 1;
}

.card-name {
  margin-top: 4px;
  font-size: 9px;
  color: rgba(200, 200, 220, 0.8);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.drag-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 30, 40, 0.8);
  border-radius: 6px;
}

.drag-overlay.can-drop {
  background: rgba(34, 197, 94, 0.2);
}

.drop-icon {
  font-size: 32px;
  font-weight: bold;
  color: rgba(200, 200, 220, 0.8);
}

.drag-overlay.can-drop .drop-icon {
  color: #22c55e;
}

.aspects-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 8px;
  border-top: 1px solid rgba(100, 100, 120, 0.3);
  font-size: 10px;
}

.aspect-item {
  color: rgba(180, 180, 200, 0.8);
  background: rgba(60, 60, 80, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 过渡动画 / Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
