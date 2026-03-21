/**
 * 游戏状态管理
 * 
 * 职责：
 * 1. 管理游戏状态（地图数据、选择状态等）
 * 2. 代理引擎 API 给 Vue 组件使用
 * 3. 不包含业务逻辑，业务逻辑由 GameEngine 处理
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { gameConfig } from '@/config/game'
import { GameEngine, STACK_OFFSET } from '@/game/engine'
import type { GameCard, CardStack, SelectionState, GameMap, DragState } from '@/game/types'

export const useGameStore = defineStore('game', () => {
  // ========== 游戏引擎 ==========
  const engine = reactive(new GameEngine())
  
  // ========== 选择状态 ==========
  const selection = ref<SelectionState>({
    selectedStacks: [],
    isMultiSelect: false
  })

  // ========== 拖拽状态（用于 UI 反馈） ==========
  const drag = ref<DragState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startTranslateX: 0,
    startTranslateY: 0
  })

  // ========== 地图数据 ==========
  const currentMap = ref<GameMap>({
    id: 'map_1',
    name: '主地图',
    width: gameConfig.viewport.width,
    height: gameConfig.viewport.height,
    stacks: []
  })

  // ========== UI 状态 ==========
  const isPaused = ref(false)
  const isHelpOpen = ref(false)
  
  // 拖拽放置目标（用于视觉反馈）
  const dropTarget = ref<CardStack | null>(null)
  const canDropOnTarget = ref(false)

  // ========== 计算属性 ==========
  
  /** 是否正在拖拽 */
  const isDragging = computed(() => engine.isDragging)
  
  /** 当前拖拽的堆叠 ID */
  const draggingStackId = computed(() => engine.draggingStackId)
  
  /** 是否是分离操作 */
  const isSeparating = computed(() => engine.isSeparating)
  
  /** 被拖拽的卡牌索引 */
  const draggedCardIndex = computed(() => engine.draggedCardIndex)
  
  /** 源堆叠 ID */
  const sourceStackId = computed(() => engine.sourceStackId)
  
  /** 视口状态 */
  const viewport = computed(() => ({
    scale: engine.scale,
    translateX: engine.translate.x,
    translateY: engine.translate.y,
    rotateX: engine.rotateX
  }))
  
  /** 选中的卡牌 */
  const selectedCards = computed(() => {
    const cards: GameCard[] = []
    for (const stackId of selection.value.selectedStacks) {
      const stack = currentMap.value.stacks.find(s => s.id === stackId)
      if (stack) {
        cards.push(...stack.cards)
      }
    }
    return cards
  })

  /** 堆叠 ID 到堆叠对象的映射（用于 O(1) 查找） */
  /** Stack ID to stack object mapping (for O(1) lookup) */
  const stackMap = computed(() => {
    const map = new Map<string, CardStack>()
    for (const stack of currentMap.value.stacks) {
      map.set(stack.id, stack)
    }
    return map
  })

  // ========== 缩放控制 ==========
  
  function setScale(scale: number) {
    engine.scale = scale
  }

  function zoomIn() {
    engine.scale += gameConfig.controls.zoomStep
  }

  function zoomOut() {
    engine.scale -= gameConfig.controls.zoomStep
  }

  function resetZoom() {
    engine.scale = gameConfig.viewport.defaultScale
  }

  // ========== 平移控制 ==========
  
  function setTranslate(x: number, y: number) {
    engine.setTranslate(x, y)
  }

  function pan(dx: number, dy: number) {
    const newX = engine.translate.x + dx * gameConfig.controls.panSpeed
    const newY = engine.translate.y + dy * gameConfig.controls.panSpeed
    setTranslate(newX, newY)
  }

  function startPan(x: number, y: number) {
    drag.value.isPanning = true
    drag.value.startX = x
    drag.value.startY = y
    drag.value.startTranslateX = engine.translate.x
    drag.value.startTranslateY = engine.translate.y
  }

  function updatePan(x: number, y: number) {
    if (!drag.value.isPanning) return
    const dx = x - drag.value.startX
    const dy = y - drag.value.startY
    setTranslate(drag.value.startTranslateX + dx, drag.value.startTranslateY + dy)
  }

  function endPan() {
    drag.value.isPanning = false
  }

  // ========== 旋转控制 ==========
  
  function setRotateX(angle: number) {
    engine.rotateX = angle
  }

  // ========== 选择控制 ==========
  
  function selectStack(stackId: string) {
    selection.value.selectedStacks = [stackId]
    selection.value.isMultiSelect = false
  }

  function clearSelection() {
    selection.value.selectedStacks = []
  }

  function isStackSelected(stackId: string): boolean {
    return selection.value.selectedStacks.includes(stackId)
  }

  // ========== 卡牌拖拽（代理到引擎） ==========
  
  /**
   * 开始拖拽堆叠
   * @returns 返回当前正在拖拽的堆叠位置
   */
  function startStackDrag(stackId: string, cardIndex: number = -1, screenX: number, screenY: number): { x: number, y: number } | null {
    const stack = currentMap.value.stacks.find(s => s.id === stackId)
    if (!stack) return null
    
    selectStack(stackId)
    
    // 如果需要分离（拖拽的不是底层卡牌）
    if (cardIndex > 0 && cardIndex < stack.cards.length) {
      // 调用引擎执行分离，获取新堆叠
      const newStack = engine.separateStack(stack, cardIndex)
      if (newStack) {
        // 将新堆叠添加到地图
        currentMap.value.stacks.push(newStack)
        selectStack(newStack.id)
        
        // 调用引擎开始拖拽，标记为分离操作
        return engine.startDrag(newStack, -1, screenX, screenY, true)
      }
    } else {
      // 拖拽整个堆叠，调用引擎开始拖拽
      return engine.startDrag(stack, -1, screenX, screenY, false)
    }
    
    return null
  }

  function endStackDrag() {
    dropTarget.value = null
    canDropOnTarget.value = false
    engine.cancelDrag()
  }

  /**
   * 移动堆叠到指定位置
   * Move stack to specified position
   * 
   * @param stackId 堆叠 ID / Stack ID
   * @param x 世界坐标 X / World coordinate X
   * @param y 世界坐标 Y / World coordinate Y
   */
  function moveStack(stackId: string, x: number, y: number) {
    const stack = currentMap.value.stacks.find(s => s.id === stackId)
    if (stack) {
      // 限制位置在地图边界内 / Clamp position within map boundaries
      const clampedPos = engine.clampCardPosition(x, y)
      engine.moveStack(stack, clampedPos.x, clampedPos.y)
    }
  }

  /**
   * 更新拖拽目标（用于视觉反馈）
   */
  function updateDropTarget(screenX: number, screenY: number) {
    const result = engine.findDropTarget(screenX, screenY, stackMap.value)
    dropTarget.value = result.target
    canDropOnTarget.value = result.canDrop
  }

  /**
   * 处理卡牌放置
   */
  function handleCardDrop(screenX: number, screenY: number) {
    if (!engine.draggingStackId) return
    
    const result = engine.endDrag(stackMap.value, screenX, screenY)
    
    // 如果是合并操作，需要从地图中移除源堆叠
    if (result.type === 'merge' && result.sourceStackId) {
      const sourceIndex = currentMap.value.stacks.findIndex(s => s.id === result.sourceStackId)
      if (sourceIndex !== -1) {
        currentMap.value.stacks.splice(sourceIndex, 1)
      }
    }
    
    return result
  }

  // ========== 卡牌管理 ==========
  
  function createStack(x: number, y: number, typeId: string, name: string, emoji: string, nameKey?: string): CardStack {
    const stack = engine.createStack(x, y, typeId, name, emoji, nameKey)
    currentMap.value.stacks.push(stack)
    return stack
  }

  function addCardToStack(stackId: string, typeId: string, name: string, emoji: string): GameCard | null {
    const stack = currentMap.value.stacks.find(s => s.id === stackId)
    if (!stack) return null
    return engine.addCardToStack(stack, typeId, name, emoji)
  }

  function removeSelectedStack() {
    if (selection.value.selectedStacks.length === 0) return

    const stackId = selection.value.selectedStacks[0]
    removeStack(stackId)
    clearSelection()
  }

  function removeStack(stackId: string) {
    const index = currentMap.value.stacks.findIndex(s => s.id === stackId)
    if (index !== -1) {
      currentMap.value.stacks.splice(index, 1)
    }
  }

  function getStackAt(x: number, y: number): CardStack | undefined {
    return currentMap.value.stacks.find(stack =>
      stack.cards.some(card => card.x === x && card.y === y)
    )
  }

  /**
   * 查找指定位置的堆叠（世界坐标）
   */
  function findStackAtPosition(worldX: number, worldY: number, excludeId?: string): CardStack | null {
    return engine.findStackAtPosition(currentMap.value.stacks, worldX, worldY, excludeId)
  }

  // ========== UI 控制 ==========
  
  function togglePause() {
    isPaused.value = !isPaused.value
  }

  function toggleHelp() {
    isHelpOpen.value = !isHelpOpen.value
  }

  // ========== 坐标转换（代理到引擎） ==========
  
  function screenToWorld(screenX: number, screenY: number) {
    return engine.screenToWorld(screenX, screenY)
  }

  function worldToScreen(worldX: number, worldY: number) {
    return engine.worldToScreen(worldX, worldY)
  }

  function screenDeltaToWorldDelta(dx: number, dy: number) {
    return engine.coordinate.screenDeltaToWorldDelta(dx, dy)
  }

  function calculateDragPosition(screenX: number, screenY: number) {
    return engine.calculateDragPosition(screenX, screenY)
  }

  // ========== 导出 ==========
  
  return {
    // 引擎实例（供需要直接访问的场景）
    engine,
    
    // 状态
    viewport,
    selection,
    drag,
    currentMap,
    isPaused,
    isHelpOpen,
    
    // 拖拽业务状态（通过计算属性）
    isDragging,
    isSeparating,
    draggedCardIndex,
    sourceStackId,
    draggingStackId,
    
    // UI 状态
    dropTarget,
    canDropOnTarget,
    selectedCards,
    stackMap,
    
    // 缩放
    setScale,
    zoomIn,
    zoomOut,
    resetZoom,
    
    // 平移
    setTranslate,
    pan,
    startPan,
    updatePan,
    endPan,
    
    // 旋转
    setRotateX,
    
    // 选择
    selectStack,
    clearSelection,
    isStackSelected,
    
    // 卡牌拖拽
    startStackDrag,
    endStackDrag,
    moveStack,
    updateDropTarget,
    handleCardDrop,
    calculateDragPosition,
    
    // 卡牌管理
    createStack,
    addCardToStack,
    removeSelectedStack,
    removeStack,
    getStackAt,
    findStackAtPosition,
    
    // UI
    togglePause,
    toggleHelp,
    
    // 坐标转换
    screenToWorld,
    worldToScreen,
    screenDeltaToWorldDelta,
    
    // 常量
    STACK_OFFSET
  }
})
