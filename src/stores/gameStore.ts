/**
 * 游戏状态管理
 * 
 * 职责：
 * 1. 管理游戏状态（地图数据、选择状态等）
 * 2. 代理引擎 API 给 Vue 组件使用
 * 3. 不包含业务逻辑，业务逻辑由 GameEngine 处理
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive, nextTick } from 'vue'
import { gameConfig } from '@/config/game'
import { GameEngine, STACK_OFFSET } from '@/game/engine'
import { ProductionModule, type ProductionCallbackParams, type ITimeModule, type ICollisionModule } from '@/game/engine/ProductionModule'
import { SpeedMode, Season, SeasonNames, type GameDate } from '@/game/engine/TimeModule'
import type { GameCard, CardStack, SelectionState, GameMap, DragState } from '@/game/types'
import { cardItems, type CardItemConfig, type BuildingConfig } from '@/config/cardTypes'

export const useGameStore = defineStore('game', () => {
  // ========== 游戏引擎 ==========
  const engine = reactive(new GameEngine())
  
  // ========== 生产模块 ==========
  let productionModule: ProductionModule | null = null
  
  /**
   * 初始化生产模块
   * Initialize production module
   */
  function initProductionModule() {
    if (productionModule) return
    
    productionModule = new ProductionModule(
      () => engine.time as ITimeModule,
      () => engine.collision as ICollisionModule,
      () => currentMap.value.stacks,
      handleProductionComplete
    )
  }
  
  /**
   * 处理生产完成
   * Handle production complete
   */
  function handleProductionComplete(params: ProductionCallbackParams) {
    const { buildingStack, outputConfig } = params
    if (buildingStack.cards.length === 0) return
    
    // 获取建筑卡牌位置
    // Get building card position
    const buildingCard = buildingStack.cards[0]
    
    // 直接在建筑位置创建产出卡牌，让碰撞检测和动画自动处理
    // Create output card at building position, let collision detection and animation handle it
    createStack(
      buildingCard.x,
      buildingCard.y,
      outputConfig.typeId,
      outputConfig.nameKey,  // name 参数（与 nameKey 相同）
      outputConfig.emoji,
      outputConfig.nameKey   // nameKey 参数（用于 i18n 翻译）
    )
  }
  
  /**
   * 监听堆叠变化，触发生产检测
   * Watch stack changes, trigger production check
   */
  function onStacksChanged() {
    if (!productionModule) return
    
    for (const stack of currentMap.value.stacks) {
      productionModule.handleStackChange(stack)
    }
  }
  
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
  
  // ========== 时间状态（派生自 TimeModule）/ Time State (derived from TimeModule) ==========
  
  /** 是否暂停（从 TimeModule 派生）/ Is paused (derived from TimeModule) */
  const isPaused = computed({
    get: () => engine.time.isPaused,
    set: (value: boolean) => {
      if (value) {
        engine.time.pause()
      } else {
        engine.time.resume()
      }
    }
  })
  
  /** 当前日期 / Current date */
  const currentDate = computed<GameDate>(() => engine.time.getDate())
  
  /** 当前速度模式 / Current speed mode */
  const speedMode = computed({
    get: () => engine.time.speedMode,
    set: (value: SpeedMode) => engine.time.setSpeedMode(value)
  })
  
  /** 当前季节 / Current season */
  const currentSeason = computed<Season>(() => engine.time.season)
  
  /** 当前季节名称 / Current season name */
  const currentSeasonName = computed<string>(() => engine.time.seasonName)
  
  /** 日期字符串 / Date string */
  const dateString = computed<string>(() => engine.time.dateString)
  
  /** 时间字符串 / Time string */
  const timeString = computed<string>(() => engine.time.timeString)
  
  /** 是否是新的一天 / Is new day */
  const isNewDay = computed<boolean>(() => engine.time.isNewDay)
  
  /** 是否是游戏日开始 / Is game day start */
  const isGameDayStart = computed<boolean>(() => engine.time.isGameDayStart)

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
   * Handle card drop
   */
  function handleCardDrop(screenX: number, screenY: number) {
    if (!engine.draggingStackId) return
    
    const draggingStackId = engine.draggingStackId
    const result = engine.endDrag(stackMap.value, screenX, screenY)
    
    // 如果是合并操作，需要从地图中移除源堆叠
    // If merge operation, need to remove source stack from map
    if (result.type === 'merge' && result.sourceStackId) {
      const sourceIndex = currentMap.value.stacks.findIndex(s => s.id === result.sourceStackId)
      if (sourceIndex !== -1) {
        currentMap.value.stacks.splice(sourceIndex, 1)
      }
    } else if (result.type === 'none' && draggingStackId) {
      // 如果不是合并操作，检查碰撞并调整位置
      // If not merge operation, check collision and adjust position
      const stack = currentMap.value.stacks.find(s => s.id === draggingStackId)
      if (stack && stack.cards.length > 0) {
        const card = stack.cards[0]
        // 使用碰撞检测找到空闲位置（排除当前堆叠）
        // Use collision detection to find free position (exclude current stack)
        const freePos = engine.collision.findNearestFreePosition(
          card.x,
          card.y,
          currentMap.value.stacks,
          stack.id
        )
        // 如果位置有变化，带动画更新卡牌位置
        // If position changed, update card position with animation
        if (freePos.x !== card.x || freePos.y !== card.y) {
          // 设置调整标记，启用动画
          // Set adjusting flag to enable animation
          card.isAdjusting = true
          engine.moveStack(stack, freePos.x, freePos.y)
          // 动画结束后移除标记
          // Remove flag after animation ends
          setTimeout(() => {
            card.isAdjusting = false
          }, 300)
        }
      }
    }
    
    // 触发生产检测
    // Trigger production check
    onStacksChanged()
    
    return result
  }

  // ========== 卡牌管理 ==========
  
  /**
   * 带动画的位置调整
   * Move stack with animation
   */
  function moveStackWithAnimation(stack: CardStack, x: number, y: number): void {
    if (stack.cards.length === 0) return
    
    const card = stack.cards[0]
    
    // 如果位置没有变化，不需要动画
    // If position didn't change, no animation needed
    if (card.x === x && card.y === y) return
    
    // 设置调整标记，启用动画
    // Set adjusting flag to enable animation
    card.isAdjusting = true
    
    // 更新位置
    // Update position
    engine.moveStack(stack, x, y)
    
    // 动画结束后移除标记
    // Remove flag after animation ends
    setTimeout(() => {
      card.isAdjusting = false
    }, 300) // 与 CSS transition 时间一致 / Same as CSS transition duration
  }
  
  /**
   * 创建堆叠
   * Create stack
   */
  function createStack(x: number, y: number, typeId: string, name: string, emoji: string, nameKey?: string): CardStack {
    // 先使用碰撞检测找到空闲位置（在添加新堆叠之前）
    // Find free position first (before adding new stack)
    const freePos = engine.collision.findNearestFreePosition(x, y, currentMap.value.stacks)
    
    // 在原始位置创建卡牌（用于动画起点）
    // Create card at original position (for animation start point)
    const stack = engine.createStack(x, y, typeId, name, emoji, nameKey)
    
    // 使用 reactive 包装卡牌，使其属性变化可被 Vue 追踪
    // Wrap cards with reactive to make property changes trackable by Vue
    stack.cards = stack.cards.map(card => reactive(card))
    
    // 添加到地图
    // Add to map
    currentMap.value.stacks.push(stack)
    
    // 如果位置需要调整，等待渲染后再移动（触发动画）
    // If position needs adjustment, wait for render then move (triggers animation)
    if (freePos.x !== x || freePos.y !== y) {
      // 先让 Vue 渲染原始位置（不带动画类）
      // First let Vue render at original position (without animation class)
      nextTick(() => {
        // Vue DOM 更新完成后，设置动画标记
        // After Vue DOM update, set animation flag
        if (stack.cards.length > 0) {
          stack.cards[0].isAdjusting = true
        }
        // 等待动画类生效后再移动位置
        // Wait for animation class to take effect before moving
        requestAnimationFrame(() => {
          // 移动到最终位置（触发动画）
          // Move to final position (triggers animation)
          engine.moveStack(stack, freePos.x, freePos.y)
          // 动画结束后移除标记
          // Remove flag after animation ends
          if (stack.cards.length > 0) {
            setTimeout(() => {
              stack.cards[0].isAdjusting = false
            }, 300)
          }
        })
      })
    }
    
    // 触发生产检测
    // Trigger production check
    onStacksChanged()
    
    return stack
  }
  
  /**
   * 创建建筑堆叠（带建筑配置）
   * Create building stack (with building config)
   */
  function createBuildingStack(
    x: number, 
    y: number, 
    itemConfig: CardItemConfig & { buildingConfig: BuildingConfig }
  ): CardStack {
    // 使用碰撞检测找到空闲位置
    // Use collision detection to find free position
    const freePos = engine.collision.findNearestFreePosition(x, y, currentMap.value.stacks)
    
    // 先在原始位置创建卡牌（用于动画起点）
    // Create card at original position first (for animation start point)
    const stack = engine.createStack(
      x, 
      y, 
      itemConfig.typeId, 
      itemConfig.nameKey, 
      itemConfig.emoji,
      itemConfig.nameKey
    )
    
    // 为建筑卡牌添加建筑数据
    // Add building data to building card
    if (stack.cards.length > 0) {
      const buildingCard = stack.cards[0]
      buildingCard.buildingData = {
        type: itemConfig.buildingConfig.type,
        productionInterval: itemConfig.buildingConfig.productionInterval,
        outputTypeId: itemConfig.buildingConfig.outputTypeId,
        outputNameKey: itemConfig.buildingConfig.outputNameKey,
        outputEmoji: itemConfig.buildingConfig.outputEmoji
      }
    }
    
    currentMap.value.stacks.push(stack)
    
    // 如果位置需要调整，等待渲染后再移动（触发动画）
    // If position needs adjustment, wait for render then move (triggers animation)
    if (freePos.x !== x || freePos.y !== y) {
      if (stack.cards.length > 0) {
        stack.cards[0].isAdjusting = true
      }
      // 等待 Vue 渲染原始位置后移动
      // Wait for Vue to render original position then move
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 移动到最终位置（触发动画）
          // Move to final position (triggers animation)
          engine.moveStack(stack, freePos.x, freePos.y)
          // 动画结束后移除标记
          // Remove flag after animation ends
          if (stack.cards.length > 0) {
            setTimeout(() => {
              stack.cards[0].isAdjusting = false
            }, 300)
          }
        })
      })
    }
    
    // 触发生产检测
    // Trigger production check
    onStacksChanged()
    
    return stack
  }
  
  /**
   * 根据卡牌项 ID 创建堆叠
   * Create stack by card item ID
   */
  function createStackByItemId(itemId: string, x: number, y: number): CardStack | null {
    const itemConfig = cardItems.find(item => {
      const key = item.nameKey.split('.').pop()
      return key === itemId
    })
    
    if (!itemConfig) return null
    
    // 检查是否是建筑
    // Check if it's a building
    if (itemConfig.typeId === 'building' && itemConfig.buildingConfig) {
      return createBuildingStack(x, y, itemConfig as CardItemConfig & { buildingConfig: BuildingConfig })
    }
    
    // 传入原始位置，让 createStack 内部处理碰撞检测和动画
    // Pass original position, let createStack handle collision and animation
    return createStack(x, y, itemConfig.typeId, itemConfig.nameKey, itemConfig.emoji, itemConfig.nameKey)
  }
  
  /**
   * 获取建筑的生产进度
   * Get building production progress
   */
  function getProductionProgress(stackId: string): number {
    if (!productionModule) return 0
    const stack = currentMap.value.stacks.find(s => s.id === stackId)
    if (!stack) return 0
    return productionModule.getProductionProgress(stack)
  }
  
  /**
   * 获取建筑的生产剩余时间
   * Get building production remaining time
   */
  function getProductionRemaining(stackId: string): number {
    if (!productionModule) return 0
    const stack = currentMap.value.stacks.find(s => s.id === stackId)
    if (!stack) return 0
    return productionModule.getProductionRemaining(stack)
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
    engine.time.togglePause()
  }

  function toggleHelp() {
    isHelpOpen.value = !isHelpOpen.value
  }
  
  // ========== 时间控制 / Time Control ==========
  
  /**
   * 暂停游戏
   * Pause game
   */
  function pauseGame(): void {
    engine.time.pause()
  }
  
  /**
   * 继续游戏
   * Resume game
   */
  function resumeGame(): void {
    engine.time.resume()
  }
  
  /**
   * 设置速度模式
   * Set speed mode
   */
  function setSpeedMode(mode: SpeedMode): void {
    engine.time.setSpeedMode(mode)
  }
  
  /**
   * 切换到下一个速度模式
   * Cycle to next speed mode
   */
  function cycleSpeedMode(): void {
    engine.time.cycleSpeedMode()
  }
  
  /**
   * 启动卡牌倒计时
   * Start card timer
   */
  function startCardTimer(cardId: string, durationMinutes: number, onComplete: () => void): void {
    engine.time.startTimer(cardId, durationMinutes, onComplete)
  }
  
  /**
   * 取消卡牌倒计时
   * Cancel card timer
   */
  function cancelCardTimer(cardId: string): void {
    engine.time.cancelTimer(cardId)
  }
  
  /**
   * 获取卡牌倒计时进度
   * Get card timer progress
   */
  function getCardTimerProgress(cardId: string): number {
    return engine.time.getTimerProgress(cardId)
  }
  
  /**
   * 获取卡牌倒计时信息
   * Get card timer info
   */
  function getCardTimer(cardId: string) {
    return engine.time.getTimer(cardId)
  }
  
  /**
   * 订阅时间事件
   * Subscribe to time events
   */
  function onTimeTick(callback: (gameSeconds: number) => void): () => void {
    return engine.time.onTick(callback)
  }
  
  function onTimeMinute(callback: (date: GameDate) => void): () => void {
    return engine.time.onMinute(callback)
  }
  
  function onTimeHour(callback: (date: GameDate) => void): () => void {
    return engine.time.onHour(callback)
  }
  
  function onTimeDayEnd(callback: (year: number, month: number, day: number) => void): () => void {
    return engine.time.onDayEnd(callback)
  }
  
  function onTimeSeasonChange(callback: (season: Season, date: GameDate) => void): () => void {
    return engine.time.onSeasonChange(callback)
  }
  
  /**
   * 启动游戏引擎
   * Start game engine
   */
  function startEngine(): void {
    engine.start()
    initProductionModule()
  }
  
  /**
   * 停止游戏引擎
   * Stop game engine
   */
  function stopEngine(): void {
    engine.stop()
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
    isHelpOpen,
    
    // 时间状态（派生自 TimeModule）
    // Time state (derived from TimeModule)
    isPaused,
    currentDate,
    speedMode,
    currentSeason,
    currentSeasonName,
    dateString,
    timeString,
    isNewDay,
    isGameDayStart,
    
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
    createBuildingStack,
    createStackByItemId,
    addCardToStack,
    removeSelectedStack,
    removeStack,
    getStackAt,
    findStackAtPosition,
    
    // 生产相关
    // Production related
    getProductionProgress,
    getProductionRemaining,
    
    // UI
    togglePause,
    toggleHelp,
    
    // 时间控制
    // Time control
    pauseGame,
    resumeGame,
    setSpeedMode,
    cycleSpeedMode,
    startCardTimer,
    cancelCardTimer,
    getCardTimerProgress,
    getCardTimer,
    onTimeTick,
    onTimeMinute,
    onTimeHour,
    onTimeDayEnd,
    onTimeSeasonChange,
    startEngine,
    stopEngine,
    
    // 坐标转换
    screenToWorld,
    worldToScreen,
    screenDeltaToWorldDelta,
    
    // 常量
    STACK_OFFSET,
    
    // 导出类型
    SpeedMode,
    Season,
    SeasonNames
  }
})
