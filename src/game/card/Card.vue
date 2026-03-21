<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getCardColor } from '@/config/cardTypes'
import { useGameStore } from '@/stores/gameStore'
import type { GameCard } from '@/game/types'

const props = defineProps<{
  card: GameCard
  isSelected: boolean
  isTop: boolean
  cardIndex: number       // 卡牌在堆叠中的索引
  isDropTarget?: boolean  // 是否是拖拽目标
  canDrop?: boolean       // 是否可以放置
  stackId?: string        // 堆叠 ID（用于获取生产进度）
}>()

const { t } = useI18n()
const gameStore = useGameStore()

// Card 组件只触发原始鼠标事件，由 CardStack 创建事件对象
const emit = defineEmits<{
  click: [event: MouseEvent]
  dragStart: [event: MouseEvent]
}>()

const typeColor = computed(() => getCardColor(props.card.typeId))

// 卡牌名称（优先使用 nameKey 翻译，否则使用原始名称）
const cardName = computed(() => {
  if (props.card.nameKey) {
    return t(props.card.nameKey)
  }
  return props.card.name
})

const cardStyle = computed(() => ({
  width: '80px',
  // 顶层卡牌完整渲染(107px)，非顶层卡牌仅渲染名字栏(32px)
  // Top card shows full height (107px), non-top cards show only name strip (32px)
  height: props.isTop ? '107px' : '32px',
  background: props.isTop ? 'var(--color-surface)' : typeColor.value,
  borderColor: props.isDropTarget 
    ? (props.canDrop ? '#22c55e' : '#ef4444')
    : (props.isSelected ? 'var(--color-primary)' : 'var(--color-border)'),
}))

// 生产倒计时相关 / Production timer related
const productionProgress = ref(0)
const productionRemaining = ref(0)
let updateInterval: number | null = null

// 是否显示倒计时（建筑卡牌且有生产数据）
// Whether to show countdown (building card with production data)
// 建筑卡牌即使不是顶层也要显示倒计时
// Building cards show countdown even if not top card
const showTimer = computed(() => {
  return props.card.buildingData && props.card.buildingData.productionTimerId
})

// 更新生产进度
// Update production progress
function updateProductionProgress() {
  if (!props.stackId || !props.card.buildingData) return
  
  productionProgress.value = gameStore.getProductionProgress(props.stackId)
  productionRemaining.value = gameStore.getProductionRemaining(props.stackId)
}

// 倒计时显示文本
// Countdown display text
const timerDisplay = computed(() => {
  const minutes = Math.floor(productionRemaining.value)
  const seconds = Math.floor((productionRemaining.value % 1) * 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// 进度圈路径
// Progress circle path
const progressPath = computed(() => {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - productionProgress.value)
  return {
    circumference,
    offset
  }
})

// 监听 showTimer 变化，启动/停止更新定时器
// Watch showTimer changes, start/stop update interval
watch(showTimer, (newValue) => {
  if (newValue) {
    // 启动更新
    // Start updating
    updateProductionProgress()
    if (!updateInterval) {
      updateInterval = window.setInterval(updateProductionProgress, 100)
    }
  } else {
    // 停止更新
    // Stop updating
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

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
      <span class="name">{{ cardName }}</span>
    </div>

    <!-- 内容区域（只有最顶层卡牌显示） -->
    <!-- Content area (only shown for top card) -->
    <div v-if="isTop" class="content" @mousedown="handleContentMouseDown">
      <span class="emoji">{{ card.emoji }}</span>
    </div>
    
    <!-- 生产倒计时 / Production countdown -->
    <!-- 建筑卡牌即使不是顶层也显示倒计时 / Building cards show countdown even if not top -->
    <div v-if="showTimer" class="card-timer">
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
        {{ timerDisplay }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: absolute;
  bottom: 0;
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
  border-radius: 0;
  box-shadow: 0 0 0 2px var(--color-primary), 0 8px 24px rgba(59, 130, 246, 0.4);
}

.card.is-top {
  border-radius:  0;
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

/* 生产倒计时样式 / Production countdown styles */
.card-timer {
  position: absolute;
  top: 50%;
  right: -50px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 100;
}

.progress-ring {
  width: 40px;
  height: 40px;
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
