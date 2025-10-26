<template>
  <div class="home">
    <div class="carousel container compact-home">
      <!-- 舞台区：堆叠/错位卡片 + 内置左右切换按钮 -->
      <div
        class="stage"
        @touchstart.passive="onTouchStart"
        @touchmove.passive="onTouchMove"
        @touchend.passive="onTouchEnd"
      >
        <!-- 左侧切换按钮（覆盖在图片左侧） -->
        <button
          class="arrow-overlay left"
          type="button"
          @click="prev"
          :disabled="slidesReal.length < 2"
          aria-label="prev"
        >
          <svg viewBox="0 0 72 72" aria-hidden="true">
            <polyline points="48,16 28,36 48,56" fill="none" />
            <polyline points="34,16 14,36 34,56" fill="none" />
          </svg>
        </button>

        <div
          v-for="c in visibleCards"
          :key="c.id + '-' + c.rel"
          class="card"
          :class="[ { center: c.rel === 0, portrait: portraitMap[c.id] }, relClass(c.rel) ]"
          :style="cardStyle(c.rel)"
          @click="goProfile(c.id)"
          role="button"
          :aria-label="t('chat.withUser', { user: c.nickname })"
        >
          <img
            class="photo"
            :src="c.img"
            :alt="c.nickname"
            loading="lazy"
            @load="onImgLoad(c.id, $event)"
          />
          <div class="meta">
            <span class="dot" :class="presence.isOnline(c.id) ? 'on' : ''"></span>
            <span class="name" :class="{ on: presence.isOnline(c.id) }">{{ c.nickname }}</span>
            <span class="age" v-if="c.age !== null">{{ c.age }}{{ ageUnit }}</span>
          </div>
        </div>

        <!-- 右侧切换按钮（覆盖在图片右侧） -->
        <button
          class="arrow-overlay right"
          type="button"
          @click="next"
          :disabled="slidesReal.length < 2"
          aria-label="next"
        >
          <svg viewBox="0 0 72 72" aria-hidden="true">
            <polyline points="24,16 44,36 24,56" fill="none" />
            <polyline points="38,16 58,36 38,56" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { getSocket } from '../socket';
import { usePresence } from '../presence';
import { useAuth } from '../stores';

interface UserPublic { id: string; nickname: string; gender: 'male'|'female'|'other'; birthday?: string; avatarUrl?: string|null }

const users = ref<UserPublic[]>([]);
const loadError = ref<string | null>(null);
const presence = usePresence();
const auth = useAuth();
const { t, locale } = useI18n();

function getAge(b?: string): number | null {
  if (!b) return null;
  const d = new Date(b);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

const ageUnit = computed(() => {
  const l = String(locale.value || '').toLowerCase();
  return l.startsWith('zh') ? t('home.age.yearsCn') : t('home.age.yearsEn');
});

// 构造图片源（占位图，使用用户ID作为 seed 保持稳定）
const fallbackFemale = '/avatars/IMG_0819.PNG'
const fallbackMale = '/avatars/IMG_0820.PNG'
const fallbackGeneric = 'https://placehold.co/640x640/png'
const slides = computed(() => users.value.map(u => {
  const fallback = u.gender === 'female' ? fallbackFemale : (u.gender === 'male' ? fallbackMale : fallbackGeneric)
  return {
    id: u.id,
    nickname: u.nickname,
    gender: u.gender,
    age: getAge(u.birthday),
    img: u.avatarUrl || fallback
  }
}));

// 当后端不可用或暂无用户时，提供稳定的本地回退卡片，避免“空舞台”
const demoSlides = computed(() => {
  return [
    { id: 'demo-1', nickname: t('home.demoUser1') || '小美', gender: 'female', age: 22, img: fallbackFemale },
    { id: 'demo-2', nickname: t('home.demoUser2') || '小杰', gender: 'male', age: 24, img: fallbackMale },
    { id: 'demo-3', nickname: t('home.demoUser3') || '可可', gender: 'female', age: 21, img: fallbackFemale },
    { id: 'demo-4', nickname: t('home.demoUser4') || '阿峰', gender: 'male', age: 23, img: fallbackMale },
    { id: 'demo-5', nickname: t('home.demoUser5') || '悠然', gender: 'other', age: null, img: '/backgrounds/chat-bg.jpg' },
  ] as Array<{ id:string; nickname:string; gender:any; age:number|null; img:string }>
})

const slidesReal = computed(() => slides.value.length > 0 ? slides.value : demoSlides.value)

const center = ref(0);
// 标记纵向照片（高>宽*1.08）以便上移视觉焦点
const portraitMap = ref<Record<string, boolean>>({});
function onImgLoad(id: string, e: Event){
  const img = e.target as HTMLImageElement;
  const isPortrait = img.naturalHeight > img.naturalWidth * 1.08;
  portraitMap.value = { ...portraitMap.value, [id]: isPortrait };
}
const offsetsBase = [-2, -1, 0, 1, 2];
const visibleCards = computed(() => {
  const n = slidesReal.value.length;
  if (n === 0) return [] as Array<any>;
  const useOffsets = n >= 5 ? offsetsBase : Array.from({length: Math.min(n, 5)}, (_, i) => i - Math.floor((Math.min(n,5)-1)/2));
  return useOffsets.map(off => {
    const idx = ((center.value + off) % n + n) % n;
    return { ...slidesReal.value[idx], rel: off };
  });
});

function next(){
  const n = slidesReal.value.length; if (!n) return; center.value = (center.value + 1) % n;
}
function prev(){
  const n = slidesReal.value.length; if (!n) return; center.value = (center.value - 1 + n) % n;
}

// 邻近卡片的边缘遮罩类（用于 ::before 渐变）
function relClass(rel: number){
  if (rel === -1) return 'edge-right';
  if (rel === 1) return 'edge-left';
  if (rel === -2) return 'edge-right strong';
  if (rel === 2) return 'edge-left strong';
  return '';
}

function cardStyle(rel: number){
  // 统一高度与底边对齐（y=0，s=1）；拉大横向间距强化分隔
  const mapping: Record<number, {x:number, r:number, z:number, o:number}> = {
    [-2]: { x: -420, r: 0, z: 1, o: 0.80 },
    [-1]: { x: -240, r: 0, z: 2, o: 0.92 },
    [0]:  { x: 0,    r: 0, z: 3, o: 1.00 },
    [1]:  { x: 240,  r: 0, z: 2, o: 0.92 },
    [2]:  { x: 420,  r: 0, z: 1, o: 0.80 },
  };
  const m = mapping[rel] || mapping[0];
  return {
    transform: `translate(${m.x}px, 0) rotate(${m.r}deg) scale(1)`,
    zIndex: String(m.z),
    opacity: String(m.o),
  } as any;
}

function goProfile(uid: string){
  // 进入用户资料页
  window.location.hash = `#/profile/${uid}`;
}

// 触摸滑动手势
const touchX = ref<number | null>(null);
const touchY = ref<number | null>(null);
const swiping = ref(false);
function onTouchStart(e: TouchEvent){
  const t = e.touches[0];
  touchX.value = t.clientX; touchY.value = t.clientY; swiping.value = false;
}
function onTouchMove(e: TouchEvent){
  if (touchX.value == null || touchY.value == null) return;
  const t = e.touches[0];
  const dx = t.clientX - touchX.value; const dy = t.clientY - touchY.value;
  if (!swiping.value && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2){
    swiping.value = true;
  }
}
function onTouchEnd(e: TouchEvent){
  if (!swiping.value || touchX.value == null) { touchX.value = touchY.value = null; swiping.value = false; return; }
  const t = e.changedTouches[0];
  const dx = t.clientX - (touchX.value || 0);
  if (dx < -24) next(); else if (dx > 24) prev();
  touchX.value = touchY.value = null; swiping.value = false;
}

onMounted(async () => {
  try {
    // 简易 60s 缓存，减少首页反复进入产生的请求与抖动
    const cacheKey = 'users.cache.v1'
    const cacheTsKey = 'users.cache.ts'
    const now = Date.now()
    const ts = Number(localStorage.getItem(cacheTsKey) || 0)
    const cached = localStorage.getItem(cacheKey)
    if (cached && now - ts < 60_000) {
      try { users.value = JSON.parse(cached) } catch {}
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 6000);
    const { data } = await api.get('/api/users', { signal: ctrl.signal });
    window.clearTimeout(timer);
    users.value = Array.isArray(data) ? data : [];
    // 写入缓存
    try { localStorage.setItem(cacheKey, JSON.stringify(users.value)); localStorage.setItem(cacheTsKey, String(Date.now())) } catch {}
  } catch (err: any) {
    // 重试一次（快速超时），避免偶发网络抖动
    try {
      const ctrl2 = new AbortController();
      const timer2 = window.setTimeout(() => ctrl2.abort(), 3000);
      const { data } = await api.get('/api/users', { signal: ctrl2.signal });
      window.clearTimeout(timer2);
      users.value = Array.isArray(data) ? data : [];
      try { localStorage.setItem('users.cache.v1', JSON.stringify(users.value)); localStorage.setItem('users.cache.ts', String(Date.now())) } catch {}
    } catch (err2: any) {
      console.error('[Home] /api/users failed', err2?.message || err2);
      loadError.value = err2?.message || t('home.loadError');
    }
  }
  if (auth.token) {
    const s = getSocket();
    s.on('presence', (e: { uid: string; online: boolean }) => presence.setOnline(e.uid, e.online));
  }
});
</script>

<style scoped>
.home{ background:#fff; min-height: calc(100vh - 64px); }
.container{ max-width: 1200px; margin: 0 auto; padding: 24px 16px; }



.carousel{ position: relative; display:flex; align-items:center; justify-content:space-between; gap:16px; margin-top: 28px; }

/* 舞台内覆盖的左右切换按钮 */
.arrow-overlay{
  position:absolute; top:50%; transform: translateY(-50%);
  display:flex; align-items:center; justify-content:center;
  width:96px; height:96px; border-radius:12px;
  background: transparent; border: none;
  cursor:pointer; user-select:none;
  z-index:5;
}
.arrow-overlay svg{ width: 72px; height: 72px; stroke: #12cdbf; stroke-width: 8px; stroke-linecap: round; stroke-linejoin: round; }
.arrow-overlay:hover svg{ filter: brightness(1.08); }
.arrow-overlay:active svg{ transform: scale(0.96); }
.arrow-overlay.left{ left: 6%; }
.arrow-overlay.right{ right: 6%; }
.arrow-overlay:hover{ filter: brightness(1.03); }
.arrow-overlay:active{ transform: translateY(-50%) scale(0.98); }
.arrow-overlay:disabled{ opacity:.35; cursor:not-allowed; }

  .stage{ position: relative; flex:1; height: min(500px, 56vh); margin: 16px 0; }
.card{
  position: absolute; top:0; left:50%; transform-origin:center bottom;
  width: clamp(240px, 28vw, 360px); height: clamp(240px, 28vw, 360px); margin-left: calc(clamp(240px, 28vw, 360px) / -2);
  border-radius: 16px; overflow: visible; transition: transform .35s ease, opacity .35s ease; cursor:pointer;
}
.card::before{
  content:""; position:absolute; top:0; bottom:0; width: 96px; pointer-events:none; z-index:2;
  opacity: 0; transition: opacity .3s ease;
}
.card.edge-left::before{ right:-2px; background: linear-gradient(90deg, rgba(255,255,255,0.88), rgba(255,255,255,0)); opacity:.85; }
.card.edge-right::before{ left:-2px; background: linear-gradient(-90deg, rgba(255,255,255,0.88), rgba(255,255,255,0)); opacity:.85; }
.card.strong.edge-left::before, .card.strong.edge-right::before{ opacity: 1; }
.card.center .photo{ box-shadow: 0 18px 42px rgba(0,0,0,.24); }
.card.center{ filter: brightness(1.04); }
.photo{ width:100%; height:100%; object-fit: cover; object-position: center center; border-radius:18px; box-shadow: 0 10px 24px rgba(0,0,0,.16); border:1px solid rgba(0,0,0,0.06); }
.card.portrait .photo{ object-position: center 32%; }
.card::after{
  content:""; position:absolute; left:10%; right:10%; bottom:-14px; height:26px;
  background: radial-gradient(ellipse at center, rgba(0,0,0,.20) 0%, rgba(0,0,0,0) 70%);
  filter: blur(4px); z-index:0; pointer-events:none;
}
.meta{ display:flex; align-items:center; gap:10px; justify-content:center; margin-top:16px; font-weight:600; color:#e67a88; }
.dot{ width:10px; height:10px; border-radius:50%; background:#bdbdbd; display:inline-block; }
.dot.on{ background:#28d847; }
.name{ white-space:nowrap; max-width: 60%; overflow:hidden; text-overflow: ellipsis; }
.name.on{ color:#28d847; }
.age{ color:#e67a88; margin-left:6px; }

.card:not(.center) .meta{ opacity:.75; }
  .card.center .meta{ font-size: clamp(14px, .8vw + .6vh, 16px); filter: brightness(1.06); }

@media (max-width: 1024px){
  .stage{ height: min(460px, 54vh); }
  .card{ width: clamp(220px, 32vw, 320px); height: clamp(220px, 32vw, 320px); margin-left: calc(clamp(220px, 32vw, 320px) / -2); border-radius:16px; }
  .arrow-overlay{ width:84px; height:84px; }
  .arrow-overlay svg{ width: 62px; height: 62px; }
}
@media (max-width: 768px){
  .stage{ height: min(420px, 52vh); }
  .card{ width: clamp(200px, 38vw, 280px); height: clamp(200px, 38vw, 280px); margin-left: calc(clamp(200px, 38vw, 280px) / -2); border-radius:14px; }
  .arrow-overlay{ width:72px; height:72px; }
  .arrow-overlay svg{ width: 56px; height: 56px; }
}
@media (max-width: 420px){
  .arrow-overlay{ width:64px; height:64px; }
  .arrow-overlay svg{ width: 48px; height: 48px; }
  .stage{ height: min(380px, 50vh); }
  .card{ width: clamp(180px, 60vw, 240px); height: clamp(180px, 60vw, 240px); margin-left: calc(clamp(180px, 60vw, 240px) / -2); border-radius:12px; }
}

/* 在矮屏设备（<=760px 高）收紧整体间距和箭头尺寸，力争一屏展示 */
@media (max-height: 760px){
  .compact-home{ padding-top: 12px; padding-bottom: 12px; }
  .arrow-overlay{ width:68px; height:68px; }
  .arrow-overlay svg{ width: 46px; height: 46px; }
}
</style>
