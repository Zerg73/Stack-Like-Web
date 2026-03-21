<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SaveSlot } from '@/stores/saveStore'

const props = defineProps<{
  slot: SaveSlot
}>()

const { t, locale } = useI18n()

const emit = defineEmits<{
  start: [slot: SaveSlot]
  config: [slot: SaveSlot]
  delete: [slot: SaveSlot]
}>()

// 根据当前语言格式化日期
const formattedDate = computed(() => {
  const date = new Date(props.slot.updatedAt)
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// MOD 数量文本
const modCountText = computed(() => {
  const count = props.slot.modList.length
  if (count === 0) return ''
  return t('saveSlot.modCount', { count })
})

function handleDelete(e: Event) {
  e.stopPropagation()
  emit('delete', props.slot)
}

function handleConfig(e: Event) {
  e.stopPropagation()
  emit('config', props.slot)
}
</script>

<template>
  <div class="save-slot-card">
    <div class="card-header">
      <button
        class="icon-btn config-btn"
        :title="t('saveSlot.modConfig')"
        @click="handleConfig"
      >
        ⚙️
      </button>
      <button
        class="icon-btn delete-btn"
        :title="t('saveSlot.deleteSave')"
        @click="handleDelete"
      >
        ✕
      </button>
    </div>

    <div class="card-content" @click="emit('start', slot)">
      <h3 class="slot-name">{{ slot.name }}</h3>
      <p class="slot-date">{{ formattedDate }}</p>
      <p v-if="slot.modList.length > 0" class="slot-mods">
        {{ modCountText }}
      </p>
    </div>

    <div class="card-footer">
      <button class="start-btn" @click="emit('start', slot)">
        {{ t('saveSlot.startGame') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.save-slot-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease-out;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.save-slot-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.card-content {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.slot-date {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0;
}

.slot-mods {
  font-size: 11px;
  color: var(--color-secondary);
  margin: 4px 0 0;
}

.card-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
}

.start-btn {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.start-btn:hover {
  background: #2563eb;
}
</style>
