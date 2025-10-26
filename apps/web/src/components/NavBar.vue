<template>
  <header :class="['fixed top-0 left-0 right-0 z-40 text-white', `locale-${locale}`]" style="background:var(--brand-navbar-bg)">
    <div class="nav-wrap">
      <!-- 左：品牌 + 搜索框 -->
      <div class="left">
        <router-link to="/" class="brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="opacity-90">
            <path d="M12 21s-6.716-4.58-9.193-9.193C1.33 8.194 3.46 5 6.807 5c1.86 0 3.41 1.08 4.193 2.64C11.783 6.08 13.333 5 15.193 5 18.54 5 20.67 8.194 21.193 11.807 18.716 16.42 12 21 12 21z"/>
          </svg>
          <span class="brand-name">{{ t('brand.name') }}</span>
        </router-link>
      </div>

      <!-- 中：导航菜单（带选中下划线） -->
      <nav class="center">
        <form class="search" @submit.prevent="onSearch" style="justify-content: space-between;">
          <input v-model="keyword" type="search" :placeholder="searchPlaceholder" />
          <button type="submit" class="go" aria-label="search">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </button>
        </form>
  <div class="menu-spread">
          <router-link to="/" class="nav-item" :class="{active: isActive('/')}">
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9l9-8z"/></svg>
            </span>
            {{ t('nav.home') }}
          </router-link>
          <router-link to="/lucky" class="nav-item" :class="{active: isActive('/lucky')}">
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.1L21 9l-4.8 4.1L17.7 20 12 16.9 6.3 20l1.5-6.9L3 9l6.4-.9L12 2z"/></svg>
            </span>
            {{ t('nav.lucky') }}
          </router-link>
          <router-link to="/confession" class="nav-item">
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.6-9.2-9.2C1.3 8.2 3.5 5 6.8 5c1.9 0 3.4 1.1 4.2 2.6C11.8 6.1 13.3 5 15.2 5 18.5 5 20.7 8.2 21.2 11.8 18.7 16.4 12 21 12 21z"/></svg>
            </span>
            {{ t('nav.confession') }}
          </router-link>
          <router-link :to="{ name: 'chat', params: { id: 'support' } }" class="nav-item" :class="{active: isActive('/chat')}">
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
            </span>
            {{ t('nav.chat') }}
          </router-link>
          <router-link to="/gifts" class="nav-item">
            <span class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1zM9 5h6v2H9V5zm12 8H3v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6z"/></svg>
            </span>
            {{ t('nav.gifts') }}
          </router-link>
          <router-link to="/gift-box" class="nav-item">
            <span class="icon" aria-hidden="true">
              <!-- 礼物包装盒图标：盒体 + 盒盖 + 中央竖向丝带 + 顶部蝴蝶结（采用 currentColor 继承颜色） -->
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <!-- 盒体 -->
                <rect x="4" y="9" width="16" height="11" rx="2"/>
                <!-- 盒盖 -->
                <rect x="3" y="7" width="18" height="2" rx="1"/>
                <!-- 竖向丝带 -->
                <rect x="11" y="9" width="2" height="11"/>
                <!-- 蝴蝶结两侧环 -->
                <rect x="5.2" y="2.2" width="5.2" height="3.6" rx="1.8"/>
                <rect x="13.6" y="2.2" width="5.2" height="3.6" rx="1.8"/>
                <!-- 蝴蝶结中心结 -->
                <rect x="10.4" y="4" width="3.2" height="2.8" rx="1.4"/>
              </svg>
            </span>
            {{ t('nav.giftBox') }}
          </router-link>
          <div class="pill-group">
            <button type="button" class="pill ghost nav-pill" @click="openVip">{{ t('nav.upgrade') }}</button>
            <button type="button" class="pill ghost nav-pill" @click="openTopUp">{{ t('nav.topup') }}</button>
          </div>
        </div>
      </nav>

      <!-- 右：用户区 + 语言 + 客服 -->
      <div class="right">
        <!-- 移动端：在右侧保留一个仅小屏显示的头像，避免 center 被隐藏时无法进入个人菜单 -->
        <template v-if="auth.token">
          <!-- 桌面端头像：移至右侧，避免被 center 的 overflow 裁剪 -->
          <div class="user user--desktop" @keydown.escape.stop.prevent="userOpen = false">
            <button type="button" class="avatar-btn" @click="toggleUserMenu" :aria-expanded="userOpen" aria-haspopup="menu">
              <AvatarImg :src="me?.avatarUrl || ''" :gender="(me?.gender as any)" :size="42" />
            </button>
            <div v-if="userOpen" class="user-menu" role="menu">
              <div class="tip" aria-hidden="true"></div>
              <button class="user-item" role="menuitem" @click="go('/onboarding?tab=basic')">{{ t('nav.profileCenter') }}</button>
              <button class="user-item" role="menuitem" @click="go('/avatar')">{{ t('nav.avatarSettings') }}</button>
              <button class="user-item" role="menuitem" @click="go('/onboarding?tab=verify')">{{ t('nav.identityVerify') }}</button>
              <button class="user-item" role="menuitem" @click="go('/settings')">{{ t('nav.systemSettings') }}</button>
              <button class="user-item danger" role="menuitem" @click="logoutAndClose">{{ t('nav.logout') }}</button>
            </div>
          </div>

          <div class="user mobile-only" @keydown.escape.stop.prevent="userOpen = false">
            <button type="button" class="avatar-btn" @click="toggleUserMenu" :aria-expanded="userOpen" aria-haspopup="menu">
              <AvatarImg :src="me?.avatarUrl || ''" :gender="(me?.gender as any)" :size="42" />
            </button>
            <div v-if="userOpen" class="user-menu" role="menu">
              <div class="tip" aria-hidden="true"></div>
              <button class="user-item" role="menuitem" @click="go('/onboarding?tab=basic')">{{ t('nav.profileCenter') }}</button>
              <button class="user-item" role="menuitem" @click="go('/avatar')">{{ t('nav.avatarSettings') }}</button>
              <button class="user-item" role="menuitem" @click="go('/onboarding?tab=verify')">{{ t('nav.identityVerify') }}</button>
              <button class="user-item" role="menuitem" @click="go('/settings')">{{ t('nav.systemSettings') }}</button>
              <button class="user-item danger" role="menuitem" @click="logoutAndClose">{{ t('nav.logout') }}</button>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link class="pill ghost" to="/register">{{ t('nav.register') }}</router-link>
          <router-link class="pill solid" to="/login" style="color:var(--brand-navbar-bg)">{{ t('nav.login') }}</router-link>
        </template>

        <!-- 语言选择：pill 按钮 + 下拉菜单 -->
        <div class="lang" @keydown.escape.stop.prevent="open = false">
          <button type="button" class="pill ghost" @click="toggle()" :aria-expanded="open" aria-haspopup="listbox">
            <span>{{ currentLocaleLabel }}</span>
            <span class="sub">({{ t('nav.language') }})</span>
            <svg class="caret" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
          </button>
          <div v-if="open" class="menu" role="listbox">
            <button v-for="l in locales" :key="l.code" role="option" :aria-selected="l.code===locale" @click="choose(l.code)" class="menu-item">
              <span>{{ l.label }}</span>
              <svg v-if="l.code===locale" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z"/></svg>
            </button>
          </div>
        </div>

        <!-- 客服按钮：放在语言切换右侧 -->
        <SupportButton />
      </div>
    </div>
    <!-- 弹窗：储值 / 升级（使用 Teleport，不影响布局） -->
    <TopUpModal v-model="topupOpen" :balance="balance" @confirm="onTopUpConfirm" />
    <VipModal v-model="vipOpen" :current-level="currentVipText" :diamond-icon="'/vip/diamond.png'" :crown-icon="'/vip/crown.webp'" @confirm="onVipConfirm" />
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'
import { useAuth } from '../stores'
import SupportButton from './SupportButton.vue'
import AvatarImg from './AvatarImg.vue'
import TopUpModal from './TopUpModal.vue'
import VipModal from './VipModal.vue'
import api from '../api'

const { t, locale } = useI18n()
const router = useRouter()
const locales = SUPPORTED_LOCALES
const auth = useAuth()
const open = ref(false)
const userOpen = ref(false)
const currentLocaleLabel = computed(() => locales.find(l => l.code === locale.value)?.label || locale.value)
function toggle(){ open.value = !open.value }
function choose(code: typeof locales[number]['code']) { setLocale(code); open.value = false }
function onDocClick(e: MouseEvent){
  const target = e.target as HTMLElement
  // 分别处理两个菜单：点击非各自容器区域才关闭
  if (!target.closest('.lang')) open.value = false
  if (!target.closest('.user')) userOpen.value = false
}
onMounted(() => { 
  document.addEventListener('click', onDocClick)
  // 暴露全局入口，便于其他页面直接唤起会员升级弹窗
  ;(window as any).__openVipModal = () => { vipOpen.value = true }
})
onBeforeUnmount(() => { 
  document.removeEventListener('click', onDocClick)
  try { delete (window as any).__openVipModal } catch {}
})

function logout(){
  auth.logout()
  router.push('/login')
}
function logoutAndClose(){ userOpen.value = false; logout() }
function toggleUserMenu(){ userOpen.value = !userOpen.value }
async function go(path: string){
  userOpen.value = false;
  // 如果目标路径与当前一致（仅 query 不同或相同），先 replace 再 push 强制刷新视图
  const cur = router.currentRoute.value.fullPath
  if (cur === path){
    await router.replace({ path: '/_refresh' })
    await router.replace(path)
  } else {
    router.push(path)
  }
}

// 搜索
const keyword = ref('')
const searchPlaceholder = computed(() => t('chat.search.placeholder'))
function onSearch(){
  // 占位：跳转到首页并带查询参数，后续可替换为搜索页
  router.push({ path: '/', query: { q: keyword.value || '' } })
}

// 菜单选中态（首页、聊天）
function isActive(path: string){
  const cur = router.currentRoute.value.path
  if (path === '/') return cur === '/'
  if (path === '/chat') return cur.startsWith('/chat')
  if (path === '/lucky') return cur.startsWith('/lucky')
  return false
}

// 获取当前用户，显示头像
type Gender = 'male' | 'female' | 'other'
interface Me { id: string; nickname?: string; gender?: Gender; avatarUrl?: string; balance?: number }
interface MeVip extends Me { membershipLevel?: 'purple'|'crown'|'none'; membershipUntil?: number }
const me = ref<MeVip | null>(null)
async function fetchMe(){
  try{
    const { data } = await api.get('/api/users/me')
    me.value = data
  }catch(_e){
    me.value = null
  }
}
onMounted(() => { if (auth.token) fetchMe() })
watch(() => auth.token, (val) => { if (val) fetchMe(); else me.value = null })

const currentVipText = computed(() => {
  const lvl = me.value?.membershipLevel || 'none'
  const until = me.value?.membershipUntil || 0
  const base = lvl === 'purple' ? t('vip.tier.purple') : (lvl === 'crown' ? t('vip.tier.crown') : t('vip.tier.none'))
  if (until && until > Date.now()) {
    const d = new Date(until)
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    return `${base} (${t('vip.expires')} ${y}-${m}-${dd})`
  }
  return base
})

// 储值弹窗控制
const topupOpen = ref(false)
const balance = ref(0)
function openTopUp(){
  if (!auth.token) { router.push('/login'); return }
  // 打开前请求余额
  fetchMe().then(() => {
    const b = Number(me.value?.balance as any)
    if (Number.isFinite(b)) balance.value = b
  })
  topupOpen.value = true
}
function onTopUpConfirm(amount: number){
  // TODO: 接入支付/下单流程，这里先打印
  console.log('TopUp confirm:', amount)
}

// 升级弹窗控制
const vipOpen = ref(false)
function openVip(){
  if (!auth.token) { router.push('/login'); return }
  vipOpen.value = true
}
function onVipConfirm(payload: { tier: 'purple'|'crown'; months: number; usd: number }){
  console.log('Vip confirm:', payload)
}
</script>

<style scoped>
.nav-wrap{ max-width:100%; margin:0 auto; height:72px; padding:0 14px; display:flex; align-items:center; justify-content:space-between; gap:14px; }
.left{ display:flex; align-items:center; gap:20px; min-width:0; height:42px; }
.brand{ display:inline-flex; align-items:center; gap:10px; color:#fff; font-weight:800; letter-spacing:.5px; flex-shrink:0; white-space:nowrap; }
.brand-name{ font-size:18px; font-weight:800; letter-spacing:.6px; white-space:nowrap; }

/* 搜索框（圆角、白底、右侧圆形放大镜按钮） */
.search{ position:relative; display:inline-flex; align-items:center; flex:0 0 auto; min-width:140px; margin-right:10px; height:42px; top:1px; }
.search input{
  width: clamp(140px, 14vw, 200px); height: 42px; border:0; border-radius:999px; padding:0 52px 0 16px; background:#fff; color:#333; font-weight:600; font-size:13px; box-sizing:border-box; line-height:42px;
}
.search input::placeholder{ color:#bfbfbf; font-weight:600; font-size:13px; }
.search .go{ position:absolute; right:6px; top:50%; transform:translateY(-50%); width:38px; height:38px; border-radius:50%; border:0; background:#fff; color:#999; display:grid; place-items:center; box-shadow:0 1px 2px rgba(0,0,0,.08); }

/* 中间导航（选中下划线） */
.center{ display:flex; align-items:center; gap:12px; font-weight:700; white-space:nowrap; flex:1 1 auto; min-width:0; justify-content:center; height:42px; overflow:hidden; }
.menu-spread{ display:flex; align-items:center; justify-content:space-evenly; gap:8px; flex:1 1 auto; min-width:0; flex-wrap:nowrap; }
.nav-item{ position:relative; padding:6px 2px; color:#fff; opacity:.9; line-height:1; white-space:nowrap; }
.nav-item{ display:inline-flex; align-items:center; gap:6px; font-size:13px; }
.nav-item .icon{ display:inline-flex; width:18px; height:18px; opacity:.95; }
.nav-item .icon svg{ width:18px; height:18px; display:block; }
.nav-item:hover{ opacity:1; }
.nav-item.active{ opacity:1; }
.nav-item.active::after{ content:""; position:absolute; left:0; right:0; bottom:2px; margin:auto; width:24px; height:3px; border-radius:2px; background:#fff; }

/* 婚恋主题：图标在 hover/active 时使用品牌粉的高亮 */
.nav-item .icon{ color:#fff; }
.nav-item:hover .icon svg{ color: var(--brand-pink, #f17384); }
.nav-item.active .icon svg{ color: var(--brand-pink, #f17384); }

/* 右侧用户区 */
.right{ display:flex; align-items:center; gap:10px; flex-wrap:nowrap; white-space:nowrap; flex-shrink:0; min-width:0; }
.user{ position:relative; display:flex; align-items:center; gap:10px; flex-wrap:nowrap; }
.user.user--desktop{ display:inline-flex; }
.user .pill{ position:relative; top:1px; }
.avatar{ width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,.25); display:grid; place-items:center; font-size:14px; }
.name{ color:#fff; opacity:.95; font-weight:700; }
.avatar-btn{ padding:0; margin:0; border:0; background:transparent; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; }
.avatar-btn:focus-visible{ outline:2px solid rgba(255,255,255,.65); outline-offset:2px; }

/* 个人菜单样式 */
.user-menu{ position:absolute; top:calc(100% + 12px); right:0; background:#fff; color:#111; border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.14); border:1px solid #e5e7eb; padding:8px 0; width:max-content; min-width:180px; max-width:clamp(220px, 26vw, 360px); z-index:9999; display:flex; flex-direction:column; white-space:nowrap; }
.user-menu .tip{ position:absolute; top:-8px; right:18px; width:14px; height:14px; background:#fff; border-left:1px solid #e5e7eb; border-top:1px solid #e5e7eb; transform:rotate(45deg); }
.user-item{ width:100%; text-align:left; padding:10px 14px; background:transparent; border:0; color:#333; font-weight:700; line-height:1.25; }
.user-item + .user-item{ border-top:1px solid #f3f4f6; }
.user-item:hover{ background:#f8fafc; }
.user-item.danger{ color:#d33; }

@media (max-width: 480px){
  .user-menu{ max-width:90vw; min-width:180px; }
}
.pill{ height:40px; border-radius:999px; padding:0 12px; font-weight:600; font-size:13px; border:1px solid rgba(255,255,255,.7); white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; line-height:1; box-sizing:border-box; overflow:hidden; }
.pill > *{ line-height:1; }
.pill svg{ display:block; }
.pill.ghost{ background:transparent; color:#fff; }
.pill.ghost:hover{ background:rgba(255,255,255,.12); }
.pill.solid{ background:#fff; }
/* 导航内的操作按钮（升级/储值）：与 nav-item 保持一致的高度与对齐 */
.nav-pill{ height:40px; display:inline-flex; align-items:center; justify-content:center; margin:0; }
.menu-spread .nav-pill{ align-self:center; }
/* 按钮小分组：更紧凑的内部间距 */
.pill-group{ display:inline-flex; gap:8px; align-items:center; }
/* 语言按钮更紧凑 */
.lang > .pill{ padding:0 8px; align-items:center; }

/* 语言下拉 */
.lang{ position:relative; display:flex; align-items:center; }
.lang .sub{ margin-left:6px; opacity:.9; font-size:14px; line-height:1; font-weight:600; }
.lang .caret{ width:14px; height:14px; margin-left:6px; opacity:.9; display:block; align-self:center; }
.menu{ position:absolute; right:0; top:calc(100% + 8px); min-width:180px; background:#fff; color:#111; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.12); border:1px solid #e5e7eb; overflow:hidden; }
.menu-item{ width:100%; text-align:left; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; }
.menu-item:hover{ background:#f9fafb; }

@media (max-width: 900px){
  .center{ display:none; }
  .search input{ width: 180px; }
  /* 当中间导航被隐藏时，仅显示右侧的移动端头像 */
  .user--desktop{ display:none !important; }
  .mobile-only{ display:inline-flex; }
}
@media (max-width: 600px){
  .search{ display:none; }
}
/* 默认情况下隐藏 mobile-only，只在小屏显示 */
.mobile-only{ display:none; }
/* 在较窄屏幕隐藏 (Language) 附加文案，节省空间 */
@media (max-width: 1280px){
  .lang .sub{ display:none; }
}

/* 韩语下，为了保留“联系客服”文字，提前隐藏 (Language) 附文 */
@media (max-width: 1400px){
  .locale-ko .lang .sub{ display:none; }
}

/* 进一步压缩：为日文等长标签提前留出空间 */
@media (max-width: 1480px){
  .brand-name{ font-size:18px; }
  .menu-spread{ gap:8px; }
  .nav-item{ font-size:13px; }
  .pill{ height:40px; padding:0 10px; font-size:13px; }
  .lang > .pill{ padding:0 8px; }
  .search input{ width: clamp(150px, 16vw, 200px); }
}

/* 额外的响应式压缩：避免英文/日文下的重叠 */
@media (max-width: 1366px){
  .nav-wrap{ gap:12px; }
  .menu-spread{ gap:8px; }
  .nav-item{ font-size:13px; }
  .pill{ height:40px; padding:0 12px; font-size:13px; }
  .lang > .pill{ padding:0 8px; }
  .search input{ width: clamp(160px, 20vw, 220px); }
}
@media (max-width: 1200px){
  /* 隐藏“联系客服”的文字，保留图标以节省空间 */
  :deep(.cs-label){ display:none; }
}

/* 在 1400px 以下也隐藏客服文字，避免日/英长文案拥挤 */
@media (max-width: 1400px){
  :deep(.cs-label){ display:none; }
}

/* 在矮屏设备压缩导航高度与字号，留出更多竖向空间 */
@media (max-height: 760px){
  .nav-wrap{ height:60px; }
  .brand-name{ font-size:18px; }
  .pill{ height:38px; font-size:13px; }
  .search{ height:38px; }
  .search input{ height:38px; line-height:38px; }
  .lang .sub{ display:none; }
}

/* 日语模式下进一步缩短搜索栏，避免重叠 */
.locale-ja .search{ min-width:100px; }
.locale-ja .search input{ width: clamp(100px, 10vw, 160px); font-size:12px; padding-right:46px; }
.locale-ja .search input::placeholder{ font-size:12px; }
.locale-ja .search .go{ width:34px; height:34px; right:4px; }

/* 韩语：文案中等偏长，略微比默认更紧凑 */
.locale-ko .brand-name{ font-size:20px; }
.locale-ko .search{ min-width:120px; }
.locale-ko .search input{ width: clamp(130px, 14vw, 210px); font-size:14px; }
.locale-ko .nav-item{ font-size:14px; }
.locale-ko .pill{ padding:0 12px; font-size:14px; height:42px; }

/* 繁体中文：文字略宽，适度压缩 */
.locale-zh-TW .search{ min-width:130px; }
.locale-zh-TW .search input{ width: clamp(130px, 13vw, 200px); }
.locale-zh-TW .nav-item{ font-size:13px; }
.locale-zh-TW .pill{ padding:0 11px; height:40px; }

/* 简体中文：默认即可，保留微调钩子 */
.locale-zh-CN .search input{ width: clamp(140px, 14vw, 200px); }

/* 英文：文案最短，可稍放松但保持一致性 */
.locale-en .search input{ width: clamp(150px, 16vw, 220px); }

/* 简体中文：提升可读性与视觉舒适度（大屏优先），窄屏仍按媒体查询压缩 */
.locale-zh-CN .brand-name{ font-size:20px; }
.locale-zh-CN .menu-spread{ gap:10px; }
.locale-zh-CN .nav-item{ font-size:14px; }
.locale-zh-CN .pill{ height:42px; padding:0 14px; font-size:14px; }
.locale-zh-CN .search input{ width: clamp(160px, 16vw, 240px); font-size:14px; }
.locale-zh-CN .search input::placeholder{ font-size:14px; }

/* 繁体中文：字面更宽，适度放大并增加胶囊舒适度 */
.locale-zh-TW .brand-name{ font-size:20px; }
.locale-zh-TW .menu-spread{ gap:10px; }
.locale-zh-TW .nav-item{ font-size:14px; }
.locale-zh-TW .pill{ height:42px; padding:0 14px; font-size:14px; }
.locale-zh-TW .search input{ width: clamp(160px, 16vw, 240px); font-size:14px; }
.locale-zh-TW .search input::placeholder{ font-size:14px; }
</style>
