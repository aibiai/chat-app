<template>
  <div class="container mx-auto px-3 py-3 lucky-page">
    <div class="grid grid-cols-12 gap-4">
  <!-- ���У�������չʾ -->
      <section class="col-span-12 lg:col-span-9">
        <div class="hero-stage" ref="stageRef">
          <div class="hero-orb" aria-hidden="true">
            <span class="hero-orb__value">{{ luckPercentLabel }}</span>
          </div>
          <div class="hero-star-field" aria-hidden="true">
            <span
              v-for="star in starLayout"
              :key="star.id"
              class="hero-star"
              :class="star.size"
              :style="{
                top: star.top,
                left: star.left,
                transform: `translate(-50%, -50%) rotate(${star.rotate || 0}deg)`
              }"
            ></span>
          </div>
          <div class="hero-stage-content">
            <div class="stage-left">
              <div class="hero-header">
                <div class="hero-emblem" aria-label="avatar">
                  <AvatarImg :src="avatarSrc" :gender="user?.gender" :size="56" class="hero-avatar" />
                </div>
                <div class="hero-banner">
                  <div class="banner-name-row">
                    <span class="banner-name">{{ displayName }}</span>
                    <span v-if="genderLabel" class="banner-meta">{{ genderLabel }}</span>
                    <span v-if="ageLabel" class="banner-meta">{{ ageLabel }}</span>
                  </div>
                  <div class="banner-tier">{{ membershipLabel }}</div>
                </div>
              </div>
              <div class="hero-body">
                <div class="hero-figure">
                  <div class="figure-glow"></div>
                  <!-- ê�㣺���ڽ�������̨����뵽��������̨���ļ������� -->
                  <div class="figure-anchor">
                    <img :src="characterUrl" alt="lucky star avatar" loading="lazy" />
                    <div class="figure-stage"></div>
                  </div>
                  <!-- �Ҳ�װ��ͼƬ���������Ҳౣ��Э������ -->
                  <div class="figure-decoration" aria-hidden="true">
                    <img :src="rightDecorUrl" alt="" loading="lazy" decoding="async" />
                  </div>
                </div>
                <div class="hero-copy">
                  <div class="hero-tags" v-if="heroTags.length">
                    <span v-for="tag in heroTags" :key="tag" class="tag">{{ tag }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

  <!-- ���У������� + ��Ա������Ȩ��������ҳ�Ҳ�һ�£� -->
      <aside class="col-span-12 lg:col-span-3 side-panel" ref="sideRef">
        <div class="side-panel-orb" aria-hidden="true"></div>
        <div class="card gift">
          <div class="gift-head">
            <span class="ico">🎁</span>
            <h3>{{ t('chat.side.gift.title') }}</h3>
          </div>
          <p class="gift-tip">{{ t('chat.side.gift.desc') }}</p>
          <button type="button" class="btn-gift" @click="goGifts">{{ t('chat.side.gift.cta') }}</button>
        </div>

        <div class="card vip2">
          <div class="vip2-head">
            <h3>{{ t('chat.side.vip.title') }}</h3>
          </div>
          <ul class="privs2">
            <li>
              <span class="i">👑</span>
              <div>
                <div class="k">{{ t('chat.side.vip.benefit1') }}</div>
              </div>
            </li>
            <li>
              <span class="i">👀</span>
              <div>
                <div class="k">{{ t('chat.side.vip.benefit2') }}</div>
              </div>
            </li>
            <li>
              <span class="i">✉️</span>
              <div>
                <div class="k">{{ t('chat.side.vip.benefit3') }}</div>
              </div>
            </li>
            <li>
              <span class="i">💗</span>
              <div>
                <div class="k">{{ t('chat.side.vip.benefit4') }}</div>
              </div>
            </li>
          </ul>
          <button class="btn-vip" @click="openVipNow">{{ t('chat.side.vip.cta') }}</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import AvatarImg from '../components/AvatarImg.vue'

type Gender = 'male' | 'female' | 'other'
type ProfileDraft = Partial<{
  nickname: string
  birthday: string
  zodiac: string
  education: string
  maritalStatus: 'single' | 'married' | 'other'
  height: number
  weight: number
  weightRange: [number, number]
  membershipLabel: string
  membershipTier: string
  vipLevel: string
  luckyCharacterUrl: string
  heroImageUrl: string
}>

type Me = {
  id: string
  nickname?: string
  gender?: Gender
  avatarUrl?: string | null
  birthday?: string
  zodiac?: string
  education?: string
  maritalStatus?: 'single' | 'married' | 'other'
  height?: number
  weight?: number
  weightRange?: [number, number]
  bio?: string
  profileDraft?: ProfileDraft
  membershipLabel?: string
  membershipTier?: string
  vipLevel?: string
  luckyCharacterUrl?: string
  heroImageUrl?: string
} & Record<string, unknown>

const route = useRoute()
const router = useRouter()
const user = ref<Me | null>(null)
const { t } = useI18n()
const placeholder = '--'
const defaultHero = '/avatars/lucky-hero.gif'
// �Ҳ�װ��ͼ�������� public/decorations �£�Vite ���Ը�·���ṩ��
const defaultRightDecor = '/decorations/lucky-right-board.jpg'
const DEFAULT_LUCK_SCORE = 100
const MAX_STARS = 10
const starPositions = [
  { id: 'row1-col1', size: 'lg', top: '24%', left: '67%' },
  { id: 'row2-col1', size: 'md', top: '40%', left: '57%' },
  { id: 'row2-col2', size: 'md', top: '40%', left: '67%' },
  { id: 'row2-col3', size: 'md', top: '40%', left: '77%' },
  { id: 'row3-col1', size: 'md', top: '56%', left: '57%' },
  { id: 'row3-col2', size: 'md', top: '56%', left: '67%' },
  { id: 'row3-col3', size: 'md', top: '56%', left: '77%' },
  { id: 'row4-col1', size: 'md', top: '72%', left: '57%' },
  { id: 'row4-col2', size: 'md', top: '72%', left: '67%' },
  { id: 'row4-col3', size: 'md', top: '72%', left: '77%' },
] as const

const luckScore = ref<number>(DEFAULT_LUCK_SCORE)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const normalizedLuck = computed(() => clamp(Number(luckScore.value) || 0, 0, 100))
const starCount = computed(() => clamp(Math.round(normalizedLuck.value / 10), 0, MAX_STARS))
const starLayout = computed(() => starPositions.slice(0, starCount.value))
const luckPercentLabel = computed(() => `${Math.round(normalizedLuck.value)}%`)

const pick = <K extends keyof NonNullable<Me['profileDraft']> & keyof Me>(k: K) => {
  const u = user.value as any
  return u?.profileDraft && u.profileDraft[k] != null ? u.profileDraft[k] : u?.[k]
}


const displayName = computed(() => user.value?.nickname || t('common.unnamed'))

const genderLabel = computed(() => {
  const g = user.value?.gender
  if (g === 'male') return String.fromCharCode(0x7537)
  if (g === 'female') return String.fromCharCode(0x5973)
  if (g === 'other') return String.fromCharCode(0x4FDD, 0x5BC6)
  return ''
})

const ageLabel = computed(() => {
  const birth = pick('birthday') as string | undefined;
  if (!birth) return '';
  try {
    const now = new Date();
    const dob = new Date(birth);
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    if (Number.isNaN(age) || age < 0) return '';
    return String(age) + '��';
  } catch {
    return '';
  }
});

const maritalText = computed(() => {
  const st = pick('maritalStatus') as Me['maritalStatus'] | undefined;
  if (st === 'married') return t('onboarding.maritalOptions.married');
  if (st === 'single') return t('onboarding.maritalOptions.single');
  if (st === 'other') return t('onboarding.maritalOptions.other');
  return placeholder;
});

const heightText = computed(() => {
  const h = pick('height') as number | undefined;
  return h != null ? String(h) + ' cm' : placeholder;
});

const weightText = computed(() => {
  const wr = pick('weightRange') as [number, number] | undefined;
  if (wr && Array.isArray(wr) && wr.length === 2) return String(wr[0]) + '-' + String(wr[1]) + ' kg';
  const w = pick('weight') as number | undefined;
  return w != null ? String(w) + ' kg' : placeholder;
});

const zodiacText = computed(() => {
  const z = pick('zodiac') as string | undefined;
  return z ? t('onboarding.zodiacOptions.' + z) : placeholder;
});

const educationText = computed(() => {
  const e = pick('education') as string | undefined;
  return e ? t('onboarding.educationOptions.' + e) : placeholder;
});

const heroTags = computed(() => {
  const tags = [
    zodiacText.value,
    educationText.value,
    heightText.value,
    weightText.value,
    maritalText.value,
  ].filter((tag) => tag && tag !== placeholder)
  return tags.slice(0, 4)
})

const membershipLabel = computed(() => {
  const u = user.value as any
  return (
    u?.membershipLabel ||
    u?.membershipTier ||
    u?.vipLevel ||
    u?.profileDraft?.membershipLabel ||
    u?.profileDraft?.membershipTier ||
    String.fromCharCode(0x666E, 0x901A, 0x4F1A, 0x5458)
  )
})

const characterUrl = computed(() => {
  const u = user.value as any
  return (
    u?.luckyCharacterUrl ||
    u?.heroImageUrl ||
    u?.profileDraft?.luckyCharacterUrl ||
    u?.profileDraft?.heroImageUrl ||
    defaultHero
  )
})

// ͷ�����Ҳ�װ��
const avatarSrc = computed(() => (user.value?.avatarUrl || null))
const rightDecorUrl = computed(() => defaultRightDecor)

function applyLuckScore(raw: unknown) {
  // TODO: connect to backend-provided lucky score when available.
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return
  luckScore.value = clamp(numeric, 0, 100)
}

// �������Ϸ����� avatarSrc / rightDecorUrl��

async function loadMe() {
  try {
    const { data } = await api.get('/api/users/me')
    user.value = data || null
    applyLuckScore((data as any)?.luckScore ?? data?.profileDraft?.luckScore)
  } catch {
    user.value = null
    luckScore.value = DEFAULT_LUCK_SCORE
  }
}

function openVipNow() {
  const fn = (window as any).__openVipModal
  if (typeof fn === 'function') fn()
  else router.push('/settings')
}

function goGifts() {
  const to = (route.query.to as string) || ''
  if (to) router.push('/gifts?to=' + encodeURIComponent(to))
  else router.push('/gifts')
}

onMounted(loadMe)

// �����и߶Ⱦ�ȷ���룺���������̨�߶ȣ�ʵʱ�����Ҳ������ min-height
const stageRef = ref<HTMLElement | null>(null)
const sideRef = ref<HTMLElement | null>(null)

function syncSideHeight() {
  const h = stageRef.value?.getBoundingClientRect().height || 0
  if (sideRef.value && h > 0) {
    const px = Math.ceil(h) + 'px'
    sideRef.value.style.minHeight = px
    sideRef.value.style.height = px
  }
}

let stageRO: ResizeObserver | null = null
onMounted(() => {
  // ����ͬ��������ͼƬ����ǰ��ı仯��
  const schedule = () => {
    syncSideHeight()
    // ���ж���첽����������ͼƬ�ӳټ��ء�������صȳ���
    setTimeout(syncSideHeight, 100)
    setTimeout(syncSideHeight, 300)
    setTimeout(syncSideHeight, 800)
    requestAnimationFrame(() => syncSideHeight())
  }
  schedule()
  // �۲���̨�ߴ�仯
  if ('ResizeObserver' in window && stageRef.value) {
    stageRO = new ResizeObserver(() => syncSideHeight())
    stageRO.observe(stageRef.value)
  }
  // ������̨��ͼƬ����
  const imgs = stageRef.value?.querySelectorAll('img') || []
  imgs.forEach(img => {
    if (!(img as HTMLImageElement).complete) {
      img.addEventListener('load', syncSideHeight, { once: true })
      img.addEventListener('error', syncSideHeight, { once: true })
    }
  })
  window.addEventListener('resize', syncSideHeight)
})

onUnmounted(() => {
  if (stageRO) stageRO.disconnect()
  window.removeEventListener('resize', syncSideHeight)
})
</script>

<style scoped>
.lucky-page {
  /* 让页面本身至少铺满除导航外的可视高度，并移除多余底部内边距，避免与底部说明栏之间留白 */
  min-height: calc(100dvh - 72px);
  padding-bottom: 0 !important;
  font-size: 14px;
}

.hero-stage {
  position: relative;
  overflow: hidden;
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.25), rgba(255, 230, 240, 0.31)),
    url('/backgrounds/lucky-stage.jpg') center/cover no-repeat;
  padding: 28px 30px 34px;
  box-shadow: 0 18px 46px rgba(245, 120, 140, 0.2);
  /* 提高最小高度，使舞台区域下沿尽量贴近页面底部（考虑移动端地址栏，采用 100dvh�?*/
  min-height: calc(100dvh - 96px);
  display: flex;
  flex-direction: column;
  /* 舞台中心位置（相对于 hero-stage 的宽度百分比）；再右�?2% �?44% */
  --figure-center: 46%;
  /* 人物整体纵向位移：正值向下。再下移 2% �?31% */
  --figure-shift-y: 31%;
  /* 人物整体缩放（含台面），1 �?100%�?.3 表示放大 30% */
  --figure-scale: 1.3;
  /* �Ҳ�װ��λ����ߴ磨����Ĭ��ֵ���ɱ���Ӧʽ���ǣ� */
  --decor-shift-x: 34%;
  --decor-top: 12%;
  --decor-width: clamp(220px, 26vw, 340px);
  /* λ�������ţ��ɰ���΢���� */
  --decor-translate-x: 23%;
  --decor-translate-y: 23%;
  --decor-scale: 1.452;
}

.hero-stage::before,
.hero-stage::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.hero-stage::before {
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.7), rgba(255, 192, 203, 0));
  top: -60px;
  right: 20px;
}

.hero-stage::after {
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255, 155, 188, 0.4), rgba(255, 155, 188, 0));
  bottom: -100px;
  left: -40px;
}

.hero-star-field {
  position: absolute;
  inset: 14% 8% 18% 24%;
  pointer-events: none;
  z-index: 3;
}

.hero-orb{
  position:absolute;
  top: 34%;
  left: 64%;
  width: clamp(51.4425px, 6.8595vw, 77.16375px);
  aspect-ratio:1/1;
  transform: translate(-50%, -50%) rotate(0deg);
  background: url('/decorations/water-orb.png') center/contain no-repeat;
  opacity: 0.92;
  filter: drop-shadow(0 28px 48px rgba(116, 73, 255, 0.35)) blur(0.6px);
  pointer-events: none;
  z-index: 4;
}

.hero-orb__value{
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -40%);
  font-weight: 800;
  font-size: clamp(13.5375px, 1.8862vw, 20.577px);
  color: #3b0764;
  text-shadow: 0 2px 6px rgba(255,255,255,0.8);
  pointer-events: none;
}

.hero-star {
  position: absolute;
  width: clamp(24px, 3.3vw, 39px);
  aspect-ratio: 1;
  clip-path: polygon(50% 3%, 61% 35%, 98% 35%, 68% 57%, 79% 93%, 50% 72%, 21% 93%, 32% 57%, 2% 35%, 39% 35%);
  background: linear-gradient(150deg, #fffbe8 0%, #ffe96a 28%, #ffd836 60%, #f1bb12 100%);
  border: 1px solid rgba(235, 186, 0, 0.68);
  box-shadow:
    inset 0 4px 8px rgba(255, 255, 255, 0.82),
    inset 0 -8px 14px rgba(215, 160, 0, 0.42),
    0 8px 20px rgba(255, 206, 64, 0.34);
  filter: drop-shadow(0 10px 24px rgba(255, 210, 0, 0.4));
  opacity: 1;
  transform-origin: center;
  animation: starTwinkle 6.4s ease-in-out infinite;
}
.hero-star::before {
  content: '';
  position: absolute;
  inset: 10% 16% 46%;
  clip-path: inherit;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 252, 210, 0.7) 40%, rgba(255, 233, 120, 0) 84%);
  mix-blend-mode: screen;
}
.hero-star::after {
  content: '';
  position: absolute;
  inset: 18%;
  clip-path: inherit;
  background: radial-gradient(circle at 52% 80%, rgba(220, 170, 0, 0.45) 0%, rgba(220, 170, 0, 0) 70%);
  opacity: 0.92;
}

.hero-star.xl { width: clamp(47px, 6.5vw, 69px); }
.hero-star.lg { width: clamp(36px, 4.5vw, 52px); }
.hero-star.md { width: clamp(30px, 3.8vw, 45px); }
.hero-star.sm { width: clamp(26px, 3.4vw, 40px); }

.hero-star:nth-child(2n) {
  animation-delay: -2.1s;
}

.hero-star:nth-child(3n) {
  animation-delay: -3.5s;
}

@keyframes starTwinkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.82; }
  30% { transform: scale(1.08) rotate(3deg); opacity: 1; }
  60% { transform: scale(0.96) rotate(-2deg); opacity: 0.88; }
}

@media (max-width: 720px) {
  .hero-star-field {
    inset: 16% 8% 24% 18%;
  }
  .hero-star {
    width: clamp(18px, 5vw, 30px);
  }
  .hero-star.xl { width: clamp(35px, 9vw, 52px); }
  .hero-star.lg { width: clamp(27px, 7vw, 42px); }
  .hero-star.md { width: clamp(23px, 6vw, 37px); }
  .hero-star.sm { width: clamp(20px, 5vw, 32px); }
  .hero-orb {
    top: 38%;
    left: 72%;
    width: clamp(41.154px, 15.4328vw, 68.59px);
    transform: translate(-50%, -50%) rotate(0deg);
  }
  .hero-orb__value {
    font-size: clamp(12.00325px, 3.6009vw, 15.4328px);
  }
}

.hero-stage-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
}

.stage-left {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 1;
}

@media (min-width: 1024px) {
  .hero-stage-content {
    flex-direction: column;
    align-items: stretch;
    gap: 36px;
  }

  .stage-left {
    flex: 1 1 auto;
  }
}

.hero-header {
  display: flex;
  align-items: center;
  gap: 18px;
  z-index: 1;
  flex-wrap: wrap;
}

.hero-emblem {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd1ec, #ffedf7);
  box-shadow: 0 12px 28px rgba(255, 182, 193, 0.35);
  display: grid;
  place-items: center;
  position: relative;
  overflow: visible;
}

.hero-emblem-icon {
  display: none;
}

/* 顶部头像框覆盖图�?*/
.hero-emblem::after {
  content: '';
  position: absolute;
  inset: -6px;
  background: url('/frames/lucky-star-frame.png') center/contain no-repeat;
  pointer-events: none;
  z-index: 2;
}

.hero-avatar {
  z-index: 1;
}

.hero-banner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.banner-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.banner-name {
  font-size: 22px;
  font-weight: 900;
  color: #8b1c3f;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
}

.banner-meta {
  font-size: 13px;
  font-weight: 800;
  color: #ad2859;
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 12px;
  border-radius: 999px;
  box-shadow: 0 8px 16px rgba(255, 255, 255, 0.35);
}

.banner-tier {
  font-size: 12px;
  font-weight: 800;
  color: #b21c5b;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 16px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(255, 175, 189, 0.4);
  width: fit-content;
}

.hero-body {
  display: grid;
  gap: 26px;
  z-index: 1;
}

@media (min-width: 900px) {
  .hero-body {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
    align-items: center;
  }
}

.hero-figure {
  position: relative;
  min-height: 260px;
  display: flex;
  align-items: flex-end;
  /* 让锚点以左对齐，然后使用 left + translateX(-50%) 将其中心对齐到舞台中�?*/
  justify-content: flex-start;
}

.figure-glow {
  position: absolute;
  top: 4%;
  width: 170%;
  height: 90%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4), rgba(255, 180, 200, 0));
  filter: blur(20px);
  opacity: 0.7;
}

.hero-figure img {
  position: relative;
  max-height: 320px;
  width: auto;
  object-fit: contain;
  z-index: 1;
  pointer-events: none;
}

/* 锚点：用于将人物与台面绑定并整体平移到背景舞台中�?*/
.figure-anchor{
  position: relative;
  left: var(--figure-center);
  transform: translate(-50%, var(--figure-shift-y, 27%)) scale(var(--figure-scale, 1));
  transform-origin: 50% 100%;
  display: inline-flex;
  align-items: flex-end;
  justify-content: center;
}

.figure-stage {
  position: absolute;
  bottom: -18px;
  width: 68%;
  height: 62px;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(235, 184, 200, 0.55) 60%,
    rgba(230, 170, 188, 0) 100%
  );
  border-radius: 50%;
  box-shadow: 0 18px 40px rgba(226, 137, 161, 0.35);
  z-index: 0;
}

/* 人物右侧装饰图片 */
.figure-decoration {
  position: absolute;
  /* 基于人物中心做相对位移，桌面端更靠右一�?*/
  left: calc(var(--figure-center) + var(--decor-shift-x, 22%));
  top: var(--decor-top, 6%);
  width: var(--decor-width, clamp(160px, 20vw, 280px));
  z-index: 1;
  pointer-events: none;
  transform: translate(var(--decor-translate-x, 0%), var(--decor-translate-y, 0%)) scale(var(--decor-scale, 1));
  transform-origin: left bottom;
  isolation: isolate;
}

.figure-decoration::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.3) 10%,
    rgba(255, 210, 230, 0.22) 45%,
    rgba(255, 140, 180, 0.12) 100%
  );
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 1;
}

.figure-decoration img {
  display: block;
  width: 100%;
  height: auto;
  position: relative;
  z-index: 0;
  filter: brightness(0.968) drop-shadow(0 10px 24px rgba(226, 137, 161, 0.25));
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: #7d1d46;
}

.hero-title {
  font-size: 24px;
  font-weight: 900;
  color: #b21d5b;
  letter-spacing: 1px;
}

.hero-quote {
  font-size: 14px;
  line-height: 1.7;
  background: rgba(255, 255, 255, 0.75);
  padding: 12px 16px;
  border-radius: 14px;
  box-shadow: 0 10px 22px rgba(255, 192, 203, 0.32);
  color: #8c1c43;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  padding: 6px 14px;
  border-radius: 999px;
  background: linear-gradient(120deg, #ffe6f2, #ffd2e6);
  font-size: 12px;
  font-weight: 800;
  color: #8b1c3f;
  box-shadow: 0 10px 24px rgba(255, 170, 195, 0.35);
}

.card {
  background: #fff;
  border: 1px solid #fde2e4;
  border-radius: 16px;
  box-shadow: 0 10px 26px rgba(245, 120, 140, 0.08);
  padding: 12px;
}

.gift {
  margin-bottom: 12px;
}

.gift-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.gift-head .ico {
  font-size: 16px;
}

.gift h3 {
  font-weight: 900;
  color: #9d174d;
  font-size: 15px;
}

.gift-tip {
  color: #6b7280;
  font-size: 12px;
  margin: 4px 0 8px;
}

.btn-gift {
  display: block;
  width: 100%;
  text-align: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fda4af;
  color: #fff;
  font-weight: 900;
  box-shadow: 0 8px 16px rgba(230, 122, 136, 0.22);
  font-size: 12px;
  white-space: nowrap;
}

.vip2 .vip2-head h3 {
  font-weight: 900;
  color: #9d174d;
  font-size: 15px;
}

.privs2 {
  list-style: none;
  padding: 6px 0 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.privs2 li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.privs2 .i {
  width: 20px;
  text-align: center;
}

.privs2 .k {
  font-weight: 700;
  color: #374151;
  font-size: 12px;
}

.btn-vip {
  margin-top: 10px;
  display: block;
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fbbf24;
  color: #fff;
  font-weight: 900;
  box-shadow: 0 8px 16px rgba(234, 179, 8, 0.25);
  font-size: 12px;
  white-space: nowrap;
}

/* �Ҳ���ɫ�����򣺸߶������ hero-stage һ�� */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* �� .hero-stage һ�� */
  min-height: calc(100dvh - 96px);
  position: relative;
  /* ˮ��ɵ����� */
  --orb-url: url('/decorations/water-orb.png');
  --orb-size: clamp(160px, 22vw, 280px);
  --orb-left: 50%;
  --orb-top: 86%;
  --orb-opacity: 0.96;
  --orb-rotate: 0deg;
}

/* ������ҳ������Ƭ�ߴ�/���ͳһ */
.side-panel .card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  box-shadow: none;
  position: relative;
  z-index: 1; /* ��ˮ��֮�� */
}
.side-panel .card + .card { margin-top: 16px; }
.side-panel .gift-head h3,
.side-panel .vip2-head h3 { font-weight: 600; margin: 0 0 8px; color: #111827; }
.side-panel .gift-head { display:flex; align-items:center; gap:6px; }
.side-panel .gift-tip { color:#4b5563; font-size: 14px; line-height: 1.5; }
.side-panel .btn-gift { margin-top:8px; padding:8px 0; border-radius:8px; background: var(--brand-main,#e67a88); color:#fff; font-weight:800; box-shadow:none; }
.side-panel .privs2 { gap: 8px; }
.side-panel .privs2 .k { font-size: 14px; color:#374151; }
.side-panel .btn-vip { margin-top:12px; padding:8px 0; border-radius:8px; box-shadow:none; }

.side-panel::before{
  display: none !important;
}

@media (max-width: 900px) {
  .hero-stage {
    padding: 36px 18px 32px;
    /* 移动端适配：进一步贴近底�?*/
    min-height: calc(100dvh - 104px);
  /* 移动端再右移 2% �?60%，再下移 2% �?31% */
  --figure-center: 62%;
  --figure-shift-y: 31%;
    --figure-scale: 1.3;
  }

  /* �ƶ��ˣ��Ҳ�������߶�ͬ�� */
  .side-panel {
    min-height: calc(100dvh - 104px);
  }

/* ˮ���Ҳ�������װ�Σ� */
.side-panel::before{
  content: '';
  position: absolute;
  left: var(--orb-left);
  top: var(--orb-top);
  width: var(--orb-size);
  /* �����ԣ���ʽ�߶ȣ�����ĳЩ������֧�� aspect-ratio ���¸߶�Ϊ 0 */
  height: var(--orb-size);
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%) rotate(var(--orb-rotate));
  /* ���д������֤ var() �ڲ��ֹ�����·�ϵļ����� */
  background-image: var(--orb-url);
  background-position: center;
  background-size: contain;
  background-repeat: no-repeat;
  opacity: var(--orb-opacity);
  filter: drop-shadow(0 24px 44px rgba(17, 24, 39, 0.22));
  pointer-events: none;
  z-index: 3;
}

.side-panel-orb{
  position:absolute;
  left: var(--orb-left);
  top: var(--orb-top);
  width: var(--orb-size);
  height: var(--orb-size);
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%) rotate(var(--orb-rotate));
  background: var(--orb-url) center/contain no-repeat;
  opacity: var(--orb-opacity);
  filter: drop-shadow(0 24px 44px rgba(17, 24, 39, 0.22));
  pointer-events:none;
  z-index:3;
}

  /* 移动端：装饰图缩小并稍微靠近人物，避免压住右�?*/
  .figure-decoration {
    left: calc(var(--figure-center) + 7%);
    top: 10%;
    width: clamp(120px, 34vw, 200px);
    opacity: 0.98;
  isolation: isolate;
}.figure-decoration::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.3) 10%,
    rgba(255, 210, 230, 0.22) 45%,
    rgba(255, 140, 180, 0.12) 100%
  );
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 1;
}
}
</style>


<!-- star styles to update -->
<!-- debug -->













