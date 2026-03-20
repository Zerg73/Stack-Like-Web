import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { gameConfig } from '@/config/game'

export function useKeyboardControls() {
  const gameStore = useGameStore()

  function handleKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return
    }

    const key = e.key

    if (key === gameConfig.shortcuts.togglePause) {
      e.preventDefault()
      gameStore.togglePause()
      return
    }

    if (key === gameConfig.shortcuts.zoomIn) {
      e.preventDefault()
      gameStore.zoomIn()
      return
    }

    if (key === gameConfig.shortcuts.zoomOut) {
      e.preventDefault()
      gameStore.zoomOut()
      return
    }

    if (key === gameConfig.shortcuts.zoomReset) {
      e.preventDefault()
      gameStore.resetZoom()
      return
    }

    const panSpeed = 50
    if (key === gameConfig.shortcuts.panUp) {
      e.preventDefault()
      gameStore.pan(0, panSpeed)
      return
    }

    if (key === gameConfig.shortcuts.panDown) {
      e.preventDefault()
      gameStore.pan(0, -panSpeed)
      return
    }

    if (key === gameConfig.shortcuts.panLeft) {
      e.preventDefault()
      gameStore.pan(panSpeed, 0)
      return
    }

    if (key === gameConfig.shortcuts.panRight) {
      e.preventDefault()
      gameStore.pan(-panSpeed, 0)
      return
    }

    if (key === gameConfig.shortcuts.rotateView) {
      e.preventDefault()
      gameStore.setRotateX(gameStore.viewport.rotateX === 0 ? gameConfig.perspective.maxRotateX : 0)
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}