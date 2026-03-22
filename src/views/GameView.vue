<script setup lang="ts">
/**
 * 游戏主视图
 * 
 * 负责处理用户交互事件，调用 gameStore 的方法
 * 不包含业务逻辑，业务逻辑由 GameEngine 处理
 */

import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useKeyboardControls } from '@/composables/useKeyboardControls'
import PixiGameRenderer from '@/game/renderer/PixiGameRenderer.vue'
import MiniMap from '@/game/core/MiniMap.vue'
import ZoomControls from '@/game/core/ZoomControls.vue'
import HelpButton from '@/game/core/HelpButton.vue'
import HelpModal from '@/game/core/HelpModal.vue'
import DevToolbar from '@/game/core/DevToolbar.vue'
import TimePanel from '@/game/core/TimePanel.vue'

const props = defineProps<{
  slotId: string | null
}>()

const emit = defineEmits<{
  goHome: []
}>()

const gameStore = useGameStore()
const rendererRef = ref<InstanceType<typeof PixiGameRenderer> | null>(null)

useKeyboardControls()

// 初始化游戏
onMounted(() => {
  initGame()
})

// 清理
onUnmounted(() => {
  gameStore.stopEngine()
})

// 监听 slotId 变化
watch(() => props.slotId, () => {
  initGame()
})

function initGame() {
  // 停止之前的引擎
  gameStore.stopEngine()
  
  // 初始化视口位置
  gameStore.engine.initialize()
  
  // 清空当前地图
  gameStore.currentMap.stacks = []
  
  if (props.slotId) {
    // TODO: 从存档加载游戏数据
    console.log('Loading save:', props.slotId)
  }
  
  // 启动游戏引擎
  gameStore.startEngine()
}

// 处理堆叠拖拽开始
function handleStackDragStart(stackId: string, _cardIndex: number, worldX: number, worldY: number) {
  const stack = gameStore.currentMap.stacks.find(s => s.id === stackId)
  if (!stack) return
  
  const renderer = rendererRef.value
  if (!renderer) return
  
  const viewportState = renderer.getViewportState()
  if (!viewportState) return
  
  const screenX = worldX * viewportState.scale + viewportState.translateX
  const screenY = worldY * viewportState.scale + viewportState.translateY
  
  gameStore.startStackDrag(stackId, 0, screenX, screenY)
}

// 处理堆叠拖拽移动
function handleStackDragMove(stackId: string, _cardIndex: number, worldX: number, worldY: number) {
  const renderer = rendererRef.value
  if (!renderer) return
  
  const viewportState = renderer.getViewportState()
  if (!viewportState) return
  
  const screenX = worldX * viewportState.scale + viewportState.translateX
  const screenY = worldY * viewportState.scale + viewportState.translateY
  
  // 使用引擎计算拖拽位置
  const newPos = gameStore.calculateDragPosition(screenX, screenY)
  
  // 移动堆叠
  gameStore.moveStack(stackId, newPos.x, newPos.y)
  
  // 更新拖拽目标（用于视觉反馈）
  gameStore.updateDropTarget(screenX, screenY)
}

// 处理堆叠拖拽结束
function handleStackDragEnd(_stackId: string, _cardIndex: number, worldX: number, worldY: number) {
  const renderer = rendererRef.value
  if (!renderer) return
  
  const viewportState = renderer.getViewportState()
  if (!viewportState) return
  
  const screenX = worldX * viewportState.scale + viewportState.translateX
  const screenY = worldY * viewportState.scale + viewportState.translateY
  
  // 处理放置
  gameStore.handleCardDrop(screenX, screenY)
  gameStore.endStackDrag()
}

// 处理舞台点击（空白区域）
function handleStageClick() {
  // 清除选择
  gameStore.clearSelection()
}

// 处理缩放
function handleZoom(delta: number) {
  const newScale = gameStore.viewport.scale + delta
  gameStore.engine.coordinate.scale = newScale
}
</script>

<template>
  <div class="game-view">
    <!-- PixiJS 游戏渲染层 -->
    <PixiGameRenderer
      ref="rendererRef"
      :stacks="gameStore.currentMap.stacks"
      :selected-stacks="gameStore.selection.selectedStacks"
      @stack-drag-start="handleStackDragStart"
      @stack-drag-move="handleStackDragMove"
      @stack-drag-end="handleStackDragEnd"
      @stage-click="handleStageClick"
    />

    <!-- 时间面板 / Time Panel -->
    <TimePanel />
    
    <MiniMap />
    <ZoomControls @zoom="handleZoom" />
    <HelpButton />
    <HelpModal />
    <DevToolbar />
  </div>
</template>

<style scoped>
.game-view {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
