<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSaveStore, type SaveSlot } from '@/stores/saveStore'
import SaveSlotCard from '@/components/ui/SaveSlotCard.vue'
import NewSlotCard from '@/components/ui/NewSlotCard.vue'
import ModConfigModal from '@/components/ui/ModConfigModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const saveStore = useSaveStore()

const showModConfig = ref(false)
const showDeleteConfirm = ref(false)
const selectedSlot = ref<SaveSlot | null>(null)
const pendingDeleteSlot = ref<SaveSlot | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  await saveStore.loadSlots()
})

function openModConfig(slot: SaveSlot) {
  selectedSlot.value = slot
  showModConfig.value = true
}

function closeModConfig() {
  showModConfig.value = false
  selectedSlot.value = null
}

async function handleCreateSlot() {
  const newSlot = await saveStore.createSlot()
  console.log('Created new slot:', newSlot.id)
}

function handleDeleteSlot(slot: SaveSlot) {
  pendingDeleteSlot.value = slot
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (pendingDeleteSlot.value) {
    await saveStore.deleteSlot(pendingDeleteSlot.value.id)
  }
  showDeleteConfirm.value = false
  pendingDeleteSlot.value = null
}

function cancelDelete() {
  showDeleteConfirm.value = false
  pendingDeleteSlot.value = null
}

const emit = defineEmits<{
  startGame: [slotId: string]
}>()

function handleStartGame(slot: SaveSlot) {
  emit('startGame', slot.id)
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    await saveStore.importSave(file)
  } catch {
    console.error('Import failed')
  }

  target.value = ''
}
</script>

<template>
  <div class="home-view">
    <header class="title-area">
      <h1 class="game-title">STACK LIKE</h1>
      <p class="game-subtitle">堆叠大陆</p>
    </header>

    <section class="save-section">
      <div class="save-scroll-container">
        <div class="save-grid">
          <SaveSlotCard
            v-for="slot in saveStore.sortedSlots"
            :key="slot.id"
            :slot="slot"
            @start="handleStartGame"
            @config="openModConfig"
            @delete="handleDeleteSlot"
          />

          <NewSlotCard @click="handleCreateSlot" />
        </div>
      </div>
    </section>

    <footer class="action-bar">
      <button class="action-btn" @click="triggerImport">
        📥 导入存档
      </button>
      <button class="action-btn" @click="saveStore.exportAll">
        📤 导出存档
      </button>
    </footer>

    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    >

    <ModConfigModal
      v-if="showModConfig && selectedSlot"
      :slot="selectedSlot"
      @close="closeModConfig"
    />

    <ConfirmModal
      v-if="showDeleteConfirm && pendingDeleteSlot"
      title="删除存档"
      :message="`确定要删除存档「${pendingDeleteSlot.name}」吗？此操作不可恢复。`"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
.home-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background);
}

.title-area {
  padding: 32px 24px 24px;
  text-align: center;
  flex-shrink: 0;
}

.game-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  letter-spacing: 4px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 8px 0 0;
}

.save-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.save-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.save-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 20px;
}

.action-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.action-btn {
  padding: 10px 24px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>