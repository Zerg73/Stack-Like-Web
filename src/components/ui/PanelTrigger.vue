<script setup lang="ts">
/**
 * 面板触发器组件
 * Panel Trigger Component
 * 
 * 地图上的可点击元素，点击后打开对应面板
 * Clickable element on map that opens corresponding panel
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '@/stores/gameStore'
import type { PanelTriggerDefinition } from '@/game/types/panel'

const props = defineProps<{
  /** 触发器定义 / Trigger definition */
  trigger: PanelTriggerDefinition
  /** 当前是否满足触发条件 / Whether trigger conditions are met */
  canTrigger?: boolean
}>()

const emit = defineEmits<{
  /** 触发器点击 / Trigger click */
  trigger: [triggerId: string, panelId: string]
}>()

const { t } = useI18n()
const gameStore = useGameStore()

// 是否悬停
const isHovered = ref(false)

// 触发器名称
const triggerName = computed(() => {
  return props.trigger.nameKey ? t(props.trigger.nameKey) : ''
})

// 触发器位置样式
const triggerStyle = computed(() => {
  if (!props.trigger.position) return {}
  
  // 转换世界坐标到屏幕坐标
  const screenPos = gameStore.worldToScreen(
    props.trigger.position.x,
    props.trigger.position.y
  )
  
  return {
    left: `${screenPos.x}px`,
    top: `${screenPos.y}px`
  }
})

// 触发器类名
const triggerClasses = computed(() => ({
  'panel-trigger': true,
  'can-trigger': props.canTrigger !== false,
  'is-hovered': isHovered.value
}))

// 处理点击
function handleClick() {
  if (props.canTrigger !== false) {
    emit('trigger', props.trigger.id, props.trigger.panelId)
  }
}

// 处理悬停
function handleMouseEnter() {
  isHovered.value = true
}

function handleMouseLeave() {
  isHovered.value = false
}
</script>

<template>
  <div
    :class="triggerClasses"
    :style="triggerStyle"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 触发器图标 / Trigger icon -->
    <div class="trigger-icon">
      {{ trigger.icon || '📋' }}
    </div>
    
    <!-- 悬停提示 / Hover tooltip -->
    <Transition name="tooltip">
      <div v-if="isHovered && triggerName" class="trigger-tooltip">
        <span class="tooltip-text">{{ triggerName }}</span>
      </div>
    </Transition>
    
    <!-- 脉冲动画 / Pulse animation -->
    <div class="trigger-pulse"></div>
  </div>
</template>

<style scoped>
.panel-trigger {
  position: absolute;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, rgba(40, 40, 60, 0.95), rgba(25, 25, 40, 0.95));
  border: 2px solid rgba(100, 120, 180, 0.4);
  border-radius: 12px;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: all 0.2s ease;
  z-index: 10;
}

.panel-trigger:hover {
  border-color: rgba(100, 150, 255, 0.6);
  box-shadow: 
    0 0 20px rgba(59, 130, 246, 0.3),
    0 0 40px rgba(59, 130, 246, 0.15);
  transform: translate(-50%, -50%) scale(1.05);
}

.panel-trigger:active {
  transform: translate(-50%, -50%) scale(0.98);
}

.panel-trigger.can-trigger {
  cursor: pointer;
}

.panel-trigger:not(.can-trigger) {
  opacity: 0.5;
  cursor: not-allowed;
}

.trigger-icon {
  font-size: 24px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.trigger-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(100, 120, 180, 0.4);
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
}

.tooltip-text {
  font-size: 12px;
  font-weight: 500;
  color: rgba(200, 210, 230, 0.95);
}

.trigger-pulse {
  position: absolute;
  inset: -4px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  animation: pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 提示框动画 / Tooltip animation */
.tooltip-enter-active {
  animation: tooltip-in 0.2s ease;
}

.tooltip-leave-active {
  animation: tooltip-out 0.15s ease;
}

@keyframes tooltip-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes tooltip-out {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
}
</style>
