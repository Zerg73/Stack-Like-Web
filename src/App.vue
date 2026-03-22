<script setup lang="ts">
import { ref } from 'vue'
import HomeView from './views/HomeView.vue'
import GameView from './views/GameView.vue'
import PixiDemo from './views/PixiDemo.vue'

const currentView = ref<'home' | 'game' | 'pixi-demo'>('home')
const currentSlotId = ref<string | null>(null)

function startGame(slotId: string) {
  currentSlotId.value = slotId
  currentView.value = 'game'
}

function goHome() {
  currentView.value = 'home'
  currentSlotId.value = null
}

function showPixiDemo() {
  currentView.value = 'pixi-demo'
}
</script>

<template>
  <div class="app">
    <HomeView 
      v-if="currentView === 'home'" 
      @start-game="startGame"
      @show-pixi-demo="showPixiDemo"
    />
    <PixiDemo v-else-if="currentView === 'pixi-demo'" @go-back="goHome" />
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