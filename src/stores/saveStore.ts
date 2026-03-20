import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SaveSlot {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  modList: string[]
  thumbnail?: string
}

export const useSaveStore = defineStore('save', () => {
  const slots = ref<SaveSlot[]>([])

  const sortedSlots = computed(() => {
    return [...slots.value].sort((a, b) => b.updatedAt - a.updatedAt)
  })

  function generateId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  async function loadSlots(): Promise<void> {
    const data = localStorage.getItem('stack_like_saves')
    if (data) {
      try {
        slots.value = JSON.parse(data)
      } catch {
        slots.value = []
      }
    }
  }

  function saveToStorage(): void {
    localStorage.setItem('stack_like_saves', JSON.stringify(slots.value))
  }

  async function createSlot(): Promise<SaveSlot> {
    const now = Date.now()
    const newSlot: SaveSlot = {
      id: generateId(),
      name: `存档 ${slots.value.length + 1}`,
      createdAt: now,
      updatedAt: now,
      modList: []
    }
    slots.value.push(newSlot)
    saveToStorage()
    return newSlot
  }

  async function deleteSlot(id: string): Promise<void> {
    const index = slots.value.findIndex(s => s.id === id)
    if (index !== -1) {
      slots.value.splice(index, 1)
      saveToStorage()
    }
  }

  async function updateSlot(id: string, updates: Partial<SaveSlot>): Promise<void> {
    const slot = slots.value.find(s => s.id === id)
    if (slot) {
      Object.assign(slot, updates, { updatedAt: Date.now() })
      saveToStorage()
    }
  }

  function exportSave(id: string): void {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return

    const data = JSON.stringify(slot, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${slot.name}_${new Date(slot.updatedAt).toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  function exportAll(): void {
    const data = JSON.stringify(sortedSlots.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `stack_like_all_saves_${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  async function importSave(file: File): Promise<void> {
    try {
      const text = await file.text()
      const imported = JSON.parse(text) as SaveSlot

      if (!imported.id || !imported.name) {
        throw new Error('Invalid save file format')
      }

      const existing = slots.value.find(s => s.id === imported.id)
      if (existing) {
        if (imported.updatedAt > existing.updatedAt) {
          Object.assign(existing, imported)
        }
      } else {
        slots.value.push(imported)
      }

      saveToStorage()
    } catch (error) {
      console.error('Failed to import save:', error)
      throw error
    }
  }

  function getSlotById(id: string): SaveSlot | undefined {
    return slots.value.find(s => s.id === id)
  }

  return {
    slots,
    sortedSlots,
    loadSlots,
    createSlot,
    deleteSlot,
    updateSlot,
    exportSave,
    exportAll,
    importSave,
    getSlotById
  }
})