<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
</script>

<template>
  <button
    class="help-btn"
    title="快捷键说明"
    @click="gameStore.toggleHelp()"
  >
    ❓
  </button>
</template>

<style scoped>
.help-btn {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  z-index: 100;
}

.help-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--color-primary);
}
</style>