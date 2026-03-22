<script setup lang="ts">
/**
 * 面板组件
 * Panel Component
 * 
 * 浮动面板窗口，包含槽位和配方执行按钮
 * Floating panel window with slots and recipe execution button
 */

import { computed, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '@/stores/gameStore'
import PanelSlot from './PanelSlot.vue'
import type { PanelInstance, PanelDefinition } from '@/game/types/panel'
import type { GameCard } from '@/game/types'

const props = defineProps<{
  /** 面板实例 / Panel instance */
  panel: PanelInstance
  /** 是否活动 / Is active */
  isActive?: boolean
}>()

const emit = defineEmits<{
  /** 面板聚焦 / Panel focus */
  focus: [panelId: string]
  /** 面板关闭 / Panel close */
  close: [panelId: string]
}>()

const { t } = useI18n()
const gameStore = useGameStore()

// 面板定义（从 gameStore 获取）/ Panel definition from gameStore
const panelDefinition = computed<PanelDefinition | undefined>(() => {
  return gameStore.getPanelDefinition(props.panel.definitionId)
})

// 拖拽状态
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const panelStartPos = ref({ x: 0, y: 0 })

// 当前拖拽悬停的槽位
const dropTargetSlotId = ref<string | null>(null)
const canDropToSlot = ref(false)

// 面板名称
const panelName = computed(() => {
  return panelDefinition.value ? t(panelDefinition.value.nameKey) : 'Panel'
})

// 面板样式（使用世界坐标，left + bottom 定位）
// Panel style (using world coordinates, left + bottom positioning)
const panelStyle = computed(() => ({
  left: `${props.panel.position.x}px`,
  bottom: `${props.panel.position.y}px`,
  zIndex: props.isActive ? 5000 : 4000  // 确保高于所有卡牌 / Ensure above all cards
}))

// 面板类名
const panelClasses = computed(() => ({
  'panel': true,
  'is-active': props.isActive,
  'is-dragging': isDragging.value,
  'can-execute': props.panel.canExecute
}))

// 处理面板头部拖拽
function handleHeaderMouseDown(e: MouseEvent) {
  // 阻止事件冒泡，防止触发卡牌拖拽和地图拖拽
  // Stop propagation to prevent card drag and map drag
  e.preventDefault()
  e.stopPropagation()
  
  if ((e.target as HTMLElement).closest('.panel-close')) return
  
  isDragging.value = true
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  panelStartPos.value = { ...props.panel.position }
  
  emit('focus', props.panel.id)
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

function handleDragMove(e: MouseEvent) {
  if (!isDragging.value) return
  
  // 计算屏幕坐标增量
  // Calculate screen coordinate delta
  const screenDx = e.clientX - dragStartPos.value.x
  const screenDy = e.clientY - dragStartPos.value.y
  
  // 将屏幕坐标增量转换为世界坐标增量
  // Convert screen delta to world delta
  // 注意：Y 轴方向相反（屏幕 Y 向下，世界 Y 向上）
  // Note: Y axis is inverted (screen Y goes down, world Y goes up)
  const scale = gameStore.viewport.scale
  const worldDx = screenDx / scale
  const worldDy = -screenDy / scale  // Y 轴反向
  
  const newX = Math.max(0, panelStartPos.value.x + worldDx)
  const newY = Math.max(0, panelStartPos.value.y + worldDy)
  
  // TODO: 调用 gameStore 更新面板位置
  props.panel.position = { x: newX, y: newY }
}

function handleDragEnd() {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
}

// 处理面板点击（聚焦）
function handlePanelClick() {
  if (!props.isActive) {
    emit('focus', props.panel.id)
  }
}

// 处理关闭
function handleClose() {
  emit('close', props.panel.id)
}

// 处理卡牌拖入槽位
function handleCardEnter(slotId: string, _cardId: string) {
  dropTargetSlotId.value = slotId
  // TODO: 检查是否可以放置
  canDropToSlot.value = true
}

// 处理卡牌拖出槽位
function handleCardLeave() {
  dropTargetSlotId.value = null
  canDropToSlot.value = false
}

// 处理卡牌放置
function handleCardDrop(slotId: string, cardId: string) {
  // TODO: 调用 gameStore 添加卡牌到槽位
  console.log('Drop card', cardId, 'to slot', slotId)
  dropTargetSlotId.value = null
}

// 处理从槽位取出卡牌
function handleCardRemove(card: GameCard) {
  // TODO: 调用 gameStore 从槽位移除卡牌
  console.log('Remove card from slot:', card.id)
}

// 处理配方执行
function handleExecuteRecipe() {
  if (!props.panel.canExecute || !props.panel.matchedRecipe) return
  
  // TODO: 调用 gameStore 执行配方
  console.log('Execute recipe:', props.panel.matchedRecipe.id)
}

// 清理
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
})
</script>

<template>
  <div
    :class="panelClasses"
    :style="panelStyle"
    @click="handlePanelClick"
  >
    <!-- 面板头部 / Panel header -->
    <div
      class="panel-header"
      @mousedown="handleHeaderMouseDown"
    >
      <div class="header-left">
        <span v-if="panelDefinition?.icon" class="panel-icon">
          {{ panelDefinition.icon }}
        </span>
        <span class="panel-title">{{ panelName }}</span>
      </div>
      
      <button
        class="panel-close"
        @click.stop="handleClose"
        title="Close"
      >
        ✕
      </button>
    </div>
    
    <!-- 面板内容 / Panel content -->
    <div class="panel-body">
      <!-- 输入槽位区域 / Input slots area -->
      <div class="slots-section">
        <div class="section-label">{{ t('ui.panel.inputSlots') }}</div>
        <div class="slots-grid">
          <template v-if="panelDefinition">
            <PanelSlot
              v-for="slot in panel.slots"
              :key="slot.definitionId"
              :slot="slot"
              :definition="panelDefinition.slots.find(s => s.id === slot.definitionId)!"
              :panel-id="panel.id"
              :is-drop-target="dropTargetSlotId === slot.definitionId"
              :can-drop="canDropToSlot"
              @card-enter="(cardId) => handleCardEnter(slot.definitionId, cardId)"
              @card-leave="handleCardLeave"
              @card-drop="(cardId) => handleCardDrop(slot.definitionId, cardId)"
              @card-click="handleCardRemove"
            />
          </template>
        </div>
      </div>
      
      <!-- 分隔线 / Divider -->
      <div class="panel-divider">
        <span class="divider-icon">↓</span>
      </div>
      
      <!-- 输出槽位区域 / Output slot area -->
      <div v-if="panel.outputSlot && panelDefinition?.outputSlot" class="slots-section output-section">
        <div class="section-label">{{ t('ui.panel.outputSlot') }}</div>
        <PanelSlot
          :slot="panel.outputSlot"
          :definition="panelDefinition.outputSlot"
          :panel-id="panel.id"
        />
      </div>
    </div>
    
    <!-- 面板底部 / Panel footer -->
    <div class="panel-footer">
      <!-- 匹配的配方 / Matched recipe -->
      <div v-if="panel.matchedRecipe" class="matched-recipe">
        <span class="recipe-icon">⚗️</span>
        <span class="recipe-name">{{ t(panel.matchedRecipe.nameKey) }}</span>
      </div>
      
      <!-- 执行按钮 / Execute button -->
      <button
        class="execute-button"
        :class="{ 'is-ready': panel.canExecute }"
        :disabled="!panel.canExecute"
        @click="handleExecuteRecipe"
      >
        <span class="button-icon">▶</span>
        <span class="button-text">{{ t('ui.panel.execute') }}</span>
      </button>
    </div>
    
    <!-- 拖拽遮罩 / Drag overlay -->
    <div v-if="isDragging" class="drag-overlay"></div>
  </div>
</template>

<style scoped>
.panel {
  position: absolute;
  min-width: 280px;
  max-width: 400px;
  background: linear-gradient(145deg, rgba(25, 25, 35, 0.98), rgba(15, 15, 25, 0.98));
  border: 1px solid rgba(100, 100, 130, 0.4);
  border-radius: 12px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 1px rgba(255, 255, 255, 0.1) inset;
  overflow: hidden;
  pointer-events: auto;
  user-select: none;
  transition: box-shadow 0.2s ease;
}

.panel.is-active {
  border-color: rgba(100, 150, 255, 0.5);
  box-shadow: 
    0 15px 50px rgba(0, 0, 0, 0.6),
    0 0 30px rgba(59, 130, 246, 0.15),
    0 0 1px rgba(255, 255, 255, 0.15) inset;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(40, 40, 55, 0.6);
  border-bottom: 1px solid rgba(80, 80, 100, 0.3);
  cursor: grab;
}

.panel-header:active {
  cursor: grabbing;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-icon {
  font-size: 18px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(220, 220, 240, 0.95);
  letter-spacing: 0.3px;
}

.panel-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: rgba(180, 180, 200, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.panel-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.panel-body {
  padding: 16px;
}

.slots-section {
  margin-bottom: 12px;
}

.section-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(150, 150, 170, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.slots-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.output-section {
  margin-bottom: 0;
}

.panel-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  margin: 12px 0;
}

.divider-icon {
  font-size: 16px;
  color: rgba(100, 100, 130, 0.5);
}

.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(30, 30, 45, 0.5);
  border-top: 1px solid rgba(80, 80, 100, 0.3);
}

.matched-recipe {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recipe-icon {
  font-size: 16px;
}

.recipe-name {
  font-size: 12px;
  color: rgba(180, 200, 220, 0.9);
}

.execute-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(60, 60, 80, 0.6);
  border: 1px solid rgba(100, 100, 130, 0.4);
  border-radius: 8px;
  color: rgba(150, 150, 170, 0.6);
  font-size: 12px;
  font-weight: 500;
  cursor: not-allowed;
  transition: all 0.2s ease;
}

.execute-button.is-ready {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.3));
  border-color: rgba(34, 197, 94, 0.5);
  color: rgba(180, 255, 200, 0.95);
  cursor: pointer;
}

.execute-button.is-ready:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(22, 163, 74, 0.4));
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.button-icon {
  font-size: 10px;
}

.drag-overlay {
  position: absolute;
  inset: 0;
  background: transparent;
  cursor: grabbing;
}
</style>
