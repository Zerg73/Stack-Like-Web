<script setup lang="ts">
/**
 * 时间面板组件
 * Time Panel Component
 * 
 * 显示游戏日期、时间和速度控制
 * Displays game date, time and speed controls
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '@/stores/gameStore'
import { SpeedMode } from '@/game/engine/TimeModule'

const { t } = useI18n()
const gameStore = useGameStore()

// 计算属性
const dateString = computed(() => gameStore.dateString)
const timeString = computed(() => gameStore.timeString)
const seasonName = computed(() => t(`seasons.${gameStore.currentSeason}`))
const isPaused = computed(() => gameStore.isPaused)
const speedMode = computed(() => gameStore.speedMode)
const currentSeason = computed(() => gameStore.currentSeason)

// 速度模式标签
const speedLabels: Record<string, string> = {
  [SpeedMode.Normal]: t('time.speedNormal'),
  [SpeedMode.Fast1]: t('time.speedFast'),
  [SpeedMode.Fast2]: t('time.speedTurbo')
}

// 方法
function togglePause() {
  gameStore.togglePause()
}

function setSpeed(mode: SpeedMode) {
  // 如果当前暂停，点击速度按钮时自动恢复
  // If paused, clicking speed button auto resumes
  if (gameStore.isPaused) {
    gameStore.resumeGame()
  }
  gameStore.setSpeedMode(mode)
}
</script>

<template>
  <div class="time-panel">
    <!-- 日期时间显示 / Date time display -->
    <div class="datetime-display">
      <span class="date-string">{{ dateString }}</span>
      <span class="time-string">{{ timeString }}</span>
      <span class="season-badge" :class="currentSeason">
        {{ seasonName }}
      </span>
    </div>
    
    <!-- 速度控制 / Speed controls -->
    <div class="speed-controls">
      <!-- 暂停按钮 / Pause button -->
      <button 
        class="speed-btn pause-btn" 
        :class="{ active: isPaused }"
        @click="togglePause"
        :title="isPaused ? t('time.resume') : t('time.pause')"
      >
        <span v-if="isPaused">▶</span>
        <span v-else>⏸</span>
      </button>
      
      <!-- 速度按钮 / Speed buttons -->
      <button 
        v-for="(label, mode) in speedLabels" 
        :key="mode"
        class="speed-btn"
        :class="{ active: speedMode === mode && !isPaused }"
        @click="setSpeed(mode as SpeedMode)"
        :title="label"
      >
        {{ mode === SpeedMode.Normal ? '▶' : mode === SpeedMode.Fast1 ? '▶▶' : '▶▶▶' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.time-panel {
  position: fixed;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  font-family: 'Segoe UI', system-ui, sans-serif;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.datetime-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.date-string {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.time-string {
  font-size: 20px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

.season-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.season-badge.spring {
  background: linear-gradient(135deg, #4ade80, #22c55e);
}

.season-badge.summer {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.season-badge.autumn {
  background: linear-gradient(135deg, #fb923c, #ea580c);
}

.season-badge.winter {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.speed-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.speed-btn {
  width: 40px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.speed-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.speed-btn.active {
  background: var(--color-primary, #3b82f6);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
}

.pause-btn.active {
  background: #ef4444;
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
}
</style>
