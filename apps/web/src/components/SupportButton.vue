<template>
  <button
    type="button"
    class="cs-icon-btn"
    role="button"
    :aria-label="t('nav.contactService')"
    :title="t('nav.contactService')"
    @click="goSupport">
    <span class="cs-icon" aria-hidden="true">
      <!-- 耳机/客服图标（白色线条版），匹配参考图形样式 -->
      <svg viewBox="0 0 24 24">
        <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <!-- 头梁弧线 -->
          <path d="M6 12a6 6 0 0 1 12 0" />
          <!-- 左耳罩 + 左侧支撑（以线条表达耳罩存在） -->
          <path d="M6 12v2.1a1.9 1.9 0 0 0 1.9 1.9H9" />
          <!-- 右耳罩短竖线 -->
          <path d="M18 12v1.6" />
          <!-- 话筒弧线 -->
          <path d="M18 16.3a2 2 0 0 1-2 2h-1.2" />
        </g>
        <!-- 话筒端点小圆 -->
        <circle cx="18.6" cy="16.3" r="1.2" fill="currentColor" />
      </svg>
    </span>
    <span class="cs-label">{{ t('nav.contactService') }}</span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
const { t } = useI18n()
const router = useRouter()
function goSupport(){
  // 若当前已在 /chat/support，则强制刷新一次以确保用户感知到反馈
  const cur = router.currentRoute.value
  if (cur.name === 'chat' && cur.params?.id === 'support'){
    router.replace({ path: '/_refresh' }).then(() => router.replace({ name: 'chat', params: { id: 'support' } }))
    return
  }
  router.push({ name: 'chat', params: { id: 'support' } })
}
</script>

<style scoped>
/* 纯圆图标版 + 荧光绿描边 */
.cs-icon-btn{
  /* 外层采用“胶囊”布局：图标 + 文本一体可点 */
  display:inline-flex; align-items:center; gap:8px;
  border:0; border-radius:999px; cursor:pointer;
  background:transparent; color:var(--brand-text-on-pink); padding:4px 10px 4px 4px;
}
.cs-icon-btn:focus-visible{ outline:2px solid var(--brand-text-on-pink); outline-offset:2px; }
.cs-icon{
  width:42px; height:42px; border-radius:50%;
  display:grid; place-items:center;
  background:var(--brand-pink); /* 粉色圆底 */
  /* ring-offset + ring 效果：先偏移色，再外环荧光绿（恢复为常显） */
  box-shadow:
    0 0 0 2px var(--brand-pink-deep),
    0 0 0 6px var(--brand-ring);
  transition: background .15s ease, transform .1s ease;
}
.cs-icon-btn:hover .cs-icon{ background:var(--brand-pink-hover); }
.cs-icon-btn:active .cs-icon{ transform: scale(0.96); }
.cs-icon svg{ width:34px; height:34px; display:block; }

/* 文本标签，随 i18n 切换 */
.cs-label{
  font:600 14px/1.1 system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  color:var(--brand-text-on-pink); white-space:nowrap; user-select:none; max-width:160px; overflow:hidden; text-overflow:ellipsis;
}

@media (max-height: 640px){
  /* 小高屏紧凑显示：缩小间距与字号，避免遮挡 */
  .cs-icon-btn{ gap:8px; padding-right:8px; }
  .cs-label{ font-size:13px; }
}
</style>
