<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="new-slot-card" @click="$emit('click')">
    <div class="plus-icon">+</div>
    <p class="new-text">新建存档</p>
  </div>
</template>

<style scoped>
.new-slot-card {
  background: transparent;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.new-slot-card:hover {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.05);
}

.plus-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.new-slot-card:hover .plus-icon {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
}

.new-text {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  transition: color 0.2s;
}

.new-slot-card:hover .new-text {
  color: var(--color-primary);
}
</style>