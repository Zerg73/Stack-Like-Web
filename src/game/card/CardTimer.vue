<script setup lang="ts">
/**
 * 卡牌倒计时组件
 * Card Timer Component
 * 
 * 显示卡牌的倒计时进度圈和剩余时间
 * Displays card countdown progress ring and remaining time
 */

import { computed } from 'vue'

const props = defineProps<{
  cardId: string
  totalMinutes: number
  remainingMinutes: number
}>()

const emit = defineEmits<{
  complete: []
}>()

// 计算进度（0-1）
const progress = computed(() => {
  if (props.totalMinutes <= 0) return 0
  return 1 - (props.remainingMinutes / props.totalMinutes)
})

// 计算剩余时间显示（分:秒格式）
const remainingDisplay = computed(() => {
  const totalSeconds = Math.floor(props.remainingMinutes * 60)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// 计算进度圈路径
const progressPath = computed(() => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress.value)
  return {
    circumference,
    offset
  }
})

// 是否显示（剩余时间大于0）
const isVisible = computed(() => props.remainingMinutes > 0)
</script>

<template>
  <div v-if="isVisible" class="card-timer">
    <!-- 进度圈 / Progress ring -->
    <svg class="progress-ring" viewBox="0 0 40 40">
      <!-- 背景圈 / Background circle -->
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        stroke-width="2"
      />
      <!-- 进度圈 / Progress circle -->
      <circle
        class="progress-circle"
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="var(--color-primary, #3b82f6)"
        stroke-width="2"
        stroke-linecap="round"
        :stroke-dasharray="progressPath.circumference"
        :stroke-dashoffset="progressPath.offset"
        transform="rotate(-90 20 20)"
      />
    </svg>
    
    <!-- 剩余时间 / Remaining time -->
    <div class="remaining-time">
      {{ remainingDisplay }}
    </div>
  </div>
</template>

<style scoped>
.card-timer {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.progress-ring {
  width: 40px;
  height: 40px;
}

.progress-circle {
  transition: stroke-dashoffset 0.1s ease-out;
}

.remaining-time {
  font-size: 10px;
  font-weight: 500;
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
