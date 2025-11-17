<template>
  <teleport to="body">
    <div v-if="modelValue" class="topup-overlay" @click.self="close">
      <div class="topup-modal" role="dialog" aria-modal="true" :aria-label="t('nav.topup')">
        <button class="close" :aria-label="t('common.close')" @click="close">×</button>

        <!-- 顶部一行：余额 + 点卡兑换按钮（与标题水平对齐） -->
        <div class="topline">
          <h2 class="title">{{ t('settings.balance.title') }}：<span class="amount">{{ balance.toFixed(2) }}</span></h2>
          <button type="button" class="redeem-btn" @click="openRedeem">{{ t('nav.cardRedeem') }}</button>
        </div>

        <!--（上移）储值金额输入：放在标题下方，作为全局金额显示/输入入口 -->
        <div class="amount-row amount-row--top">
          <label>{{ t('topup.amountLabel') }}：</label>
          <input type="number" min="1" step="1" v-model.number="amount" @input="onTopAmountTyped" />
          <span class="unit">{{ t('settings.balance.unit') }}</span>
        </div>

        <!-- 套餐网格：第一个为自定义金额输入 -->
        <div class="grid">
          <button v-for="p in presets" :key="p.coins" type="button" class="card" :class="{ active: selected === p.coins }" @click="selectPreset(p.coins)">
            <div class="card-title">{{ p.coins }}<small>{{ t('settings.balance.unit') }}</small></div>
            <div class="card-sub">{{ p.usd }} USD</div>
          </button>
        </div>

        <!-- 已移除：底部“储值给好友”区域 -->

        <div class="actions">
          <button class="primary" @click="confirm">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </teleport>
  </template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Preset { coins: number; usd: number }
const presets: Preset[] = [
  { coins: 100, usd: 100 },
  { coins: 200, usd: 200 },
  { coins: 300, usd: 300 },
  { coins: 520, usd: 520 },
  { coins: 666, usd: 666 },
  { coins: 888, usd: 888 }
]

const props = defineProps<{ modelValue: boolean; balance?: number; defaultAmount?: number }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', amount: number): void
  (e: 'openRedeem'): void
}>()

const balance = computed(() => props.balance ?? 0)

// 选中金额（卡片选择或自定义/输入框）
const amount = ref<number>(props.defaultAmount ?? 100)
const selected = ref<number | null>(null) // 选择了某个套餐时的值

function close(){ emit('update:modelValue', false) }
function confirm(){
  const v = Number(amount.value || 0)
  if (!Number.isFinite(v) || v <= 0) return
  emit('confirm', Math.floor(v))
  close()
}
function openRedeem(){ emit('openRedeem') }
function selectPreset(v: number){ selected.value = v; amount.value = v }
function onTopAmountTyped(){
  const v = Number(amount.value || 0)
  if (!Number.isFinite(v) || v <= 0) return
  // 若与预设一致，则高亮对应卡片；否则视为自定义
  const hit = presets.find(p => p.coins === Math.floor(v))
  if (hit){
    selected.value = hit.coins
  } else {
    selected.value = null
  }
}

watch(() => props.modelValue, (open) => {
  if (open){
    const v = Number(amount.value || 0) || 100
    const hit = presets.find(p => p.coins === Math.floor(v))
    selected.value = hit ? hit.coins : null
  }
})

onMounted(() => {})
</script>

<style scoped>
.topup-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:10000; }
.topup-modal{ position:relative; width: min(90vw, 560px); border-radius:12px; background:#fff; padding:20px; box-shadow:0 20px 60px rgba(0,0,0,.18); }
.close{ position:absolute; right:14px; top:10px; border:0; background:transparent; font-size:22px; line-height:1; color:#999; cursor:pointer; }
.close:hover{ color:#666; }
.topline{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin:4px 0 12px; flex-wrap:wrap; }
.title{ font-size:22px; font-weight:800; letter-spacing:.4px; color:#333; margin:0; }
.title .amount{ margin-left:6px; }

.redeem-btn{ height:38px; padding:0 12px; border-radius:8px; border:0; background: var(--brand-pink, #f17384); color:#fff; font-weight:800; cursor:pointer; transform: translateX(-50%); }
.redeem-btn:hover{ filter:brightness(0.95); }

.grid{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; margin-bottom:18px; }
.card{ border:1px solid #e5e7eb; border-radius:10px; padding:16px; background:#fff; color:#333; text-align:left; cursor:pointer; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; }
.card:hover{ border-color:#f3b0b8; }
.card.active{ border-color: var(--brand-pink, #f17384); box-shadow:0 0 0 2px rgba(241,115,132,.12) inset; }
.card .card-title{ font-weight:800; font-size:18px; letter-spacing:.2px; color:#333; }
.card .card-title small{ font-size:12px; margin-left:4px; font-weight:800; color:#777; }
.card .card-sub{ margin-top:6px; color:#999; font-weight:700; }

/* removed custom amount input styles */

.amount-row{ display:flex; align-items:center; gap:10px; }
.amount-row--top{ margin: 6px 0 16px; }
.amount-row label{ font-weight:800; color:#333; }
.amount-row input{ width:180px; height:40px; border:1px solid #e5e7eb; border-radius:8px; padding:0 12px; font-weight:700; }
.amount-row .unit{ color:#777; font-weight:700; }

.actions{ display:flex; justify-content:center; }
.actions .primary{ height:44px; min-width:180px; border-radius:10px; border:0; background: var(--brand-pink, #f17384); color:#fff; font-weight:800; letter-spacing:.6px; cursor:pointer; }
.actions .primary:hover{ filter:brightness(0.95); }

@media (max-width: 480px){
  .topup-modal{ width: min(94vw, 420px); padding:18px; }
  .topline{ gap:10px; }
}
</style>
