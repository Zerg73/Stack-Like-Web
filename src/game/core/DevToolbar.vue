<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { cardTypes, getItemsByType } from '@/config/cardTypes'
import { gameConfig } from '@/config/game'

const gameStore = useGameStore()

const selectedType = ref(cardTypes[0].id)

const currentItems = computed(() => getItemsByType(selectedType.value))

/**
 * 查找一个空闲的位置来放置新卡牌
 * 从屏幕中心开始，如果该位置有卡牌则往旁边位移
 */
function findAvailablePosition(): { x: number; y: number } {
  const { cellWidth, cellHeight } = gameConfig.grid
  const { width, height } = gameConfig.viewport
  
  // 屏幕中心作为起始位置
  const centerX = width / 2
  const centerY = height / 2
  
  // 偏移步长（卡牌宽度 + 间距）
  const stepX = cellWidth + 20
  const stepY = cellHeight + 20
  
  // 螺旋式搜索空闲位置
  // 方向顺序：右、下、左、上
  const directions = [
    { dx: 1, dy: 0 },   // 右
    { dx: 0, dy: 1 },   // 下
    { dx: -1, dy: 0 },  // 左
    { dx: 0, dy: -1 }   // 上
  ]
  
  // 先检查中心位置
  if (!gameStore.findStackAtPosition(centerX, centerY)) {
    return { x: centerX, y: centerY }
  }
  
  // 螺旋式向外搜索
  for (let radius = 1; radius <= 20; radius++) {
    for (const dir of directions) {
      // 每个方向检查 radius 次
      for (let i = 0; i < radius; i++) {
        const testX = centerX + dir.dx * stepX * radius
        const testY = centerY + dir.dy * stepY * radius
        
        // 确保位置在视口范围内
        if (testX >= 50 && testX <= width - 50 && testY >= 50 && testY <= height - 50) {
          if (!gameStore.findStackAtPosition(testX, testY)) {
            return { x: testX, y: testY }
          }
        }
      }
    }
  }
  
  // 如果螺旋搜索没找到，使用简单的对角线偏移
  const existingCount = gameStore.currentMap.stacks.length
  const offsetX = (existingCount % 10) * stepX
  const offsetY = Math.floor(existingCount / 10) * stepY
  
  return {
    x: centerX + offsetX,
    y: centerY + offsetY
  }
}

function addCard(item: { typeId: string; name: string; emoji: string }) {
  const position = findAvailablePosition()
  gameStore.createStack(position.x, position.y, item.typeId, item.name, item.emoji)
}

function deleteSelected() {
  gameStore.removeSelectedStack()
}

function clearAll() {
  if (confirm('确定要清空所有卡牌吗？')) {
    while (gameStore.currentMap.stacks.length > 0) {
      gameStore.removeStack(gameStore.currentMap.stacks[0].id)
    }
    gameStore.clearSelection()
  }
}
</script>

<template>
  <div class="dev-toolbar">
    <div class="toolbar-section">
      <h4>添加卡牌</h4>

      <div class="type-selector">
        <button
          v-for="type in cardTypes"
          :key="type.id"
          :class="{ active: selectedType === type.id }"
          :style="{ borderColor: type.color }"
          @click="selectedType = type.id"
        >
          {{ type.name }}
        </button>
      </div>

      <div class="item-list">
        <div
          v-for="item in currentItems"
          :key="item.name"
          class="item-btn"
          @click="addCard(item)"
        >
          <span class="item-emoji">{{ item.emoji }}</span>
          <span class="item-name">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <div class="toolbar-section">
      <h4>操作</h4>
      <div class="action-buttons">
        <button class="action-btn delete" :disabled="gameStore.selection.selectedStacks.length === 0" @click="deleteSelected">
          删除选中
        </button>
        <button class="action-btn clear" @click="clearAll">
          清空所有
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dev-toolbar {
  position: absolute;
  left: 16px;
  bottom: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  min-width: 150px;
}

.toolbar-section {
  margin-bottom: 12px;
}

.toolbar-section h4 {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.type-selector {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.type-selector button {
  padding: 4px 8px;
  border: 2px solid;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.type-selector button.active {
  background: rgba(255, 255, 255, 0.1);
}

.type-selector button:hover {
  background: rgba(255, 255, 255, 0.05);
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.item-btn:hover {
  border-color: var(--type-color);
  background: rgba(255, 255, 255, 0.05);
}

.item-emoji {
  font-size: 16px;
}

.item-name {
  font-size: 11px;
  color: var(--color-text-muted);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-btn {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: 4px;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.action-btn.delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.action-btn.delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.clear {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.action-btn.clear:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>
