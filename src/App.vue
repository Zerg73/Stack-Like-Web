<script setup lang="ts">
import { ref } from 'vue'
import HomeView from './views/HomeView.vue'
import GameView from './views/GameView.vue'

const currentView = ref<'home' | 'game'>('home')
const currentSlotId = ref<string | null>(null)

function startGame(slotId: string) {
  currentSlotId.value = slotId
  currentView.value = 'game'
}

function goHome() {
  currentView.value = 'home'
  currentSlotId.value = null
}
</script>

<template>
  <div class="app">
    <HomeView v-if="currentView === 'home'" @start-game="startGame" />
    <GameView v-else :slot-id="currentSlotId" @go-home="goHome" />
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>