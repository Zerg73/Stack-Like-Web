<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
</script>

<template>
  <div class="zoom-controls">
    <button
      class="zoom-btn"
      title="放大"
      @click="gameStore.zoomIn()"
    >
      +
    </button>
    <span class="zoom-level">
      {{ Math.round(gameStore.viewport.scale * 100) }}%
    </span>
    <button
      class="zoom-btn"
      title="缩小"
      @click="gameStore.zoomOut()"
    >
      −
    </button>
    <button
      class="zoom-btn reset"
      title="重置"
      @click="gameStore.resetZoom()"
    >
      ⟲
    </button>
  </div>
</template>

<style scoped>
.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 12px;
  z-index: 100;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.zoom-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.zoom-level {
  font-size: 12px;
  color: var(--color-text-muted);
  min-width: 40px;
  text-align: center;
}
</style>