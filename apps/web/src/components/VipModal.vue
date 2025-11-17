<template>
  <teleport to="body">
    <div v-if="modelValue" class="vip-overlay" @click.self="close">
      <div class="vip-modal" role="dialog" aria-modal="true" :aria-label="t('nav.upgrade')">
        <button class="close" :aria-label="t('common.close')" @click="close">×</button>

        <!-- 头部固定区域 -->
        <div class="vip-head">
          <h2 class="title">{{ t('vipModal.title') }}</h2>
          <p class="subtitle">{{ t('vipModal.currentIs') }}<strong>{{ currentLevel }}</strong></p>
          <!-- 可选：后端动态文案示例（存在则显示） -->
          <p v-if="te('vipExtra.promo')" class="subtitle extra">{{ t('vipExtra.promo') }}</p>
        </div>
        <!-- 可滚动内容区域 -->
        <div class="vip-body">
        <!-- 水晶会员 -->
        <section class="tier">
          <div class="tier-head">
            <div class="tier-info">
              <CleanIcon :src="diamondIcon" :alt="t('vip.tier.purple')" :size="44" class="tier-icon" />
              <div class="tier-meta">
                <div class="tier-name">{{ t('vip.tier.purple') }}</div>
                <ul class="tier-feats">
                  <li>{{ t('vipModal.feat.unlimitedChats') }}</li>
                  <li>{{ t('vipModal.feat.vipBadge') }}</li>
                </ul>
              </div>
            </div>
            <div class="upgrade-gift">
              <span class="upgrade-gift-title">{{ t('vipModal.gift.upgradeForOthers') }}</span>
              <label class="upgrade-gift-field" for="vip-gift-nickname">
                <span class="field-label">{{ t('vipModal.gift.nicknameLabel') }}</span>
                <input
                  id="vip-gift-nickname"
                  type="text"
                  v-model="giftNickname"
                  :placeholder="t('vipModal.gift.nicknamePlaceholder')"
                  autocomplete="off"
                />
              </label>
              <span v-if="giftError" class="upgrade-gift-error">{{ giftError }}</span>
            </div>
          </div>
          <div class="plans">
            <div v-for="p in purplePlans" :key="p.months" class="plan">
              <div class="plan-left">{{ t('vipModal.planLabel', { months: p.months, usd: p.usd }) }}</div>
              <button class="cta" @click="confirm('purple', p.months, p.usd)">{{ t('vipModal.openNow') }}</button>
            </div>
          </div>
        </section>

        <!-- 帝景会员 -->
        <section class="tier">
          <div class="tier-head">
            <div class="tier-info">
              <img :src="crownIcon" :alt="t('vip.tier.crown')" class="tier-icon" />
              <div class="tier-meta">
                <div class="tier-name">{{ t('vip.tier.crown') }}</div>
                <ul class="tier-feats">
                  <li>{{ t('vipModal.feat.unlimitedChats') }}</li>
                  <li>{{ t('vipModal.feat.sendImages') }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="plans">
            <div v-for="p in crownPlans" :key="p.months" class="plan">
              <div class="plan-left">{{ t('vipModal.planLabel', { months: p.months, usd: p.usd }) }}</div>
              <button class="cta" @click="confirm('crown', p.months, p.usd)">{{ t('vipModal.openNow') }}</button>
            </div>
          </div>
  </section>

  <!-- 会员交友特权（对比表） -->
  <section class="benefits">
          <h3 class="b-title">{{ t('vipModal.benefitsTitle') }}</h3>
          <div class="b-table" role="table" :aria-label="t('vipModal.benefitsAria')">
            <div class="b-row b-head" role="row">
              <div class="b-cell" role="columnheader">{{ t('vipModal.benefit') }}</div>
              <div class="b-cell center" role="columnheader">{{ t('vip.tier.purple') }}</div>
              <div class="b-cell center" role="columnheader">{{ t('vip.tier.crown') }}</div>
            </div>
            <div class="b-row" role="row" v-for="(row, i) in benefits" :key="i">
              <div class="b-cell" role="cell">{{ t(row.label) }}</div>
              <div class="b-cell center" role="cell">
                <span v-if="row.crystal === true" class="ok">✓</span>
                <span v-else-if="row.crystal === false" class="no">✕</span>
                <span v-else>{{ row.crystal }}</span>
              </div>
              <div class="b-cell center" role="cell">
                <span v-if="row.emperor === true" class="ok">✓</span>
                <span v-else-if="row.emperor === false" class="no">✕</span>
                <span v-else>{{ row.emperor }}</span>
              </div>
            </div>
          </div>

          <!-- 移动端：分组列表样式（表格在小屏隐藏） -->
          <div class="b-list">
            <div class="bl-item" v-for="(row, i) in benefits" :key="'m-'+i">
              <div class="bl-title">{{ t(row.label) }}</div>
              <div class="bl-pairs">
                <div class="bl-pair">
                  <span class="tag">{{ t('vip.tier.purple') }}</span>
                  <span class="val" :class="{ ok: row.crystal===true, no: row.crystal===false }">
                    <template v-if="row.crystal===true">✓</template>
                    <template v-else-if="row.crystal===false">✕</template>
                    <template v-else>{{ row.crystal }}</template>
                  </span>
                </div>
                <div class="bl-pair">
                  <span class="tag">{{ t('vip.tier.crown') }}</span>
                  <span class="val" :class="{ ok: row.emperor===true, no: row.emperor===false }">
                    <template v-if="row.emperor===true">✓</template>
                    <template v-else-if="row.emperor===false">✕</template>
                    <template v-else>{{ row.emperor }}</template>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="b-icons" :aria-label="t('vipModal.benefitsQuick')">
            <div class="b-ic">
              <span class="ico" aria-hidden="true">
                <!-- 皇冠（会员标识） -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 19h18"/>
                  <path d="M5 19l2-9 5 5 5-5 2 9"/>
                  <circle cx="5" cy="7" r="1"/>
                  <circle cx="12" cy="6" r="1"/>
                  <circle cx="19" cy="7" r="1"/>
                </svg>
              </span>
              <div class="txt">{{ t('vipModal.feat.vipBadge') }}</div>
            </div>
            <div class="b-ic">
              <span class="ico" aria-hidden="true">
                <!-- 爱心（查看喜爱我的） -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.8 10.3c0 4.7-8.8 9.2-8.8 9.2S3.2 15 3.2 10.3C3.2 7.9 5.1 6 7.5 6c1.5 0 2.8.7 3.5 1.9C11.7 6.7 13 6 14.5 6c2.4 0 4.3 1.9 4.3 4.3z"/>
                </svg>
              </span>
              <div class="txt">{{ t('vipModal.feat.likedMe') }}</div>
            </div>
            <div class="b-ic">
              <span class="ico" aria-hidden="true">
                <!-- 眼睛（查看谁看我） -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </span>
              <div class="txt">{{ t('vipModal.feat.viewedMe') }}</div>
            </div>
            <div class="b-ic">
              <span class="ico" aria-hidden="true">
                <!-- 放大镜（高级搜索） -->
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="7"/>
                  <path d="M21 21l-4.3-4.3"/>
                </svg>
              </span>
              <div class="txt">{{ t('vipModal.feat.advancedSearch') }}</div>
            </div>
          </div>
        </section>
        </div>

        <!-- 底部固定留白/安全区（无按钮） -->
        <div class="vip-foot" aria-hidden="true"></div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CleanIcon from './CleanIcon.vue'
import { registerDynamicTranslations, type DynamicTranslationsPayload } from '../dynamicI18n'
const props = defineProps<{ modelValue: boolean; currentLevel?: string; diamondIcon?: string; crownIcon?: string; dynamicTexts?: DynamicTranslationsPayload }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'confirm', payload: { tier: 'purple'|'crown'; months: number; usd: number; giftNickname?: string }): void }>()

const { t, te } = useI18n()
const currentLevel = computed(() => props.currentLevel || t('vip.tier.none'))
const diamondIcon = computed(() => props.diamondIcon || '/vip/diamond.png')
const crownIcon = computed(() => props.crownIcon || '/vip/crown.png')

const purplePlans = [
  { months: 1, usd: 16 },
  { months: 3, usd: 46 },
  { months: 6, usd: 94 },
  { months: 12, usd: 190 },
]
const crownPlans = [
  { months: 1, usd: 102 },
  { months: 3, usd: 262 },
  { months: 6, usd: 468 },
  { months: 12, usd: 786 },
]

const giftNickname = ref('')
const giftError = ref('')

function close(){ emit('update:modelValue', false) }
function confirm(tier: 'purple'|'crown', months: number, usd: number){
  const nickname = giftNickname.value.trim()
  if (giftNickname.value && !nickname) {
    giftError.value = t('vipModal.gift.nicknameRequired')
    return
  }
  giftError.value = ''
  emit('confirm', { tier, months, usd, giftNickname: nickname || undefined })
}

watch(giftNickname, (val) => {
  if (!val || val.trim()) giftError.value = ''
})

watch(() => props.modelValue, (visible) => {
  if (!visible) {
    giftNickname.value = ''
    giftError.value = ''
  }
})

// 如果父组件/接口传入动态翻译，注入为命名空间 vipExtra 下的键
watch(() => props.dynamicTexts, (val) => {
  if (val && typeof val === 'object') {
    registerDynamicTranslations(val, { namespace: 'vipExtra', overwrite: false })
  }
}, { immediate: true })

// 会员交友特权对比（来源：需求截图第二张）
type BenefitRow = { label: string; crystal: boolean | string; emperor: boolean | string }
const benefits: BenefitRow[] = [
  { label: 'vipModal.feat.vipBadge', crystal: true, emperor: true },
  { label: 'vipModal.feat.unlimitedChats', crystal: true, emperor: true },
  { label: 'vipModal.feat.topExposure', crystal: true, emperor: true },
  { label: 'vipModal.feat.freeTranslate', crystal: true, emperor: true },
  { label: 'vipModal.feat.identityVerify', crystal: true, emperor: true },
  { label: 'vipModal.feat.lucky',   crystal: false, emperor: true },
  { label: 'vipModal.feat.confessionWall',   crystal: false, emperor: true },
  { label: 'vipModal.feat.privateSupport', crystal: false, emperor: true },
  { label: 'vipModal.feat.sendImages', crystal: false, emperor: true },
  { label: 'vipModal.feat.moreExposure', crystal: true, emperor: true },
]
</script>

<style scoped>
.vip-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:10000; }
.vip-modal{ position:relative; width:min(92vw, 760px); max-height:92vh; background:#fff; border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,.16); display:flex; flex-direction:column; }
.vip-head{ position:sticky; top:0; z-index:2; background:#fff; padding:12px 16px 8px; border-bottom:1px solid #f2f2f3; border-top-left-radius:12px; border-top-right-radius:12px; }
.vip-body{ flex:1 1 auto; overflow:auto; -webkit-overflow-scrolling:touch; padding:12px 16px; }
.vip-foot{ position:sticky; bottom:0; height:8px; background:linear-gradient(to bottom, rgba(255,255,255,0), #fff); border-bottom-left-radius:12px; border-bottom-right-radius:12px; }
.close{ position:absolute; right:12px; top:8px; width:36px; height:36px; display:grid; place-items:center; border:0; background:transparent; border-radius:999px; font-size:20px; line-height:1; color:#999; cursor:pointer; z-index:3; }
.close:hover, .close:focus-visible{ color:#666; background:rgba(0,0,0,.05); outline:none; }
.title{ font-size:18px; font-weight:800; letter-spacing:.2px; color:#333; margin:0 2px 4px; text-align:center; }
.subtitle{ margin:0 0 8px; color:#666; font-weight:700; font-size:12px; text-align:center; }
.subtitle.extra{ color:#9c4660; }
.upgrade-gift{ display:flex; align-items:center; gap:8px; margin-left:auto; flex:0 1 auto; }
.upgrade-gift-title{ font-weight:900; color:#d14a61; font-size:13px; white-space:nowrap; }
.upgrade-gift-field{ display:flex; align-items:center; gap:6px; font-weight:700; color:#555; }
.upgrade-gift-field .field-label{ font-size:12.5px; color:#777; white-space:nowrap; }
.upgrade-gift-field input{ width:170px; padding:6px 12px; border:1px solid #f3b6c3; border-radius:999px; background:#fff; font-weight:700; color:#333; outline:none; transition:border-color .2s ease, box-shadow .2s ease; }
.upgrade-gift-field input::placeholder{ color:#c7c7c7; font-weight:600; }
.upgrade-gift-field input:focus{ border-color:#f17384; box-shadow:0 0 0 2px rgba(241,115,132,0.18); }
.upgrade-gift-error{ color:#ef4444; font-size:12px; font-weight:700; white-space:nowrap; }

.tier{ border:1px dashed #f5c4cb; border-radius:10px; padding:8px 10px; margin-bottom:10px; }
.tier-head{ display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:10px; }
.tier-info{ display:flex; align-items:center; gap:10px; flex:1 1 auto; min-width:220px; }
.tier-icon{ width:44px; height:44px; object-fit:contain; }
.tier-meta{ display:flex; flex-direction:column; justify-content:center; gap:4px; min-height:44px; }
.tier-name{ font-size:15px; font-weight:900; color:#333; }
.tier-feats{ margin:0; padding:0 0 0 16px; color:#666; font-weight:700; font-size:12px; list-style:none; line-height:1.2; }
.tier-feats li{ line-height:1.2; }

.plans{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; }
.plan{ display:flex; align-items:center; justify-content:space-between; border:none; border-radius:10px; padding:7px 9px; background:#fff; }
.plan-left{ font-weight:700; color:#444; font-size:12.5px; }
.cta{ background: var(--brand-pink, #f17384); color:#fff; border:0; height:28px; border-radius:8px; padding:0 10px; font-weight:800; font-size:12px; cursor:pointer; }
.cta:hover{ filter:brightness(.95); }

/* 移除原底部按钮（已不再使用） */

/* 会员交友特权表格 */
.benefits{ margin-top:14px; border:1px dashed #f5c4cb; border-radius:10px; padding:12px; }
.b-title{ font-size:15px; font-weight:900; color:#333; margin:0 0 6px; }
.b-table{ width:100%; border:1px solid #f2f2f3; border-radius:10px; overflow:hidden; }
.b-row{ display:grid; grid-template-columns: 1.28fr .86fr .86fr; }
.b-row + .b-row{ border-top:1px solid #f4f4f5; }
.b-head{ background:#fff4f6; font-weight:900; color:#d14a61; }
.b-cell{ padding:7px 9px; font-weight:700; color:#444; font-size:12.5px; }
.b-cell.center{ text-align:center; }
.ok{ color:#10b981; font-weight:900; }
.no{ color:#ef4444; font-weight:900; }

.b-icons{ display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; margin-top:12px; }
.b-ic{ display:flex; align-items:center; gap:8px; padding:8px 10px; border:1px solid #f8e4e7; background:#fff; border-radius:12px; }
.b-ic .ico{ width:28px; height:28px; border-radius:50%; background:#ffecee; display:grid; place-items:center; color: var(--brand-pink, #f17384); }
.b-ic .ico svg{ width:18px; height:18px; display:block; }
.b-ic .txt{ font-weight:800; color:#555; font-size:12.5px; }

/* 移动端分组列表 */
.b-list{ display:none; }
.bl-item{ border:1px solid #f2f2f3; border-radius:10px; padding:10px; background:#fff; }
.bl-item + .bl-item{ margin-top:10px; }
.bl-title{ font-weight:900; color:#333; margin-bottom:6px; }
.bl-pairs{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.bl-pair{ display:flex; align-items:center; justify-content:space-between; background:#fafafa; border:1px solid #eee; border-radius:8px; padding:6px 8px; }
.bl-pair .tag{ font-weight:800; color:#666; font-size:12.5px; }
.bl-pair .val{ font-weight:900; }

@media (max-width: 520px){
  .vip-modal{ width:min(96vw, 440px); padding:12px; }
  .plans{ grid-template-columns: 1fr; }
  .tier-head{ flex-direction:column; align-items:flex-start; }
  .upgrade-gift{ width:100%; margin-left:0; justify-content:flex-start; flex-wrap:wrap; gap:6px; }
  .upgrade-gift-field{ width:100%; justify-content:flex-start; }
  .upgrade-gift-field input{ flex:1 1 auto; min-width:0; }
  .upgrade-gift-error{ width:100%; white-space:normal; }
  /* 小屏改为分组列表：隐藏表格，显示列表 */
  .b-table{ display:none; }
  .b-list{ display:block; }
  .b-cell{ padding:7px 9px; font-size:12px; }
  .bl-title{ font-size:13px; }
  .bl-pair .tag{ font-size:12px; }
  .bl-pair .val{ font-size:12px; }
  .b-icons{ grid-template-columns: repeat(2, minmax(0,1fr)); }
}
</style>
