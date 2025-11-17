<template>
  <footer class="bg-gray-900 text-gray-300 soft-join">
    <div class="container mx-auto px-4 py-8 text-center">
      <!-- 品牌支付标识 -->
      <div v-if="!hidePayments" class="flex items-center justify-center gap-4 mb-4 opacity-95 select-none">
        <!-- VISA 标识 (简化 SVG) -->
        <svg aria-hidden="true" width="64" height="20" viewBox="0 0 64 20" fill="none" class="text-[#1a1f71]">
          <path fill="currentColor" d="M9.9 2.2L6.8 17.8H2.7L5.8 2.2h4.1Zm7.4 0c1 .1 2 .3 2.7.8.6.4 1.1 1.1 1.1 2 0 1.7-1.3 2.7-2.9 3.2v.1c1.6.4 2.5 1.4 2.5 2.8 0 1.2-.8 2.2-1.9 2.7-1 .5-2.3.8-3.5.8h-5L12.4 2.2h4.9Zm-1.9 6.1c.9 0 1.6-.2 2.1-.5.5-.3.8-.8.8-1.4 0-.6-.3-1-.8-1.2-.5-.2-1.1-.3-1.7-.3h-1.6l-.7 3.4h1.9Zm-1.2 5.7c1 0 1.9-.2 2.6-.5.7-.3 1.1-.8 1.1-1.5 0-.6-.3-1-.8-1.2-.5-.3-1.2-.4-2-.4h-2l-.8 3.6h1.9ZM33.8 2.2l-3.7 15.6h-4.1L29.7 2.2h4.1ZM43 2.2c1.3 0 2.4.2 3.2.6.8.4 1.4 1.1 1.4 2 0 1.5-1.2 2.4-2.6 2.8v.1c1.7.3 2.9 1.2 2.9 2.9 0 1.1-.5 2-1.4 2.6-1 .7-2.4 1-4.1 1h-6.2L38.9 2.2H43Zm-2 6.1c.9 0 1.7-.2 2.2-.5.6-.3.9-.8.9-1.4 0-.6-.3-1-.8-1.2-.5-.2-1.2-.3-1.9-.3h-1.7l-.7 3.4H41Zm-1.3 5.7c1.1 0 2-.2 2.7-.5.7-.3 1.1-.8 1.1-1.5 0-.6-.3-1-.8-1.2-.6-.3-1.3-.4-2.1-.4h-2.1l-.8 3.6h2Z"/>
        </svg>
        <!-- Mastercard 标识 (双圆) -->
        <svg aria-hidden="true" width="44" height="28" viewBox="0 0 44 28" fill="none">
          <circle cx="16" cy="14" r="10" fill="#EB001B"/>
          <circle cx="28" cy="14" r="10" fill="#F79E1B"/>
        </svg>
      </div>

      <!-- 链接 -->
      <nav class="text-sm mb-2">
        <ul class="flex items-center justify-center gap-4 flex-wrap">
          <li><router-link class="hover:text-white/90" to="/terms">{{ t('footer.terms') }}</router-link></li>
          <li class="opacity-60">|</li>
          <li><router-link class="hover:text-white/90" to="/privacy">{{ t('footer.privacy') }}</router-link></li>
          <li class="opacity-60">|</li>
          <li><router-link class="hover:text-white/90" to="/security">{{ t('footer.security') }}</router-link></li>
          <li class="opacity-60">|</li>
          <li><router-link class="hover:text-white/90" to="/help">{{ t('footer.help') }}</router-link></li>
          <li class="opacity-60">|</li>
          <li><router-link class="hover:text-white/90" to="/contact">{{ t('footer.contact') }}</router-link></li>
        </ul>
      </nav>

      <!-- 版权 -->
      <div class="text-xs text-gray-400">Copyright © 2025 heartchat All Rights Reserved.</div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
const route = useRoute()
// 统一与首页一致：所有页面均显示支付品牌标识（不再在聊天页隐藏）
const hidePayments = computed(() => false)
</script>

<style scoped>
/* 让内容到 Footer 的过渡更自然：顶部柔和渐变 + 轻微内阴影 */
.soft-join{ position: relative; }
.soft-join::before{
  content: "";
  position: absolute; left:0; right:0; top:-18px; height:18px; pointer-events:none;
  /* 从透明过渡到 footer 背景的半透明，贴合 bg-gray-900(#111827) */
  background: linear-gradient(to bottom, rgba(17,24,39,0) 0%, rgba(17,24,39,0.28) 60%, rgba(17,24,39,0.46) 100%);
}
/* 顶部内阴影，弱化“断层”的感觉（放在 footer 内部，不影响布局） */
.soft-join::after{
  content: "";
  position:absolute; left:0; right:0; top:0; height:6px; pointer-events:none;
  box-shadow: 0 -6px 12px rgba(0,0,0,.08) inset;
}
/* 矮屏时收紧底部间距和字体，避免占用过多竖向空间 */
@media (max-height: 760px){
  .container{ padding-top: 12px; padding-bottom: 12px; }
  nav.text-sm{ font-size: 12px; }
  .text-xs{ font-size: 11px; }
}
</style>
