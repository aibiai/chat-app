<template>
  <div class="min-h-screen flex flex-col relative">
    <!-- 应用级背景容器，供聊天页注入背景图样式（通过后端配置） -->
    <div id="app-bg" class="pointer-events-none absolute inset-0 z-0"></div>
    <NavBar />
    <main class="flex-1 w-full app-main">
      <router-view />
    </main>
    <FooterBar />
  </div>
  
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import FooterBar from './components/FooterBar.vue'
</script>

<style scoped>
.app-main{ padding-top: 72px; }
@media (max-height: 760px){
  .app-main{ padding-top: 60px; }
}
</style>
