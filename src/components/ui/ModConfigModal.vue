<script setup lang="ts">
import type { SaveSlot } from '@/stores/saveStore'

defineProps<{
  slot: SaveSlot
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <h2>MOD 配置</h2>
          <button class="close-btn" @click="emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <p class="slot-name">存档: {{ slot.name }}</p>
          <div class="mod-list">
            <p class="empty-hint">暂无可用MOD</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="emit('close')">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: var(--color-danger);
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.slot-name {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0 0 16px;
}

.mod-list {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-hint {
  font-size: 14px;
  color: var(--color-text-muted);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>