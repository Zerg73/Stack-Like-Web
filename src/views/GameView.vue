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
import Viewport from '@/game/core/Viewport.vue'
import CardGrid from '@/game/card/CardGrid.vue'
import MiniMap from '@/game/core/MiniMap.vue'
import ZoomControls from '@/game/core/ZoomControls.vue'
import HelpButton from '@/game/core/HelpButton.vue'
import HelpModal from '@/game/core/HelpModal.vue'
import DevToolbar from '@/game/core/DevToolbar.vue'
import TimePanel from '@/game/core/TimePanel.vue'
import { CardClickEvent, StackDragStartEvent, CardLongpressEvent } from '@/game/events'

const props = defineProps<{
  slotId: string | null
}>()

const emit = defineEmits<{
  goHome: []
}>()

const gameStore = useGameStore()

useKeyboardControls()

// 拖拽状态
const dragStartMouse = ref({ x: 0, y: 0 })
const dragStartStack = ref({ x: 0, y: 0 })

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

// 处理卡牌点击事件
function handleCardClick(event: CardClickEvent) {
  gameStore.selectStack(event.stack.id)
}

// 处理卡牌长按事件
function handleCardLongpress(event: CardLongpressEvent) {
  console.log('Long press on stack:', event.stack.id, 'at', event.timestamp)
}

// 处理堆叠拖拽开始事件
function handleStackDragStart(event: StackDragStartEvent) {
  const { stack, cardIndex, mouseEvent } = event
  
  // 记录拖拽开始时的鼠标位置
  dragStartMouse.value = { x: mouseEvent.clientX, y: mouseEvent.clientY }
  
  // 开始拖拽（传递屏幕坐标）
  const dragPosition = gameStore.startStackDrag(
    stack.id,
    cardIndex,
    mouseEvent.clientX,
    mouseEvent.clientY
  )
  
  if (dragPosition) {
    dragStartStack.value = dragPosition
  }
  
  window.addEventListener('mousemove', handleStackDragMove)
  window.addEventListener('mouseup', handleStackDragEnd)
}

// 处理拖拽移动
function handleStackDragMove(e: MouseEvent) {
  if (!gameStore.draggingStackId) return
  
  // 使用引擎计算拖拽位置
  const newPos = gameStore.calculateDragPosition(e.clientX, e.clientY)
  
  // 移动堆叠
  gameStore.moveStack(gameStore.draggingStackId, newPos.x, newPos.y)
  
  // 更新拖拽目标（用于视觉反馈）
  gameStore.updateDropTarget(e.clientX, e.clientY)
}

// 处理拖拽结束
function handleStackDragEnd(e: MouseEvent) {
  if (gameStore.draggingStackId) {
    // 处理放置
    gameStore.handleCardDrop(e.clientX, e.clientY)
  }
  
  gameStore.endStackDrag()
  window.removeEventListener('mousemove', handleStackDragMove)
  window.removeEventListener('mouseup', handleStackDragEnd)
}
</script>

<template>
  <div class="game-view">
    <Viewport>
      <CardGrid
        :stacks="gameStore.currentMap.stacks"
        :selected-stacks="gameStore.selection.selectedStacks"
        :dragging-stack-id="gameStore.draggingStackId"
        @card-click="handleCardClick"
        @card-longpress="handleCardLongpress"
        @stack-drag-start="handleStackDragStart"
      />
    </Viewport>

    <!-- 时间面板 / Time Panel -->
    <TimePanel />
    
    <MiniMap />
    <ZoomControls />
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
