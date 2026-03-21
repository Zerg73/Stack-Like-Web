<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '@/stores/gameStore'
import { gameConfig } from '@/config/game'

const { t } = useI18n()
const gameStore = useGameStore()

// 快捷键列表
const shortcutList = computed(() => [
  { action: 'zoomIn', key: gameConfig.shortcuts.zoomIn, desc: t('help.actions.zoomIn') },
  { action: 'zoomOut', key: gameConfig.shortcuts.zoomOut, desc: t('help.actions.zoomOut') },
  { action: 'zoomReset', key: gameConfig.shortcuts.zoomReset, desc: t('help.actions.zoomReset') },
  { action: 'panUp', key: gameConfig.shortcuts.panUp, desc: t('help.actions.panUp') },
  { action: 'panDown', key: gameConfig.shortcuts.panDown, desc: t('help.actions.panDown') },
  { action: 'panLeft', key: gameConfig.shortcuts.panLeft, desc: t('help.actions.panLeft') },
  { action: 'panRight', key: gameConfig.shortcuts.panRight, desc: t('help.actions.panRight') },
  { action: 'rotateView', key: gameConfig.shortcuts.rotateView, desc: t('help.actions.rotateView') },
  { action: 'togglePause', key: gameConfig.shortcuts.togglePause === ' ' ? 'Space' : gameConfig.shortcuts.togglePause, desc: t('help.actions.togglePause') }
])

// 鼠标操作提示列表
const mouseHints = computed(() => [
  t('help.mouseHints.scroll'),
  t('help.mouseHints.dragViewport'),
  t('help.mouseHints.rightDrag'),
  t('help.mouseHints.doubleClick'),
  t('help.mouseHints.longPress')
])
</script>

<template>
  <Teleport to="body">
    <div v-if="gameStore.isHelpOpen" class="modal-overlay" @click.self="gameStore.toggleHelp()">
      <div class="help-modal">
        <div class="modal-header">
          <h2>{{ t('help.title') }}</h2>
          <button class="close-btn" @click="gameStore.toggleHelp()">✕</button>
        </div>

        <div class="modal-body">
          <table class="shortcut-table">
            <thead>
              <tr>
                <th>{{ t('help.shortcut') }}</th>
                <th>{{ t('help.function') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in shortcutList" :key="item.action">
                <td><kbd>{{ item.key }}</kbd></td>
                <td>{{ item.desc }}</td>
              </tr>
            </tbody>
          </table>

          <div class="hint-section">
            <h3>{{ t('help.mouseOperation') }}</h3>
            <ul>
              <li v-for="(hint, index) in mouseHints" :key="index">{{ hint }}</li>
            </ul>
          </div>
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

.help-modal {
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

.shortcut-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}

.shortcut-table th,
.shortcut-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.shortcut-table th {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
}

.shortcut-table td {
  font-size: 14px;
  color: var(--color-text);
}

kbd {
  display: inline-block;
  padding: 4px 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: var(--color-primary);
}

.hint-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 12px;
}

.hint-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hint-section li {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 6px 0;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
}

.hint-section li:last-child {
  border-bottom: none;
}
</style>
