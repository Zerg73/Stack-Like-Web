<script setup lang="ts">
/**
 * UI 层容器组件
 * UI Layer Container Component
 * 
 * 独立于游戏地图的 UI 层，用于承载面板、弹窗等 UI 元素
 * UI layer independent of game map, for panels, modals, etc.
 */

import { provide, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import Panel from './Panel.vue'

const gameStore = useGameStore()

// 面板实例列表（从 gameStore 获取）/ Panel instances from gameStore
const panels = computed(() => gameStore.openPanels)

// 当前活动面板
const activePanelId = computed(() => gameStore.activePanelId)

// 提供 UI 层上下文给子组件
provide('uiLayer', {
  activePanelId,
  setActivePanel: (id: string | null) => {
    if (id) {
      gameStore.focusPanel(id)
    }
  }
})

// 处理面板聚焦
function handlePanelFocus(panelId: string) {
  gameStore.focusPanel(panelId)
}

// 处理面板关闭
function handlePanelClose(panelId: string) {
  gameStore.closePanel(panelId)
}
</script>

<template>
  <div class="ui-layer">
    <!-- 面板容器 / Panel Container -->
    <TransitionGroup name="panel" tag="div" class="panel-container">
      <Panel
        v-for="panel in panels"
        :key="panel.id"
        :panel="panel"
        :is-active="activePanelId === panel.id"
        @focus="handlePanelFocus"
        @close="handlePanelClose"
      />
    </TransitionGroup>
    
    <!-- 槽位 / Slot for other UI elements -->
    <slot></slot>
  </div>
</template>

<style scoped>
.ui-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.panel-container {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 面板动画 / Panel animations */
.panel-enter-active {
  animation: panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.panel-leave-active {
  animation: panel-out 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes panel-out {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
}
</style>
