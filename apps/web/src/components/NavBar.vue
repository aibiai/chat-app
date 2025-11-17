<template>
  <header :class="['fixed top-0 left-0 right-0 z-40 text-white', localeClass , { 'auth-page': isAuthPage }]" style="background:var(--brand-navbar-bg)">
    <!-- 品牌 + 搜索 -->
  <router-link :to="auth.token ? '/' : '/login'" class="brand">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="brand-logo opacity-90">
        <path d="M12 21s-6.716-4.58-9.193-9.193C1.33 8.194 3.46 5 6.807 5c1.86 0 3.41 1.08 4.193 2.64C11.783 6.08 13.333 5 15.193 5 18.54 5 20.67 8.194 21.193 11.807 18.716 16.42 12 21 12 21z"/>
      </svg>
      <span class="brand-name">{{ t('brand.name') }}</span>
    </router-link>

    <form class="search" @submit.prevent="onSearch">
      <input v-model="keyword" type="search" :placeholder="searchPlaceholder" />
      <button type="submit" class="go" aria-label="search">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      </button>
    </form>

    <!-- 导航菜单（去除布局包装，仅保留内容） -->
    <nav v-if="!isAuthPage">
  <router-link to="/" class="nav-item nav-item--primary" :class="{active: isActive('/')}">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9l9-8z"/></svg>
        </span>
        <span class="label">{{ t('nav.home') }}</span>
      </router-link>
  <router-link to="/lucky" class="nav-item nav-item--primary" :class="{active: isActive('/lucky')}">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.1L21 9l-4.8 4.1L17.7 20 12 16.9 6.3 20l1.5-6.9L3 9l6.4-.9L12 2z"/></svg>
        </span>
        <span class="label">{{ t('nav.lucky') }}</span>
      </router-link>
  <router-link to="/confession" class="nav-item nav-item--primary" :class="{active: isActive('/confession')}">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.7-4.6-9.2-9.2C1.3 8.2 3.5 5 6.8 5c1.9 0 3.4 1.1 4.2 2.6C11.8 6.1 13.3 5 15.2 5 18.5 5 20.7 8.2 21.2 11.8 18.7 16.4 12 21 12 21z"/></svg>
        </span>
        <span class="label">{{ t('nav.confession') }}</span>
      </router-link>
  <router-link :to="{ name: 'chat', params: { id: 'support' } }" class="nav-item nav-item--primary" :class="{active: isActive('/chat')}">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
        </span>
        <span class="label">{{ t('nav.chat') }}</span>
      </router-link>
  <router-link to="/gifts" class="nav-item nav-item--primary" :class="{active: isActive('/gifts')}">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1zM9 5h6v2H9V5zm12 8H3v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6z"/></svg>
        </span>
        <span class="label">{{ t('nav.gifts') }}</span>
      </router-link>
  <router-link to="/gift-box" class="nav-item nav-item--primary" :class="{active: isActive('/gift-box')}">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <rect x="4" y="9" width="16" height="11" rx="2"/>
            <rect x="3" y="7" width="18" height="2" rx="1"/>
            <rect x="11" y="9" width="2" height="11"/>
            <rect x="5.2" y="2.2" width="5.2" height="3.6" rx="1.8"/>
            <rect x="13.6" y="2.2" width="5.2" height="3.6" rx="1.8"/>
            <rect x="10.4" y="4" width="3.2" height="2.8" rx="1.4"/>
          </svg>
        </span>
        <span class="label">{{ t('nav.giftBox') }}</span>
      </router-link>

      <button type="button" class="pill ghost nav-pill" @click="openVip">{{ t('nav.upgrade') }}</button>
      <button type="button" class="pill ghost nav-pill" @click="openTopUp">{{ t('nav.topup') }}</button>
    </nav>

    <!-- 用户/登录 + 语言 + 客服（仅保留内容，不做布局包装） -->
    <template v-if="auth.token">
      <div class="user user--desktop" @keydown.escape.stop.prevent="userOpen = false">
        <button type="button" class="avatar-btn" @click="toggleUserMenu" :aria-expanded="userOpen" aria-haspopup="menu">
          <AvatarImg :src="me?.avatarUrl || ''" :gender="(me?.gender as any)" :size="46" />
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
          <AvatarImg :src="me?.avatarUrl || ''" :gender="(me?.gender as any)" :size="46" />
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
    <div v-else class="auth-actions">
      <router-link class="pill ghost" to="/register">{{ t('nav.register') }}</router-link>
      <router-link class="pill solid" to="/login" style="color:var(--brand-navbar-bg)">{{ t('nav.login') }}</router-link>
      <!-- 语言与客服在未登录时也需要右侧跟随，保持在同一容器中 -->
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
      <!-- 未登录状态下不显示联系客服入口 -->
    </div>

    <!-- 登录后仍显示语言与客服（保持原位置） -->
    <div v-if="auth.token" class="lang" @keydown.escape.stop.prevent="open = false">
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
    <div v-if="auth.token && !isAuthPage" class="support">
      <SupportButton />
    </div>

    <!-- 弹窗：储值 / 升级（Teleport，不影响结构） -->
    <TopUpModal v-model="topupOpen" :balance="balance" @confirm="onTopUpConfirm" @openRedeem="openCardRedeem" />
    <VipModal v-model="vipOpen" :current-level="currentVipText" :diamond-icon="'/vip/diamond.png'" :crown-icon="'/vip/crown.webp'" @confirm="onVipConfirm" />
  <CardRedeemModal v-model="cardRedeemOpen" @confirm="onCardRedeemConfirm" />
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
import CardRedeemModal from './CardRedeemModal.vue'

const { t, locale } = useI18n()
const localeClass = computed(() => `locale-${String(locale.value)}`)
const router = useRouter()
const locales = SUPPORTED_LOCALES
const auth = useAuth()
const open = ref(false)
const userOpen = ref(false)
const currentLocaleLabel = computed(() => locales.find(l => l.code === locale.value)?.label || locale.value)
function toggle(){ open.value = !open.value }
function choose(code: typeof locales[number]['code']) { setLocale(code); open.value = false }
// 是否处于登录/注册页：用于自适配精简导航，避免元素挤压重叠
const isAuthPage = computed(() => {
  const p = router.currentRoute.value.path
  return p.startsWith('/login') || p.startsWith('/register')
})
function onDocClick(e: MouseEvent){
  const target = e.target as HTMLElement
  if (!target.closest('.lang')) open.value = false
  if (!target.closest('.user')) userOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  ;(window as any).__openVipModal = () => { vipOpen.value = true }
  // 头像更新后主动刷新当前用户数据
  window.addEventListener('me-avatar-updated', () => { fetchMe() })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  try { delete (window as any).__openVipModal } catch{}
})

function logout(){
  auth.logout()
  router.push('/login')
}
function logoutAndClose(){ userOpen.value = false; logout() }
function toggleUserMenu(){ userOpen.value = !userOpen.value }
async function go(path: string){
  userOpen.value = false
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
  router.push({ path: '/', query: { q: keyword.value || '' } })
}

// 菜单选中态（首页、聊天等）
function isActive(path: string){
  const cur = router.currentRoute.value.path
  if (path === '/') return cur === '/'
  if (path === '/chat') return cur.startsWith('/chat')
  if (path === '/lucky') return cur.startsWith('/lucky')
  if (path === '/confession') return cur.startsWith('/confession')
  if (path === '/gifts') return cur.startsWith('/gifts')
  if (path === '/gift-box') return cur.startsWith('/gift-box')
  return false
}

// 当前用户信息（用于头像/余额/VIP）
type Gender = 'male' | 'female' | 'other'
interface Me { id: string; nickname?: string; gender?: Gender; avatarUrl?: string; balance?: number; email?: string }
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
  if (until && until > Date.now()){
    const d = new Date(until)
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    return `${base} (${t('vip.expires')} ${y}-${m}-${dd})`
  }
  return base
})
// ������������
const topupOpen = ref(false)
const topupProcessing = ref(false)
const balance = ref(0)
function openTopUp(){
  if (!auth.token) { router.push('/login'); return }
  fetchMe().then(() => {
    const b = Number(me.value?.balance as any)
    if (Number.isFinite(b)) balance.value = b
  })
  topupOpen.value = true
}
async function onTopUpConfirm(amount: number){
  if (topupProcessing.value) return
  if (!auth.token) { router.push('/login'); return }
  const value = Math.max(1, Math.floor(Number(amount) || 0))
  if (!Number.isFinite(value) || value <= 0){
    alert(t('topup.alerts.invalidAmount'))
    return
  }
  try{
    topupProcessing.value = true
    const { data } = await api.post('/api/orders/recharge', { amount: value, method: 'online' })
    if (data && typeof data.balance === 'number') balance.value = Number(data.balance)
    await fetchMe()
    alert(t('topup.alerts.success'))
  }catch(err){
    console.error(err)
    const msg = (err as any)?.response?.data?.error
    alert(msg ? String(msg) : t('topup.alerts.failed'))
  }finally{
    topupProcessing.value = false
  }
}

const vipOpen = ref(false)
const vipProcessing = ref(false)
function openVip(){
  if (!auth.token) { router.push('/login'); return }
  vipOpen.value = true
}
async function onVipConfirm(payload: { tier: 'purple'|'crown'; months: number; usd: number; giftNickname?: string }) {
  if (vipProcessing.value) return
  const tier = payload.tier === 'crown' ? 'crown' : 'purple'
  const months = Math.max(1, Math.floor(Number(payload.months) || 0) || 1)
  const amount = Math.max(1, Math.floor(Number(payload.usd) || 0) || 1)
  const nickname = typeof payload.giftNickname === 'string' ? payload.giftNickname.trim() : ''
  try{
    vipProcessing.value = true
    // 默认在线支付；若余额充足，提示可用余额升级。取消则不下单。
    let method: 'online' | 'balance' = 'online'
    const myBalance = Number(me.value?.balance || balance.value || 0)
    if (myBalance >= amount) {
      const ok = window.confirm(t('settings.upgrade.useBalanceConfirm', { balance: myBalance.toFixed(2), amount }))
      if (!ok){ vipProcessing.value = false; return }
      method = 'balance'
    }
    await api.post('/api/orders/upgrade', { tier, months, amount, method, giftNickname: nickname || undefined })
    if (!nickname){
      await fetchMe()
      // 通知各页面刷新会员等级显示
      window.dispatchEvent(new CustomEvent('vip-updated'))
      alert(t('vip.alerts.activated'))
    }else{
      // 送礼成功也通知（若送给自己也能覆盖到）
      window.dispatchEvent(new CustomEvent('vip-updated'))
      alert(t('vip.alerts.giftSuccess', { name: nickname }))
    }
    vipOpen.value = false
  }catch(err){
    console.error(err)
    const msg = (err as any)?.response?.data?.error
    alert(msg ? String(msg) : t('settings.alerts.vipFailed'))
  }finally{
    vipProcessing.value = false
  }
}

// 点卡兑换弹窗控制（由储值弹窗触发）
const cardRedeemOpen = ref(false)
const cardRedeemFiles = ref<File[]>([])
function openCardRedeem() {
  if (!auth.token) { router.push('/login'); return }
  cardRedeemOpen.value = true
}

async function onCardRedeemConfirm(files: File[]) {
  if (!auth.token) { router.push('/login'); return }
  const selected = files?.length ? files : cardRedeemFiles.value
  if (!selected.length) {
    alert(t('cardRedeemModal.needImage'))
    return
  }
  try {
    const images = await Promise.all(
      selected.map(
        (file) =>
          new Promise<{ name: string; data: string }>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve({ name: file.name, data: reader.result })
              } else {
                reject(new Error('无法读取图片'))
              }
            }
            reader.onerror = () => reject(new Error('读取图片失败'))
            reader.readAsDataURL(file)
          })
      )
    )
    await api.post('/api/cards/redeem', {
      username: me.value?.nickname || (me.value as any)?.username || '',
      email: me.value?.email || '',
      gender: (me.value as any)?.gender || '',
      balance: Number(me.value?.balance ?? balance.value ?? 0),
      images
    })
    alert(t('cardRedeemModal.submittedSuccess'))
    // 不关闭弹窗，由子组件根据状态切换为“审核中”并保持预览
    cardRedeemFiles.value = []
  } catch (err) {
    console.error(err)
    const msg = (err as any)?.response?.data?.error
    alert(msg ? String(msg) : t('common.submitFailed'))
  }
}

// 已移除 continue 事件
</script>

<style scoped>
  /* 横向排布（简洁版）：将 header 作为单行弹性容器 */
  header{
    --nav-gap: 10px;
    --nav-font: clamp(15px, 1.2vw, 18px);
    /* 统一为指定模块缩小 5% */
    --nav-scale: 0.95;
    /* 间距缩放，按需在特定语言下收紧横向空间 */
    --nav-gap-scale: 1;
    /* 单一变量统一全栏与子区域间距，避免不一致 */
    --slot-gap: calc(var(--nav-gap) * var(--nav-gap-scale));
    display:flex;
    align-items:center;
    flex-wrap:nowrap;
    gap:var(--slot-gap);
    padding:0 18px;
  height:64px;
    box-sizing:border-box;
  }
  /* 菜单与操作按钮横向排布，并占据中间的自适应剩余宽度 */
  nav{
    display:flex;
    align-items:center;
    gap:var(--slot-gap);
    /* 让中部导航占据剩余空间，消除最右侧多余空白，同时保持模块间距一致 */
    flex:1 1 auto;
    min-width:0;
    white-space:nowrap;
  }
  /* 确保 nav 内部所有直接子项无外边距，间距仅由 gap 控制 */
  nav > *{ margin:0 !important; }
  /* 其余元素固定宽度、按顺序排列 */
  .brand, .search, .lang, .support, .user, .mobile-only{ flex:0 0 auto; }
  .support{ display:inline-flex; align-items:center; }
  
  /* 品牌区与其它模块保持同一水平间距 */
  .brand{ display:inline-flex; align-items:center; gap:var(--slot-gap); color:#fff; font-weight:900; letter-spacing:.45px; flex-shrink:0; white-space:nowrap; line-height:1; }
  /* 放大品牌图标与文字 20% */
  .brand-logo{ display:block; width:clamp(40px, 2.22vw, 44px); height:clamp(40px, 2.22vw, 44px); overflow:visible; transform:translateY(1px); }
  /* 文本轻微上抬，获得与图标的视觉中线对齐 */
  .brand-name{ position:relative; top:-0.5px; }
  /* 品牌文字放大 20% 于统一字号 */
  .brand-name{ font-size:calc(var(--nav-font) * 1.2); font-weight:900; letter-spacing:.6px; white-space:nowrap; }
  /* 搜索框右侧间距也统一为 --nav-gap */
  /* 允许在窄屏时适度收缩，避免与放大后的品牌区挤压 */
  .search{ position:relative; display:inline-flex; align-items:center; flex:0 1 auto; min-width:110px; height:40px; top:1px; /* 仅占位符再缩小 15% */ --placeholder-scale: 0.85; }
  /* 确保 header 直接子元素之间仅由 gap 控制间距，不受外边距影响 */
  header > *{ margin:0; }
  .search input{
    width: clamp(100px, 12vw, 170px); height: 40px; border:0; border-radius:999px; padding:0 48px 0 16px; background:#fff; color:#333; font-weight:600; font-size:calc(var(--nav-font) * var(--nav-scale)); box-sizing:border-box; line-height:40px;
  }
.search input::placeholder{ color:#bfbfbf; font-weight:600; font-size:calc(var(--nav-font) * var(--nav-scale) * var(--placeholder-scale)); }
.search .go{ position:absolute; right:6px; top:50%; transform:translateY(-50%); width:34px; height:34px; border-radius:50%; border:0; background:#fff; color:#999; display:grid; place-items:center; box-shadow:0 1px 2px rgba(0,0,0,.08); }
/* 搜索图标缩小 5% */
.search .go svg{ width: calc(16px * var(--nav-scale)); height: calc(16px * var(--nav-scale)); }

  /* 中间导航（选中下划线） */
  /* 使用统一 gap，顺序排布，避免被挤压或重叠 */
  .nav-item{ position:relative; padding:10px 10px; color:#fff; opacity:.95; line-height:1; white-space:nowrap; }
  .nav-item{ display:inline-flex; align-items:center; justify-content:center; gap:calc(var(--nav-gap) * var(--nav-gap-scale)); font-size:calc(var(--nav-font) * var(--nav-scale)); min-width:0; text-align:center; flex:0 0 auto; }
  /* 指定需要加粗的导航项（与 升级/储值 保持同字号，已使用同一变量） */
  .nav-item--primary{ font-weight:800; }
.nav-item .icon{ display:inline-flex; width:calc(clamp(26px, 1.9vw, 30px) * var(--nav-scale)); height:calc(clamp(26px, 1.9vw, 30px) * var(--nav-scale)); opacity:.98; }
.nav-item .icon svg{ width:100%; height:100%; display:block; }
.nav-item:hover{ opacity:1; }
.nav-item.active{ opacity:1; }
.nav-item .label{ position:relative; display:inline-flex; align-items:center; padding:1px 0; font-size:inherit; }
.nav-item .label::after{ content:""; position:absolute; left:0; right:0; bottom:-7px; height:2px; border-radius:2px; background:#fff; transform:scaleX(0); transform-origin:center; transition:transform .2s ease; }
.nav-item:hover .label::after{ transform:scaleX(.85); }
.nav-item.active .label::after{ transform:scaleX(1); }

/* 婚恋主题：图标在 hover/active 时使用品牌粉的高�?*/
.nav-item .icon{ color:#fff; }
.nav-item:hover .icon svg{ color: var(--brand-pink, #f17384); }
.nav-item.active .icon svg{ color: var(--brand-pink, #f17384); }

/* 右侧用户区：统一与全局间距一致 */
  .user{ position:relative; display:flex; align-items:center; gap:var(--slot-gap); flex-wrap:nowrap; }
.user.user--desktop{ display:inline-flex; }
.user .pill{ position:relative; top:1px; }
.avatar{ width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,.25); display:grid; place-items:center; font-size:14px; }
.name{ color:#fff; opacity:.95; font-weight:700; }
.avatar-btn{
  padding:0; margin:0; border:0; background:transparent; cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; border-radius:50%;
  /* 保证按钮自身不被压缩，给到头像足够空间 */
  flex:0 0 auto; min-width:40px; min-height:40px;
}
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
.pill{ height:40px; border-radius:999px; padding:0 14px; font-weight:700; font-size:var(--nav-font); border:1px solid rgba(255,255,255,.7); white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; line-height:1; box-sizing:border-box; overflow:hidden; }
.pill > *{ line-height:1; }
.pill svg{ display:block; }
.pill.ghost{ background:transparent; color:#fff; }
.pill.ghost:hover{ background:rgba(255,255,255,.12); }
.pill.solid{ background:#fff; }
/* 导航内的操作按钮（升级 / 储值）：缩小 5% 字号 */
.nav-pill{ height:44px; display:inline-flex; align-items:center; justify-content:center; margin:0; font-size:calc(var(--nav-font) * var(--nav-scale)); }
.nav .nav-pill{ flex:0 0 auto; }
.center-actions .nav-pill{ align-self:center; }
/* 语言按钮更紧�?*/
.lang > .pill{ padding:0 9px; align-items:center; }

/* 语言下拉 */
.lang{ position:relative; display:flex; align-items:center; }
.lang .sub{ margin-left:6px; opacity:.9; font-size:calc(var(--nav-font) * var(--nav-scale)); line-height:1; font-weight:600; }
.lang .caret{ width:calc(16px * var(--nav-scale)); height:calc(16px * var(--nav-scale)); margin-left:6px; opacity:.9; display:block; align-self:center; }
/* 语言按钮文字缩小 5% */
.lang > .pill{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.menu{ position:absolute; right:0; top:calc(100% + 8px); min-width:180px; background:#fff; color:#111; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.12); border:1px solid #e5e7eb; overflow:hidden; }
.menu-item{ width:100%; text-align:left; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; }
.menu-item:hover{ background:#f9fafb; }
  /* 客服文字与其他模块统一字号 */
  :deep(.cs-label){ font-size:calc(var(--nav-font) * var(--nav-scale)); }
  /* 客服图标缩小 5%（不改变整体按钮尺寸） */
  .support :deep(svg){ transform:scale(var(--nav-scale)); transform-origin:center; }

@media (max-width: 900px){
  .search input{ width: 180px; }
  .user--desktop{ display:none !important; }
  .mobile-only{ display:inline-flex; }
}
@media (max-width: 600px){
  .search{ display:none; }
}
/* 默认情况下隐�?mobile-only，只在小屏显�?*/
.mobile-only{ display:none; }
/* 在较窄屏幕隐�?(Language) 附加文案，节省空�?*/
@media (max-width: 1280px){
  .lang .sub{ display:none; }
}

/* 韩语下，为了保留“联系客服”文字，提前隐藏 (Language) 附文 */
@media (max-width: 1400px){
  .locale-ko .lang .sub{ display:none; }
}

/* 进一步压缩：为日文等长标签提前留出空�?*/
/* 更早开始逐级收紧，确保不挤压不重叠 */
@media (max-width: 1680px){ .pill{ height:44px; padding:0 12px; } .search input{ width: clamp(120px, 14vw, 180px); } }
@media (max-width: 1480px){ .brand-name{ font-size:calc(var(--nav-font) * 1.2); } .pill{ height:42px; padding:0 12px; } .lang > .pill{ padding:0 10px; } .search input{ width: clamp(115px, 13vw, 175px); } }
@media (max-width: 1366px){ .pill{ height:40px; padding:0 10px; } .lang > .pill{ padding:0 8px; } .search input{ width: clamp(110px, 16vw, 165px); } }
@media (max-width: 1280px){ .pill{ height:38px; padding:0 10px; } .search input{ width: clamp(100px, 14vw, 150px); } }
/* 1200 以下仍显示“联系客服”文本，除非再更小的断点（例如 900 以下） */
@media (max-width: 900px){
  /* 超小宽度：为了不挤压右侧区，仅在非常窄的屏幕隐藏文字，保留图标 */
  :deep(.cs-label){ display:none; }
}

/* �?1400px 以下也隐藏客服文字，避免�?英长文案拥挤 */
/* 保留 1400 宽度段的“联系客服”文本显示，不再强制隐藏 */

/* 取消英文强制显示客服文字，避免中等宽度拥挤；是否显示由断点统一控制 */

/* 在矮屏设备压缩导航高度与字号，留出更多竖向空�?*/
@media (max-height: 760px){
  .brand-name{ font-size:calc(var(--nav-font) * 1.2); }
  .pill{ height:38px; font-size:13px; }
  .search{ height:36px; }
  .search input{ height:36px; line-height:36px; }
  .lang .sub{ display:none; }
}

/* 日语模式：进一步紧凑，确保所有模块完整展示且不重叠 */
.locale-ja{ --nav-scale: 0.78; --nav-gap-scale: 0.58; }
/* 两侧内边距再收紧，释放水平空间 */
.locale-ja header{ padding:0 10px; }
/* 品牌区更紧凑 */
.locale-ja .brand-logo{ width:clamp(32px, 1.75vw, 36px); height:clamp(32px, 1.75vw, 36px); }
.locale-ja .brand-name{ font-size:calc(var(--nav-font) * 1.02); }
/* 搜索框更短，并缩小占位符与按钮 */
.locale-ja .search{ min-width:88px; }
.locale-ja .search input{ width: clamp(85px, 9vw, 140px); font-size:calc(var(--nav-font) * var(--nav-scale)); padding-right:40px; }
.locale-ja .search input::placeholder{ font-size:calc(var(--nav-font) * var(--nav-scale) * var(--placeholder-scale)); }
.locale-ja .search .go{ width:28px; height:28px; right:4px; }
/* 导航项与操作按钮收紧内边距，统一间距来自 gap 变量 */
.locale-ja .nav-item{ padding:5px 5px; font-size:calc(var(--nav-font) * var(--nav-scale)); }
/* 图标尺寸再略降，直接影响占位宽度 */
.locale-ja .nav-item .icon{ width:calc(clamp(24px, 1.7vw, 28px) * var(--nav-scale)); height:calc(clamp(24px, 1.7vw, 28px) * var(--nav-scale)); }
.locale-ja .menu-spread{ gap:5px; }
/* Pill 按钮整体收窄 */
.locale-ja .pill{ height:32px; font-size:var(--nav-font); padding:0 8px; }
/* 仅针对“升级/储值”按钮进一步缩小文字，避免被裁剪，且不影响其它模块 */
.locale-ja .nav-pill{
  font-size:calc(var(--nav-font) * 0.64);
  padding:0 7px;
  white-space:nowrap;
  letter-spacing:-0.2px;
}
/* 语言按钮与附文案缩小并隐藏副文 */
.locale-ja .lang > .pill{ padding:0 7px; font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-ja .lang .sub{ display:none !important; font-size:calc(var(--nav-font) * var(--nav-scale)); }
/* 头像按钮缩小占位，避免右侧拥挤 */
.locale-ja .avatar-btn{ min-width:34px; min-height:34px; }

/* 韩语：文案中等偏长，略微比默认更紧凑 */
.locale-ko .brand-name{ font-size:calc(var(--nav-font) * 1.14); }
/* 韩语文案相对更长：收紧搜索框宽度与按钮尺寸，避免右侧操作被裁剪 */
.locale-ko{ --nav-scale: 0.86; --nav-gap-scale: 0.86; }
.locale-ko .search{ min-width:110px; }
.locale-ko .search input{ width: clamp(110px, 12vw, 180px); font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-ko .menu-spread{ gap:5px; }
.locale-ko .center-actions{ gap:6px; }
.locale-ko .nav-item{ font-size:calc(var(--nav-font) * var(--nav-scale)); padding:6px 6px; }
.locale-ko .pill{ padding:0 9px; font-size:var(--nav-font); height:40px; }
.locale-ko .center-actions .nav-pill{ padding:0 8px; height:40px; font-weight:800; }
/* 关键：进一步缩小“升级/储值”按钮文字并收紧左右间距，避免韩语被截断 */
.locale-ko .nav-pill{ font-size:calc(var(--nav-font) * 0.84); padding:0 8px; letter-spacing:-0.2px; }
.locale-ko .lang > .pill{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-ko .lang .sub{ font-size:calc(var(--nav-font) * var(--nav-scale)); }

/* 繁体中文：文字略宽，适度压缩 */
.locale-zh-TW .search{ min-width:130px; }
.locale-zh-TW .search input{ width: clamp(130px, 13vw, 200px); font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-TW .nav-item{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-TW .pill{ padding:0 12px; height:42px; }
.locale-zh-TW .nav-pill{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-TW .lang > .pill{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-TW .lang .sub{ font-size:calc(var(--nav-font) * var(--nav-scale)); }

/* 简体中文：默认即可，保留微调钩�?*/
.locale-zh-CN .search input{ width: clamp(130px, 14vw, 190px); font-size:calc(var(--nav-font) * var(--nav-scale)); }

/* 英文：文字普遍更长，进一步缩小字号、图标与间距，确保“Upgrade/Top up”完整显示且不重叠 */
.locale-en{ --nav-scale: 0.8; --nav-gap-scale: 0.7; }
.locale-en header{ padding:0 12px; }
.locale-en .brand-logo{ width:clamp(34px, 1.9vw, 38px); height:clamp(34px, 1.9vw, 38px); }
.locale-en .brand-name{ font-size:calc(var(--nav-font) * 1.08); }
.locale-en .lang .sub{ display:none; }
.locale-en :deep(.cs-label){ display:inline-block; font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-en .search input{ width: clamp(95px, 10vw, 150px); }
.locale-en .nav-item{ padding:6px 6px; }
.locale-en .lang > .pill{ padding:0 6px; }
/* 防止英文环境下“Upgrade/Top up”文本被挤压截断：进一步减小字号并略收紧左右内边距 */
.locale-en .nav-pill{ font-size:calc(var(--nav-font) * var(--nav-scale)); padding:0 6px; }
/* 头像按钮缩小占位，给右侧更多空间 */
.locale-en .avatar-btn{ min-width:36px; min-height:36px; }

/* 简体中文：整体略紧凑仍保持可读 */
.locale-zh-CN .brand-name{ font-size:calc(var(--nav-font) * 1.2); }
.locale-zh-CN .menu-spread{ gap:var(--nav-gap); }
.locale-zh-CN .nav-item{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-CN .pill{ height:38px; padding:0 12px; font-size:var(--nav-font); }
.locale-zh-CN .nav-pill{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-CN .search input::placeholder{ font-size:calc(var(--nav-font) * var(--nav-scale) * var(--placeholder-scale)); }

/* 繁体中文：适度压缩避免换行 */
.locale-zh-TW .brand-name{ font-size:calc(var(--nav-font) * 1.2); }
.locale-zh-TW .menu-spread{ gap:var(--nav-gap); }
.locale-zh-TW .nav-item{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-TW .pill{ height:38px; padding:0 12px; font-size:var(--nav-font); }
.locale-zh-TW .nav-pill{ font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-TW .search input{ width: clamp(130px, 15vw, 200px); font-size:calc(var(--nav-font) * var(--nav-scale)); }
.locale-zh-TW .search input::placeholder{ font-size:calc(var(--nav-font) * var(--nav-scale) * var(--placeholder-scale)); }

/* 登录/注册页：仅隐藏搜索以简化 */
.auth-page .search{ display:none !important; }
/* 登录/注册页：动作区域整体右对齐 */
.auth-actions{ display:flex; align-items:center; gap:var(--slot-gap); }
.auth-page .auth-actions{ margin-left:auto; }
</style>




