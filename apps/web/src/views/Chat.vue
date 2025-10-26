<template>
  <div class="chat-page relative min-h-[75vh]">
    <!-- 背景层：固定充满视口，确保在任何屏幕上都能看到背景图 -->
    <div class="chat-bg fixed inset-0 z-0"></div>
    <div class="relative z-10 container mx-auto px-2 py-4">
      <div class="grid grid-cols-12 gap-3">
        <!-- 左列：聊天面板（客服模式下水平居中） -->
        <div :class="['col-span-12', isSupportSimple ? 'max-w-[696px] w-full mx-auto' : 'lg:col-span-9']">
          <div :class="['flex flex-col chat-card overflow-hidden rounded-2xl border bg-white/65 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,.12)]', isSupportSimple ? 'h-[82vh]' : 'h-[80vh]']">
            <!-- 顶部条：左侧为可搜索输入框（占 1/4 宽度），右侧为当前会话标题 -->
            <div class="tab-bar" v-if="!isSupportSimple">
              <div class="tab tab--search">
                <div class="navlike-search">
                  <input v-model.trim="searchKey" @input="onSearchInput" type="search" :placeholder="t('chat.search.placeholder')" />
                  <button type="button" class="go" @click="doSearch" aria-label="search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  </button>
                </div>
              </div>
              <div class="tab active">{{ t('chat.withUser', { user: headerName }) }}</div>
            </div>
            <div v-else class="support-head flex items-center gap-3 px-4 py-3 border-b bg-white/70 backdrop-blur-md">
              <!-- 客服头像：与右上角“联系客服”图标一致的耳机图标 -->
              <span class="cs-support-avatar cs-md" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 12a6 6 0 0 1 12 0" />
                    <path d="M6 12v2.1a1.9 1.9 0 0 0 1.9 1.9H9" />
                    <path d="M18 12v1.6" />
                    <path d="M18 16.3a2 2 0 0 1-2 2h-1.2" />
                  </g>
                  <circle cx="18.6" cy="16.3" r="1.2" fill="currentColor" />
                </svg>
              </span>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-gray-800 truncate">{{ t('nav.contactService') }}</h3>
                  <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{{ t('chat.support.online') }}</span>
                </div>
                <p class="text-xs text-gray-500 leading-snug">{{ t('chat.support.subtitle') }}</p>
              </div>
            </div>
            <div v-if="!isSupportSimple" class="flex-1 content-grid">
              <aside class="side-col">
                <!-- 搜索结果优先，否则展示经常聊天 -->
                <template v-if="searching">
                  <div class="muted text-sm">{{ t('chat.search.searching') }}</div>
                </template>
                <template v-else-if="searchKey">
                  <div v-if="searchResults.length" class="result-list">
                    <div v-for="u in searchResults" :key="u.id" class="result-item">
                      <AvatarImg :gender="(u.gender as any)" :size="36" />
                      <div class="ri-main">
                        <div class="ri-name" :title="u.nickname || u.id">{{ u.nickname || u.id }}</div>
                        <div class="ri-sub" :title="u.id">{{ t('chat.search.userId') }}{{ u.id }}</div>
                      </div>
                      <button type="button" class="ri-btn" @click="openChatWith(u.id)">{{ t('chat.actions.message') }}</button>
                    </div>
                  </div>
                  <div v-else class="muted text-sm">{{ t('chat.search.empty') }}</div>
                </template>
                <template v-else>
                  <div class="recent-head">{{ t('chat.recent.title') }}</div>
                  <div v-if="recentList.length" class="recent-list">
                    <div v-for="c in recentList" :key="c.peerId" class="recent-item" @click="openChatWith(c.peerId)">
                      <AvatarImg :gender="(c.peer.gender as any)" :size="34" />
                      <div class="rc-main">
                        <div class="rc-top">
                          <span class="rc-name" :title="c.peer.nickname">{{ c.peer.nickname }}</span>
                          <span class="rc-time">{{ formatRelative(c.lastAt) }}</span>
                        </div>
                        <div class="rc-msg" :title="c.lastContent">{{ c.lastContent }}</div>
                      </div>
                      <span v-if="c.unread>0" class="rc-unread">{{ c.unread>99 ? '99+' : c.unread }}</span>
                    </div>
                  </div>
                  <div v-else class="muted text-sm">{{ t('chat.recent.empty') }}</div>
                </template>
              </aside>
              <div class="chat-col flex flex-col">
                <div ref="chatBody" class="flex-1 min-h-0 overflow-auto px-0 py-3 space-y-2 chat-body">
                  <!-- 空态提示（仅客服会话展示；普通用户会话不展示） -->
                  <div v-if="messages.length === 0 && peerId==='support'" class="flex flex-col items-center justify-center h-[40vh] text-gray-500">
                    <div class="text-4xl mb-2">😊</div>
                    <p class="font-semibold">{{ t('chat.support.hello') }}</p>
                    <p class="text-sm">{{ t('chat.support.subtitle') }}</p>
                  </div>
                  <div v-else v-for="m in messages" :key="m.id" class="flex items-end" :class="m.fromUserId===me ? 'justify-end' : 'justify-start'">
                    <!-- 左侧：对方消息头像 -->
                    <div v-if="m.fromUserId!==me" class="mr-2">
                      <template v-if="isSupportSimple">
                        <span class="cs-support-avatar cs-sm" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M6 12a6 6 0 0 1 12 0" />
                              <path d="M6 12v2.1a1.9 1.9 0 0 0 1.9 1.9H9" />
                              <path d="M18 12v1.6" />
                              <path d="M18 16.3a2 2 0 0 1-2 2h-1.2" />
                            </g>
                            <circle cx="18.6" cy="16.3" r="1.2" fill="currentColor" />
                          </svg>
                        </span>
                      </template>
                      <template v-else>
                        <AvatarImg :gender="peerGender" :size="28" :alt="'peer avatar'" />
                      </template>
                    </div>
                    <!-- 消息气泡 -->
                    <span class="inline-block max-w-[75%] rounded-xl px-3 py-2 break-words shadow-sm"
                      :class="m.fromUserId===me ? 'bg-main text-white' : 'bg-white/90 border border-gray-200'">
                      <div @click.stop="openMsgTrMenu($event, m)">
                        <template v-if="!shouldShowDual(m)">
                          {{ loadingAnyTranslation(m) ? translatingLabel : (isAnyTranslationFailed(m) ? failedLabel : (getAnyTranslation(m) || displayContent(m))) }}
                        </template>
                        <template v-else>
                          <div class="line-1">{{ getAnyTranslation(m) || displayContent(m) }}</div>
                          <div class="line-2" :class="{muted: !hasAnyTranslation(m)}">{{ hasAnyTranslation(m) ? m.content : (loadingAnyTranslation(m) ? translatingLabel : (isAnyTranslationFailed(m) ? failedLabel : m.content)) }}</div>
                        </template>
                      </div>
                    </span>
                    <!-- 右侧：我的消息头像 -->
                    <div v-if="m.fromUserId===me" class="ml-2">
                      <AvatarImg :gender="myGender" :size="28" :alt="'my avatar'" />
                    </div>
                  </div>
                </div>
                <!-- 底部输入区：仅占右侧列宽度 -->
                <form class="px-3 md:px-4 py-3 md:py-4 border-t chat-input bg-white/70 backdrop-blur-lg" @submit.prevent="send">
                  <div class="composer">
          <textarea ref="msgInput" v-model="content" :placeholder="t('chat.placeholder')" rows="1"
          @input="autoResize" @keydown.enter.exact.prevent="onEnterSend($event)" @keydown.enter.shift.stop
          class="flex-1 px-3 py-2 text-[15px] outline-none bg-transparent resize-none overflow-hidden leading-[1.35] max-h-[140px]" />
                    <div class="tools relative flex items-center gap-2">
                      <button type="button" class="circle-icon" aria-label="emoji" ref="emojiBtn" @click.stop="toggleEmoji($event)" @mousedown.stop>😊</button>
                      <button type="button" class="circle-icon" aria-label="image" @click="onImageClick">🖼️</button>
                      <button type="button" class="circle-icon" aria-label="gift" ref="giftBtn" @click.stop="toggleGift($event)">🎁</button>
                      <button type="button" class="circle-icon" aria-label="more" ref="moreBtn" @click="toggleLangMenu($event)">⋯</button>
                      <!-- 语言选择菜单（相对 tools 容器定位） -->
                      <div v-if="langMenuOpen" ref="langMenuRef" class="lang-menu absolute bottom-full right-0 mb-2">
                        <div class="tip" aria-hidden="true"></div>
                        <div class="group-title">{{ t('chat.menu.translateTo') }}</div>
                        <button type="button" class="menu-item" :class="{ active: !langTarget }" @click="chooseLang(null)">{{ t('chat.menu.showOriginal') }}</button>
                        <button v-for="opt in LANG_OPTIONS" :key="opt.code" type="button" class="menu-item" :class="{ active: langTarget===opt.code }" @click="chooseLang(opt.code)">
                          <span>{{ opt.label }}</span>
                          <svg v-if="langTarget===opt.code" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z"/></svg>
                        </button>
                        <div class="divider" role="separator" aria-hidden="true"></div>
                        <label class="menu-item toggle">
                          <span>{{ t('chat.menu.dualMode') }}</span>
                          <input type="checkbox" v-model="dualMode" />
                        </label>
                      </div>
                    </div>
                    <button class="send-btn rounded-full px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="!content.trim()">{{ t('chat.send') }}</button>
                  </div>
                </form>
              </div>
            </div>
            <div v-else ref="chatBody" class="flex-1 overflow-auto px-4 py-3 space-y-2 chat-body">
              <!-- 空态提示（无历史消息时） -->
              <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-[40vh] text-gray-500">
                <div class="text-4xl mb-2">😊</div>
                <p class="font-semibold">{{ t('chat.support.hello') }}</p>
                <p class="text-sm">{{ t('chat.support.subtitle') }}</p>
              </div>
              <div v-else v-for="m in messages" :key="m.id" class="flex items-end" :class="m.fromUserId===me ? 'justify-end' : 'justify-start'">
                <!-- 左侧：对方消息头像 -->
                <div v-if="m.fromUserId!==me" class="mr-2">
                  <template v-if="isSupportSimple">
                    <span class="cs-support-avatar cs-sm" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6 12a6 6 0 0 1 12 0" />
                          <path d="M6 12v2.1a1.9 1.9 0 0 0 1.9 1.9H9" />
                          <path d="M18 12v1.6" />
                          <path d="M18 16.3a2 2 0 0 1-2 2h-1.2" />
                        </g>
                        <circle cx="18.6" cy="16.3" r="1.2" fill="currentColor" />
                      </svg>
                    </span>
                  </template>
                  <template v-else>
                    <AvatarImg :gender="peerGender" :size="28" :alt="'peer avatar'" />
                  </template>
                </div>
                <!-- 消息气泡 -->
                <span class="inline-block max-w-[75%] rounded-xl px-3 py-2 break-words shadow-sm"
                  :class="m.fromUserId===me ? 'bg-main text-white' : 'bg-white/90 border border-gray-200'">
                  <div @click.stop="openMsgTrMenu($event, m)">
                    <template v-if="!shouldShowDual(m)">
                      {{ loadingAnyTranslation(m) ? translatingLabel : (isAnyTranslationFailed(m) ? failedLabel : (getAnyTranslation(m) || displayContent(m))) }}
                    </template>
                    <template v-else>
                      <div class="line-1">{{ getAnyTranslation(m) || displayContent(m) }}</div>
                      <div class="line-2" :class="{muted: !hasAnyTranslation(m)}">{{ hasAnyTranslation(m) ? m.content : (loadingAnyTranslation(m) ? translatingLabel : (isAnyTranslationFailed(m) ? failedLabel : m.content)) }}</div>
                    </template>
                  </div>
                </span>
                <!-- 右侧：我的消息头像 -->
                <div v-if="m.fromUserId===me" class="ml-2">
                  <AvatarImg :gender="myGender" :size="28" :alt="'my avatar'" />
                </div>
              </div>
            </div>
            <!-- 底部输入区（仅文字输入；客服简化模式显示在整宽下方） -->
            <form v-if="isSupportSimple" class="p-3 md:p-4 border-t chat-input bg-white/70 backdrop-blur-lg" @submit.prevent="send">
              <div class="composer">
                <textarea ref="msgInput" v-model="content" :placeholder="t('chat.placeholder')" rows="1"
                          @input="autoResize" @keydown.enter.exact.prevent="onEnterSend($event)" @keydown.enter.shift.stop
                          class="flex-1 px-3 py-2 text-[15px] outline-none bg-transparent resize-none overflow-hidden leading-[1.35] max-h-[140px]" />
                <button class="send-btn rounded-full px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="!content.trim()">{{ t('chat.send') }}</button>
              </div>
            </form>
          </div>
        </div>

  <!-- 右列：礼物与会员交友特权（客服模式隐藏） -->
        <div class="col-span-12 lg:col-span-3" v-if="!isSupportSimple">
          <div class="bg-white rounded border p-3">
            <h3 class="font-semibold mb-2">{{ t('chat.side.gift.title') }}</h3>
            <div class="flex items-start gap-2">
              <div class="text-2xl">🎁</div>
              <p class="text-gray-600 leading-snug text-sm">{{ t('chat.side.gift.desc') }}</p>
            </div>
            <button class="mt-2 w-full rounded bg-main text-white py-2 hover:brightness-105" type="button" @click="openGiftModal">{{ t('chat.side.gift.cta') }}</button>
          </div>

          <div class="bg-white rounded border p-3 mt-4">
            <h3 class="font-semibold mb-2">{{ t('chat.side.vip.title') }}</h3>
            <ul class="space-y-2 text-gray-700 text-sm leading-snug">
              <li class="flex gap-2"><span class="text-xl">👑</span><div>{{ t('chat.side.vip.benefit1') }}</div></li>
              <li class="flex gap-2"><span class="text-xl">👀</span><div>{{ t('chat.side.vip.benefit2') }}</div></li>
              <li class="flex gap-2"><span class="text-xl">✉️</span><div>{{ t('chat.side.vip.benefit3') }}</div></li>
              <li class="flex gap-2"><span class="text-xl">💗</span><div>{{ t('chat.side.vip.benefit4') }}</div></li>
            </ul>
            <button class="mt-3 w-full rounded bg-amber-400 text-white py-2 hover:brightness-105" type="button" @click="openVipNow">{{ t('chat.side.vip.cta') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 礼物商城模态框（teleport 到 body，覆盖全局） -->
  <teleport to="body">
    <div v-if="giftModalOpen" class="gift-modal fixed inset-0 z-[120]">
      <div class="gm-mask absolute inset-0 bg-black/40" @click="closeGiftModal"></div>
      <div class="gm-wrap absolute inset-0 p-4 md:p-6 grid place-items-center">
        <div class="gm-panel w-full max-w-3xl bg-white/95 backdrop-blur rounded-2xl border shadow-2xl overflow-hidden">
          <div class="gm-head flex items-center justify-between px-4 py-3 border-b">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🎁</span>
              <h3 class="font-bold text-lg">{{ t('chat.gift.modal.title') }}</h3>
            </div>
            <button type="button" class="circle-icon" aria-label="close" @click="closeGiftModal">✕</button>
          </div>
          <div class="gm-body p-4">
            <div v-if="giftLoading" class="text-center py-10 text-gray-500">{{ t('common.loading') }}</div>
            <div v-else-if="giftError" class="text-center py-10 text-red-500">{{ giftError }}</div>
            <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="g in giftCatalog" :key="g.id" class="g-card">
                <div class="g-thumb"><img :src="g.img" :alt="g.name" /></div>
                <div class="g-meta">
                  <div class="g-name">{{ g.name }}</div>
                  <div class="g-price">¥ {{ g.price }}</div>
                </div>
                <button class="g-send" type="button" @click="sendGift(g)">{{ t('chat.gift.send') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 礼物气泡面板（锚定到礼物按钮，类似表情面板） -->
  <teleport to="body">
    <div v-if="giftOpen" class="gift-popover" ref="giftPanelRef">
      <div class="gp-head">
  <div class="gp-title"><span class="emoji">🎁</span> {{ t('chat.side.gift.title') }}</div>
        <button type="button" class="gp-close" @click="closeGiftPanel">✕</button>
      </div>
      <div class="gp-body">
        <div v-if="giftLoading" class="gp-loading">{{ t('common.loading') }}</div>
        <div v-else-if="giftError" class="gp-error">{{ giftError }}</div>
        <div v-else class="gp-grid">
          <button v-for="g in giftCatalog" :key="g.id" class="gp-item" type="button" @click="sendGiftAndClose(g)">
            <div class="thumb"><img :src="g.img" :alt="g.name" /></div>
            <div class="name" :title="g.name">{{ g.name }}</div>
            <div class="price">¥ {{ g.price }}</div>
          </button>
        </div>
      </div>
      <div class="gp-foot">
        <button type="button" class="gp-more" @click="openGiftModalFromPanel">{{ t('chat.gift.openMall') }}</button>
      </div>
    </div>
  </teleport>

  <!-- 文本选择：翻译悬浮菜单与结果 -->
  <teleport to="body" v-if="ENABLE_SELECTION_TRANSLATE">
    <div v-if="selOpen" class="seltr-wrap fixed z-[125]" :style="{ left: selPos.left+'px', top: selPos.top+'px' }">
      <div class="seltr-box">
        <button type="button" class="seltr-btn" @click="toggleSelLangMenu">
          {{ translateLabel }}
        </button>
        <div v-if="selLangOpen" class="seltr-lang">
          <button v-for="opt in LANG_AUTONYMS" :key="opt.code" type="button" class="lang-item" @click="translateSelection(opt.code)">{{ opt.label }}</button>
        </div>
      </div>
      <div v-if="selResultOpen" class="seltr-result">
        <div class="content">{{ selLoading ? translatingLabel : selResult }}</div>
        <div class="actions">
          <button type="button" @click="copySelResult">{{ copyLabel }}</button>
          <button type="button" @click="closeSelPanel">{{ closeLabel }}</button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 单条消息：翻译菜单（点击气泡弹出） -->
  <teleport to="body">
    <div v-if="msgTrOpen" class="msgtr-menu fixed z-[126]" :style="{ left: msgTrPos.left+'px', top: msgTrPos.top+'px' }">
      <div class="msgtr-head">{{ t('chat.menu.translateTo') }}</div>
      <div class="msgtr-list">
        <button v-for="opt in LANG_OPTIONS" :key="opt.code" type="button" class="msgtr-item" @click="translateMsgTo(opt.code)">{{ opt.label }}</button>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue';
// emoji 选择器样式（确保弹层可见与布局正常）
// 注：旧版 emoji-button 的 CSS 路径在不同版本差异较大，直接引入会导致构建失败
// 这里移除直接 CSS 导入，转而使用本文件中的轻量全局样式以保证可见性
// 开源表情选择器（emoji-button）
// 优先使用维护中的 @joeattardi/emoji-button，兼容旧包名 emoji-button
let EmojiButton: any | null = null
// 由于部分浏览器/环境下第三方 emoji-button 在定位与关闭上存在兼容性问题，
// 这里默认关闭其使用，改为稳定的内置面板；如需启用可改为 true。
const USE_EMOJI_BUTTON = false
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import { Socket } from 'socket.io-client';
import api from '../api';
import { getSocket } from '../socket';
import { useAuth } from '../stores';
import AvatarImg from '../components/AvatarImg.vue'

interface Message { id: string; fromUserId: string; toUserId: string; content: string; createdAt: number }
type Gender = 'male'|'female'|'other'

const route = useRoute();
const router = useRouter();
const peerId = computed(() => route.params.id as string);
const peerNickname = ref<string>('')
const headerName = computed(() => {
  if (peerId.value === 'support') return t('nav.contactService')
  return peerNickname.value || String(peerId.value)
})
const messages = ref<Message[]>([]);
const seen = new Set<string>();
const content = ref('');
const auth = useAuth();
const me = ref<string>(auth.uid || localStorage.getItem('uid') || '');
let socket: Socket | null = null;
const { t, locale } = useI18n();
const myGender = ref<Gender>('other')
const peerGender = ref<Gender>('other')
const isSupportSimple = computed(() => peerId.value === 'support')
const isGuestSupport = computed(() => !localStorage.getItem('token') && peerId.value === 'support')
const guestId = computed(() => {
  const key = 'guestId';
  let id = localStorage.getItem(key);
  if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem(key, id); }
  return id;
})

// ======== 聊天翻译（语言菜单 + 缓存） ========
type TargetLang = 'zh-CN'|'zh-TW'|'en'|'ko'|'ja'
const LANG_OPTIONS: Array<{ code: TargetLang; label: string }> = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' }
]
const moreBtn = ref<HTMLElement | null>(null)
const langMenuRef = ref<HTMLElement | null>(null)
const langMenuOpen = ref(false)
const langTarget = ref<TargetLang | null>(null)
const dualMode = ref(false)
// 简单缓存：key = messageId + '|' + target
const translateCache = new Map<string, string>()
// 版本号：每当写入缓存后自增以触发渲染
const translateVersion = ref(0)
// 简易并发池：限制并发，提高整体速度且避免突发过多请求
async function runPool<T, R>(list: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const ret: R[] = []
  let i = 0
  const exec = async () => {
    for (;;) {
      const idx = i++
      if (idx >= list.length) return
      const r = await worker(list[idx], idx)
      ret[idx] = r
    }
  }
  const tasks = Array.from({ length: Math.min(limit, Math.max(1, list.length)) }, exec)
  await Promise.allSettled(tasks)
  return ret
}
// 单条消息翻译菜单
const msgTrOpen = ref(false)
const msgTrPos = ref({ left: 0, top: 0 })
const msgTrTarget = ref<Message | null>(null)
// 用户针对单条消息选择的目标语言
const msgTargetLang = new Map<string, TargetLang>()
// 记录失败 key：`messageId|target`
const translateFailed = new Set<string>()

function displayContent(m: Message){
  // 读取版本号作为依赖，确保缓存更新后触发重渲染
  void translateVersion.value
  if (!langTarget.value) return m.content
  const key = `${m.id}|${langTarget.value}`
  const t = translateCache.get(key)
  if (!dualMode.value) return t || m.content
  // 双语模式：译文优先显示，下一行显示原文；若译文尚未到达，展示占位
  if (t) return `${t}`
  return m.content
}

function getTranslation(m: Message): string | null {
  if (!langTarget.value) return null
  const key = `${m.id}|${langTarget.value}`
  return translateCache.get(key) || null
}
function hasTranslation(m: Message): boolean { return !!getTranslation(m) }
function loadingTranslation(m: Message): boolean { return !!langTarget.value && !hasTranslation(m) }

// ===== 单条消息弹出翻译菜单（五种语言） =====
function openMsgTrMenu(e: MouseEvent, m: Message){
  // 定位到气泡上方
  const t = e.currentTarget as HTMLElement
  const r = t.getBoundingClientRect()
  const pad = 8
  const top = Math.max(pad, r.top + window.scrollY - 44)
  const left = Math.min(window.innerWidth - 200, Math.max(pad, r.left + r.width/2 - 80))
  msgTrPos.value = { left, top }
  msgTrTarget.value = m
  msgTrOpen.value = true
  // 外部点击关闭
  window.addEventListener('pointerdown', onCloseMsgTr, { once: true, capture: true })
}
function onCloseMsgTr(ev: PointerEvent){
  const panel = document.querySelector('.msgtr-menu') as HTMLElement | null
  if (!panel){ msgTrOpen.value = false; return }
  const t = ev.target as Node
  if (panel.contains(t)) return
  msgTrOpen.value = false
}
async function translateMsgTo(code: TargetLang){
  const m = msgTrTarget.value
  if (!m) return
  const key = `${m.id}|${code}`
  // 1) 先记录目标语言并关闭菜单 -> 立即进入“翻译中”状态
  msgTargetLang.set(m.id, code)
  msgTrOpen.value = false
  translateVersion.value++
  if (typeof translateFailed !== 'undefined') translateFailed.delete(key)
  // 2) 若无缓存，异步拉取翻译
  if (!translateCache.has(key)){
    const srcGuess = detectLangForText(m.content)
    const sNorm = normLang(srcGuess)
    const tNorm = normLang(code)
    const t = (sNorm === tNorm) ? m.content : await translateTextSafe(m.content, srcGuess, code)
    if (t){ translateCache.set(key, t); translateVersion.value++ }
    else { if (typeof translateFailed !== 'undefined') translateFailed.add(key); translateVersion.value++ }
  }
}

// 用于本条双语展示的便捷方法（优先当前菜单目标语言，其次全局语言）
function resolveTargetForMsg(m?: Message): TargetLang | null{
  if (m && msgTargetLang.has(m.id)) return msgTargetLang.get(m.id) as TargetLang
  return (langTarget.value as TargetLang | null) || null
}
function getAnyTranslation(m: Message): string | null{
  void translateVersion.value
  const tgt = resolveTargetForMsg(m)
  if (!tgt) return null
  const key = `${m.id}|${tgt}`
  return translateCache.get(key) || null
}
function hasAnyTranslation(m: Message){ return !!getAnyTranslation(m) }
function loadingAnyTranslation(m: Message){
  void translateVersion.value
  const tgt = resolveTargetForMsg(m); if (!tgt) return false
  const key = `${m.id}|${tgt}`
  return !translateCache.has(key) && !(typeof translateFailed !== 'undefined' && translateFailed.has(key))
}
function isAnyTranslationFailed(m: Message){
  void translateVersion.value
  const tgt = resolveTargetForMsg(m); if (!tgt) return false
  const key = `${m.id}|${tgt}`
  return (typeof translateFailed !== 'undefined') && translateFailed.has(key)
}
function shouldShowDual(m: Message){
  // 仅当用户开启“双语”且存在目标语言时，以双行显示
  return !!dualMode.value && !!resolveTargetForMsg(m)
}

function toggleLangMenu(e?: MouseEvent){
  e?.stopPropagation()
  langMenuOpen.value = !langMenuOpen.value
  if (langMenuOpen.value){
    // 定位到工具条上方
    nextTick(() => positionLangMenu())
    window.addEventListener('click', onDocClickCloseLang, { once: true })
  }
}
function onDocClickCloseLang(ev: MouseEvent){
  const menu = langMenuRef.value
  const btn = moreBtn.value
  if (!menu) { langMenuOpen.value = false; return }
  const t = ev.target as Node
  if (menu.contains(t) || (btn && btn.contains(t))) {
    // 点击了菜单内部或按钮，不关闭。重新监听下一次文档点击。
    window.addEventListener('click', onDocClickCloseLang, { once: true })
    return
  }
  langMenuOpen.value = false
}
function positionLangMenu(){
  const menu = langMenuRef.value
  if (!menu) return
  // 已使用 absolute bottom-full right-0 + mb-2 相对 tools 容器定位，这里只做视口微调
  const rect = menu.getBoundingClientRect()
  if (rect.left < 8) menu.style.left = `${8 - rect.left}px`
}

async function chooseLang(code: TargetLang | null){
  langTarget.value = code
  langMenuOpen.value = false
  // 全局选择语言后，清除单条消息的目标语言覆盖，避免“无反应”（仍保留缓存以复用）
  msgTargetLang.clear()
  // 不同于普通响应式对象，Map 的变更不会触发渲染，这里用版本号手动触发
  translateVersion.value++
  if (!code) {
    // 切回显示原文时直接返回（不触发批量翻译）
    return
  }
  // 继续：选择了具体目标语言，开始批量翻译；在加载阶段显示“翻译中…”
  // 批量翻译当前已加载的消息中尚未缓存的部分
  const source = guessSourceLang()
  const batch: Array<{ m: Message; key: string }> = []
  for (const m of messages.value){
    const key = `${m.id}|${code}`
    if (!translateCache.has(key)) {
      // 若此前该条目标语言翻译失败，先移除失败标记以展示“翻译中…”，并允许重试
      if (typeof translateFailed !== 'undefined') translateFailed.delete(key)
      batch.push({ m, key })
    }
  }
  if (!batch.length) return
  // 并发翻译，限制并发数
  await runPool(batch, 6, async (item) => {
    const sNorm = normLang(source as string)
    const tNorm = normLang(code)
    const translated = (sNorm === tNorm) ? item.m.content : await translateTextSafe(item.m.content, source as string, code)
    if (translated) { translateCache.set(item.key, translated); translateVersion.value++ }
    else { if (typeof translateFailed !== 'undefined') translateFailed.add(item.key); translateVersion.value++ }
    return null as any
  })
}

function guessSourceLang(): TargetLang | 'auto' {
  // 简化：若包含大量中文字符则认为是 zh-CN，否则 auto 交给服务端
  const text = messages.value.slice(-10).map(m=>m.content).join('\n')
  const zhRatio = (text.match(/[\u4e00-\u9fa5]/g) || []).length / Math.max(1, text.length)
  if (zhRatio > 0.2) return 'zh-CN'
  return 'auto' as any
}

async function translateTextSafe(q: string, source: string, target: string){
  try{
    // 保留繁体目标，避免被当成简体导致结果不对；后端会自行做兼容/回退
    const norm = (c: string) => ({ 'zh': 'zh', 'en': 'en', 'ja': 'ja', 'ko': 'ko', 'auto': 'auto' } as Record<string,string>)[c] || c
    const { data } = await api.post('/api/content/translate', { q, source: norm(source), target: norm(target), format: 'text' })
    const t = data?.data?.translatedText || data?.data?.translation || null
    // 过滤常见错误提示（如 Lingva 要求不同语言）
    const s = typeof t === 'string' ? String(t).trim() : ''
    const lower = s.toLowerCase()
    const isError = lower.includes('please select two distinct languages') || lower.includes('select two different languages')
    if (isError) return null
    return typeof t === 'string' ? t : null
  }catch{
    return null
  }
}

// 语言规范化与轻量本地检测
// 注意：不要将 zh-CN 与 zh-TW 归一为同一值，否则会把“简体→繁体”的翻译误判为“同语种”而跳过
function normLang(c: string){ return ({ 'zh': 'zh', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'en': 'en', 'ja': 'ja', 'ko': 'ko', 'auto': 'auto' } as Record<string,string>)[c] || c }
function detectLangForText(text: string): TargetLang | 'auto'{
  const s = text || ''
  const hasKo = /[\uac00-\ud7af]/.test(s)
  if (hasKo) return 'ko'
  const hasJa = /[\u3040-\u30ff]/.test(s) // ひらがな/カタカナ
  if (hasJa) return 'ja'
  const zhCount = (s.match(/[\u4e00-\u9fa5]/g) || []).length
  if (zhCount > Math.max(1, s.length * 0.15)) return 'zh-CN'
  return 'en'
}

// ======== 文本选择翻译（悬浮工具） ========
const LANG_AUTONYMS: Array<{ code: TargetLang; label: string }> = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
]
const translateLabel = computed(() => ({ 'zh-CN': '翻译', 'zh-TW': '翻譯', 'ja': '翻訳', 'ko': '번역', 'en': 'Translate' }[locale.value as string] || 'Translate'))
const copyLabel = computed(() => ({ 'zh-CN': '复制', 'zh-TW': '複製', 'ja': 'コピー', 'ko': '복사', 'en': 'Copy' }[locale.value as string] || 'Copy'))
const closeLabel = computed(() => ({ 'zh-CN': '关闭', 'zh-TW': '關閉', 'ja': '閉じる', 'ko': '닫기', 'en': 'Close' }[locale.value as string] || 'Close'))
const translatingLabel = computed(() => ({ 'zh-CN': '翻译中…', 'zh-TW': '翻譯中…', 'ja': '翻訳中…', 'ko': '번역 중…', 'en': 'Translating…' }[locale.value as string] || 'Translating…'))
const failedLabel = computed(() => ({ 'zh-CN': '翻译失败', 'zh-TW': '翻譯失敗', 'ja': '翻訳に失敗しました', 'ko': '번역 실패', 'en': 'Translate failed' }[locale.value as string] || 'Translate failed'))

// 开关：禁用双击/文本选择触发的翻译浮层
const ENABLE_SELECTION_TRANSLATE = false
const selOpen = ref(false)
const selLangOpen = ref(false)
const selResultOpen = ref(false)
const selLoading = ref(false)
const selPos = ref({ left: 0, top: 0 })
const selText = ref('')
const selResult = ref('')

function updateSelectionUI(){
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) { hideSelPanel(); return }
  const text = (sel.toString() || '').trim()
  if (!text) { hideSelPanel(); return }
  const range = sel.rangeCount ? sel.getRangeAt(0) : null
  if (!range) { hideSelPanel(); return }
  const rect = range.getBoundingClientRect()
  if (!rect || (rect.width === 0 && rect.height === 0)) { hideSelPanel(); return }
  selText.value = text
  selOpen.value = true
  selLangOpen.value = false
  selResultOpen.value = false
  selLoading.value = false
  const pad = 8
  const top = Math.max(8, rect.top + window.scrollY - 44 - pad)
  const left = Math.min(window.innerWidth - 200, Math.max(8, rect.left + rect.width/2 - 60))
  selPos.value = { left, top }
}

function hideSelPanel(){ selOpen.value = false; selLangOpen.value = false; selResultOpen.value = false; selLoading.value = false }
function toggleSelLangMenu(){ selLangOpen.value = !selLangOpen.value }
async function translateSelection(target: TargetLang){
  selLangOpen.value = false
  selResultOpen.value = true
  selLoading.value = true
  const t = await translateTextSafe(selText.value, 'auto', target)
  selResult.value = t || selText.value
  selLoading.value = false
}
function closeSelPanel(){ hideSelPanel() }
function copySelResult(){
  const txt = selResult.value || selText.value
  navigator.clipboard?.writeText(txt).then(()=>{ showToast(copyLabel.value) }).catch(()=>{})
}

function onSelMouseUp(){
  // 仅在聊天区域选择时展示（基础判断）
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed){ hideSelPanel(); return }
  updateSelectionUI()
}
function onSelKeyUp(){ updateSelectionUI() }
if (ENABLE_SELECTION_TRANSLATE){
  window.addEventListener('mouseup', onSelMouseUp)
  window.addEventListener('keyup', onSelKeyUp)
}

// ======== 礼物商城（模态框） ========
interface Gift { id: string; name: string; price: number; img: string }
const giftModalOpen = ref(false)
const giftLoading = ref(false)
const giftError = ref('')
const giftCatalog = ref<Gift[]>([])
// 礼物气泡面板（与表情类似）
const giftBtn = ref<HTMLElement | null>(null)
const giftPanelRef = ref<HTMLElement | null>(null)
const giftOpen = ref(false)

async function loadGiftCatalog(force = false){
  if (!force && giftCatalog.value.length) return
  giftLoading.value = true
  giftError.value = ''
  try{
    const { data } = await api.get('/api/gifts/catalog')
    giftCatalog.value = data?.list || []
  }catch{
    giftError.value = t('chat.toasts.sendFailed')
  }finally{
    giftLoading.value = false
  }
}

async function openGiftModal(){
  await loadGiftCatalog()
  giftModalOpen.value = true
}

function closeGiftModal(){
  giftModalOpen.value = false
}

async function sendGift(g: Gift){
  // 发送礼物需要登录态
  const token = localStorage.getItem('token')
  if (!token){
  showToast(t('chat.toasts.loginBeforeGift'))
    // 快捷跳转到登录页
    window.setTimeout(()=>{ location.hash = '#/login' }, 800)
    return
  }
  // 目标用户 ID
  const to = String(peerId.value || '')
  if (!to){ showToast(t('chat.toasts.choosePeer')); return }
  try{
    await api.post('/api/gifts/send', { toUserId: to, giftId: g.id })
    showToast(`已送出「${g.name}」`)
    closeGiftModal()
  }catch(e:any){
  const msg = e?.response?.data?.error || t('chat.toasts.sendFailed')
    showToast(msg)
  }
}

function sendGiftAndClose(g: Gift){
  sendGift(g)
  closeGiftPanel()
}

function positionGiftPanel(anchor: HTMLElement){
  const panel = giftPanelRef.value
  if (!panel) return
  const a = anchor.getBoundingClientRect()
  const pad = 8
  panel.style.position = 'fixed'
  const w = panel.offsetWidth || 420
  const h = panel.offsetHeight || 360
  let left = a.left - (w - a.width)/2
  let top = a.top - h - 10
  left = Math.max(pad, Math.min(left, window.innerWidth - w - pad))
  // 若上方放不下，放到按钮下方
  if (top < pad) top = Math.min(a.bottom + 10, window.innerHeight - h - pad)
  panel.style.left = `${left}px`
  panel.style.top = `${top}px`
}

function onDocClickCloseGift(ev: PointerEvent){
  const panel = giftPanelRef.value
  const btn = giftBtn.value
  const t = ev.target as Node
  if (!panel){ giftOpen.value = false; window.removeEventListener('pointerdown', onDocClickCloseGift, true); return }
  if (panel.contains(t) || (btn && btn.contains(t))) return
  giftOpen.value = false
  window.removeEventListener('pointerdown', onDocClickCloseGift, true)
}

async function toggleGift(e?: MouseEvent){
  e?.stopPropagation()
  const anchor = (e?.currentTarget as HTMLElement) || giftBtn.value
  if (!anchor) return
  if (giftOpen.value){
    giftOpen.value = false
    window.removeEventListener('pointerdown', onDocClickCloseGift, true)
    return
  }
  await loadGiftCatalog()
  giftOpen.value = true
  nextTick(() => {
    positionGiftPanel(anchor)
    window.addEventListener('pointerdown', onDocClickCloseGift, true)
  })
}

function closeGiftPanel(){
  giftOpen.value = false
  window.removeEventListener('pointerdown', onDocClickCloseGift, true)
}

function openGiftModalFromPanel(){
  closeGiftPanel()
  openGiftModal()
}

// 表情选择器引用与实例
const emojiBtn = ref<HTMLElement | null>(null)
const msgInput = ref<HTMLTextAreaElement | null>(null)
let emojiPicker: any | null = null
const emojiOpen = ref(false)

function getEmojiPanelEl(): HTMLElement | null {
  return document.querySelector('.emoji-picker') as HTMLElement | null
}

// 使用 pointerdown + 捕获阶段，防止打开后同一次 click 触发外部关闭
function onDocClickCloseEmoji(ev: PointerEvent){
  const panel = getEmojiPanelEl()
  const btn = emojiBtn.value
  const t = ev.target as Node
  if (!panel) { emojiOpen.value = false; removeEmojiOutsideGuard(); return }
  if (panel.contains(t) || (btn && btn.contains(t))) return
  // 点击在外部：关闭
  if (emojiPicker && typeof (emojiPicker as any).hidePicker === 'function') (emojiPicker as any).hidePicker()
  else panel.setAttribute('hidden', 'true')
  emojiOpen.value = false
  removeEmojiOutsideGuard()
}

function addEmojiOutsideGuard(){
  // 避免重复绑定
  removeEmojiOutsideGuard()
  window.addEventListener('pointerdown', onDocClickCloseEmoji, true)
}
function removeEmojiOutsideGuard(){
  window.removeEventListener('pointerdown', onDocClickCloseEmoji, true)
}

onMounted(async () => {
  // 进入聊天页时给 body 加背景类，仅本页生效
  // 动态拉取后端配置的聊天背景（仅后端可控）
  try {
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => ctrl.abort(), 5000)
    const { data } = await api.get('/api/content/theme', { signal: ctrl.signal });
    window.clearTimeout(timer)
    const base = (api.defaults as any)?.baseURL || '';
    const fallback = String(base).replace(/\/$/, '') + '/static/backgrounds_1920_1080.jpg';
    const cfgUrl = data?.data?.chatBackground as string | undefined;
    const absUrl = cfgUrl && /^(https?:)?\/{2}/i.test(cfgUrl)
      ? cfgUrl
      : (String(base).replace(/\/$/, '') + (cfgUrl || '/static/backgrounds_1920_1080.jpg'));
    const el = document.getElementById('app-bg');
    if (el) el.setAttribute('style', `background:url('${absUrl || fallback}') center/cover no-repeat fixed;`);
    // 直接作用于 body，保证透明区域能显示背景
    document.body.style.background = `url('${absUrl || fallback}') center/cover no-repeat fixed`;
  } catch {
    // 失败直接使用本地静态背景
    const el = document.getElementById('app-bg');
    const fallback = '/backgrounds/chat-bg.jpg'
    if (el) el.setAttribute('style', `background:url('${fallback}') center/cover no-repeat fixed;`);
    document.body.style.background = `url('${fallback}') center/cover no-repeat fixed`;
  }
  socket = getSocket();
  // 重新注册监听前，先移除旧的监听，避免 HMR 或重复挂载造成的重复推送
  socket.off('private:message');
  socket.on('private:message', (m: Message) => {
    if ((m.fromUserId === me.value && m.toUserId === peerId.value) || (m.fromUserId === peerId.value && m.toUserId === me.value)) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        messages.value.push(m);
        nextTick(() => scrollToBottom())
      }
    }
  });
  // 加载历史消息：游客仅允许 support 对话
  if (isGuestSupport.value) {
    const { data } = await api.get(`/api/messages/${peerId.value}`, { headers: { 'x-guest-id': guestId.value } })
    messages.value = data
    data.forEach((m: Message) => seen.add(m.id))
    nextTick(() => scrollToBottom())
  } else {
    const { data } = await api.get(`/api/messages/${peerId.value}`)
    messages.value = data
    data.forEach((m: Message) => seen.add(m.id))
    nextTick(() => scrollToBottom())
  }
  const meId = localStorage.getItem('uid');
  if (meId) me.value = meId;
  // 加载双方性别以启用默认头像（游客时仅需对方）
  await loadGenders();
  // 搜索页签：初始化最近会话
  if (!isSupportSimple.value) {
    fetchRecent();
    preloadUsers();
  }
  // 进入聊天页即标记该会话为已读（登录态）
  if (!isGuestSupport.value && peerId.value) {
    api.post('/api/messages/read', { peerId: peerId.value }).then(()=>{
      // 通知其他页面刷新会话未读
      window.dispatchEvent(new Event('conv-read'))
    }).catch(()=>{})
  }

  // 若禁用第三方选择器，清理任何残留 DOM，并注入隐藏样式以避免误显
  if (!USE_EMOJI_BUTTON) {
    cleanupThirdPartyEmojiPanels()
    injectHideEmojiCss()
  } else {
    // 预热动态导入（若失败不会阻塞，首次点击时还会再尝试）
    try { await import('emoji-button') } catch {}
  }

  // 初始化输入高度
  nextTick(()=> autoResize())
});

onUnmounted(() => {
  // 清理应用级背景样式
  const el = document.getElementById('app-bg');
  if (el) el.removeAttribute('style');
  document.body.style.background = '';
  socket?.disconnect();
  window.removeEventListener('keydown', onEscClose)
  window.removeEventListener('click', onDocClickCloseLang)
  removeEmojiOutsideGuard()
  if (ENABLE_SELECTION_TRANSLATE){
    window.removeEventListener('mouseup', onSelMouseUp)
    window.removeEventListener('keyup', onSelKeyUp)
  }
  cleanupThirdPartyEmojiPanels()
  removeHideEmojiCss()
});

async function ensureEmojiPicker(){
  if (emojiPicker) return emojiPicker
  try{
    const mod: any = await import('emoji-button')
    EmojiButton = (mod as any).EmojiButton || (mod as any).default
    emojiPicker = new EmojiButton({
      theme: 'light',
      position: 'top-start',
      autoFocusSearch: true,
      showVariants: false,
      emojisPerRow: 8,
      zIndex: 10000,
      rootElement: document.body,
      i18n: { search: '搜索', categories: { recents: '常用', smileys: '表情', people: '人物', animals: '动物', foods: '食物', travel: '旅行', activities: '活动', objects: '物品', symbols: '符号', flags: '旗帜' } }
    })
    emojiPicker.on('emoji', (selection: any) => {
      const ch = selection?.emoji ?? selection
      if (typeof ch === 'string') insertAtCaret(ch); else insertAtCaret(selection.emoji)
    })
    // 同步展示状态，自动挂/卸外部点击监听
    const onShown = () => { emojiOpen.value = true; addEmojiOutsideGuard() }
    const onHidden = () => { emojiOpen.value = false; removeEmojiOutsideGuard() }
    ;(emojiPicker as any).on?.('show', onShown)
    ;(emojiPicker as any).on?.('hidden', onHidden)
    return emojiPicker
  }catch(err){
    // 交由调用方兜底
    throw err
  }
}

function isEmojiPanelVisible(picker?: any){
  // 优先使用库自带的标志位（不同版本字段或函数名可能不同）
  if (picker){
    const v: any = (picker as any).isPickerVisible ?? (picker as any).pickerVisible ?? (picker as any).visible
    if (typeof v === 'function') {
      try { return !!v.call(picker) } catch { /* ignore */ }
    }
    if (typeof v === 'boolean') return v
  }
  const panel = document.querySelector('.emoji-picker') as HTMLElement | null
  if (!panel) return false
  if (panel.hasAttribute('hidden')) return false
  const style = window.getComputedStyle(panel)
  if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return false
  const rects = panel.getClientRects()
  return rects && rects.length > 0 && rects[0].width > 0 && rects[0].height > 0
}

async function toggleEmoji(e?: MouseEvent){
  // 阻止本次点击冒泡到 document，避免刚打开就被“外部点击”逻辑关闭
  e?.stopPropagation()
  const anchor = (e?.currentTarget as HTMLElement) || emojiBtn.value
  if (!anchor) return
  // 采用内置本地面板为主，确保跨环境稳定
  if (!USE_EMOJI_BUTTON){
    // 保守处理：显示内置面板前，清一次第三方残留
    cleanupThirdPartyEmojiPanels()
    if (localEmojiPanel) { hideLocalEmojiFallback(); return }
    showLocalEmojiFallback(anchor)
    return
  }
  // 如果本地兜底面板已显示，则优先关闭并返回
  if (localEmojiPanel) { hideLocalEmojiFallback(); return }
  try{
    const picker = await ensureEmojiPicker()
    const visible = emojiOpen.value || isEmojiPanelVisible(picker)
    if (visible) {
      if (typeof (picker as any).hidePicker === 'function') (picker as any).hidePicker()
      else if (typeof (picker as any).closePicker === 'function') (picker as any).closePicker()
      else (picker as any).togglePicker?.(anchor)
      emojiOpen.value = false
      removeEmojiOutsideGuard()
    } else {
      // 使用 setTimeout 推迟到事件循环后执行，避免同一次 click 被外部点击侦听器误判
      window.setTimeout(() => {
        if (typeof (picker as any).openPicker === 'function') (picker as any).openPicker(anchor)
        else if (typeof (picker as any).showPicker === 'function') (picker as any).showPicker(anchor)
        else (picker as any).togglePicker?.(anchor)
        window.setTimeout(() => {
          ensurePanelInViewport(anchor)
        }, 60)
        emojiOpen.value = true
        // 捕获阶段监听，优先于库内部的冒泡关闭逻辑处理
        addEmojiOutsideGuard()
        // 若短时间内仍未可见，则自动启用本地兜底面板
        window.setTimeout(() => {
          const nowVisible = isEmojiPanelVisible(picker)
          if (!nowVisible){
            // 关闭第三方（若已经创建了占位层）并切到本地面板
            try{ (picker as any).hidePicker?.() }catch{}
            removeEmojiOutsideGuard()
            showLocalEmojiFallback(anchor)
          }
        }, 180)
      }, 0)
    }
  }catch{
    // 如果第三方库加载失败，则使用本地简易表情面板，并支持 toggle
    if (localEmojiPanel) { hideLocalEmojiFallback(); return }
    showLocalEmojiFallback(anchor)
  }
}

// ========== 功能未解锁提示 ==========
function showToast(msg: string, key = 'toast-locked'){
  // 移除同 key 的旧提示，避免叠加
  const old = document.getElementById(key)
  if (old && old.parentElement) old.parentElement.removeChild(old)
  const el = document.createElement('div')
  el.id = key
  el.textContent = msg
  Object.assign(el.style, {
    position: 'fixed', left: '50%', bottom: '84px', transform: 'translateX(-50%)',
    background: 'rgba(17,24,39,0.92)', color: '#fff',
    padding: '10px 14px', borderRadius: '999px',
    fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px',
    boxShadow: '0 8px 20px rgba(0,0,0,.25)', zIndex: '10000',
    maxWidth: '80%', whiteSpace: 'nowrap'
  } as CSSStyleDeclaration)
  document.body.appendChild(el)
  window.setTimeout(() => {
    el.style.transition = 'opacity .25s ease, transform .25s ease'
    el.style.opacity = '0'
    el.style.transform = 'translateX(-50%) translateY(8px)'
    window.setTimeout(() => { if (el.parentElement) el.parentElement.removeChild(el) }, 260)
  }, 1400)
}

function onImageClick(ev?: MouseEvent){
  ev?.preventDefault()
  showToast(t('chat.toasts.notUnlocked'))
}

// 支持按 ESC 关闭第三方表情面板与兜底面板
function onEscClose(e: KeyboardEvent){
  if (e.key !== 'Escape') return
  const panel = document.querySelector('.emoji-picker') as HTMLElement | null
  if (panel && isEmojiPanelVisible()){
    // 尝试通过 picker API 关闭
    if (emojiPicker && typeof (emojiPicker as any).hidePicker === 'function') (emojiPicker as any).hidePicker()
    else panel.setAttribute('hidden', 'true')
    emojiOpen.value = false
    removeEmojiOutsideGuard()
  }
  // 关闭礼物弹窗
  if (giftModalOpen.value) giftModalOpen.value = false
  // 关闭语言菜单
  if (langMenuOpen.value) langMenuOpen.value = false
  if (localEmojiPanel) hideLocalEmojiFallback()
}
window.addEventListener('keydown', onEscClose)

// ======== 本地简易表情面板（兜底） ========
let localEmojiPanel: HTMLElement | null = null
// 扩充当前常用/热门表情集合
const BASIC_EMOJIS = [
  '😀','😁','😂','🤣','🥲','🥹','🥳','😊','😍','🥰','😘','😜','😎','🙂','🙃','🤔','🤯','🤗','😏','😴','😢','😭','😡',
  '👍','👎','👏','🙏','💪','❤️','💖','💗','✨','🔥','💯','✅','❌','👀','🎉','🎁','📸','📌','📍','🚀','🍀','🍻','☕','🍔','🍕','⚽','🏀'
]
function showLocalEmojiFallback(anchor: HTMLElement){
  hideLocalEmojiFallback()
  const rect = anchor.getBoundingClientRect()
  const panel = document.createElement('div')
  panel.className = 'mini-emoji-fallback'
  Object.assign(panel.style, {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.top - 240}px`,
    width: '320px',
    padding: '8px',
    background: '#fff',
    border: '1px solid rgba(17,24,39,0.08)',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,.15)',
    zIndex: '10000'
  } as CSSStyleDeclaration)
  const grid = document.createElement('div')
  Object.assign(grid.style, { display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:'6px' })
  BASIC_EMOJIS.forEach(ch => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = ch
    Object.assign(btn.style, { width:'32px', height:'32px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer' })
    btn.onmouseenter = () => { btn.style.background = '#f3f4f6' }
    btn.onmouseleave = () => { btn.style.background = '#fff' }
    btn.onclick = () => { insertAtCaret(ch); hideLocalEmojiFallback() }
    grid.appendChild(btn)
  })
  panel.appendChild(grid)
  document.body.appendChild(panel)
  localEmojiPanel = panel
  clampPanelToViewport(panel, rect)
  // 点击外部关闭
  const onDocClick = (ev: MouseEvent) => {
    if (!panel.contains(ev.target as Node) && ev.target !== anchor){
      hideLocalEmojiFallback(); document.removeEventListener('click', onDocClick)
    }
  }
  window.setTimeout(()=> document.addEventListener('click', onDocClick), 0)
}
function hideLocalEmojiFallback(){
  if (localEmojiPanel && localEmojiPanel.parentElement){ localEmojiPanel.parentElement.removeChild(localEmojiPanel) }
  localEmojiPanel = null
}

// 将弹层限制到视口范围内（第三方或本地面板均可复用）
function ensurePanelInViewport(anchor: HTMLElement){
  const panel = document.querySelector('.emoji-picker') as HTMLElement | null
  if (!panel) return
  const a = anchor.getBoundingClientRect()
  panel.style.position = 'fixed'
  // 初步放在按钮上方
  let left = a.left
  let h = (panel.offsetHeight || 280)
  let w = (panel.offsetWidth || 320)
  let top = a.top - h - 8
  const pad = 8
  const maxLeft = window.innerWidth - w - pad
  const maxTop = window.innerHeight - h - pad
  left = Math.max(pad, Math.min(left, maxLeft))
  // 避免遮挡底部消息发送条
  const bar = document.querySelector('.chat-input') as HTMLElement | null
  if (bar){
    const br = bar.getBoundingClientRect()
    const idealTop = br.top - h - 8
    if (idealTop > pad){
      top = idealTop
    } else if (top < pad) {
      // 实在放不下再放到工具条下方（通常已接近视口底部），并尽量贴底但不遮挡
      top = Math.min(br.bottom + 8, maxTop)
    }
  } else if (top < pad) {
    top = Math.min(a.bottom + 8, maxTop)
  }
  panel.style.left = `${left}px`
  panel.style.top = `${top}px`
}

function clampPanelToViewport(panel: HTMLElement, anchorRect: DOMRect){
  const pad = 8
  const w = panel.offsetWidth || 320
  const h = panel.offsetHeight || 280
  let left = parseFloat(panel.style.left || `${anchorRect.left}`)
  let top = parseFloat(panel.style.top || `${anchorRect.top - h - 8}`)
  const maxLeft = window.innerWidth - w - pad
  const maxTop = window.innerHeight - h - pad
  left = Math.max(pad, Math.min(left, maxLeft))
  // 避免遮挡底部消息发送条
  const bar = document.querySelector('.chat-input') as HTMLElement | null
  if (bar){
    const br = bar.getBoundingClientRect()
    const idealTop = br.top - h - 8
    if (idealTop > pad){
      top = idealTop
    } else if (top < pad) {
      top = Math.min(br.bottom + 8, maxTop)
    }
  } else if (top < pad) {
    top = Math.min(anchorRect.bottom + 8, maxTop)
  }
  panel.style.left = `${left}px`
  panel.style.top = `${top}px`
}

function insertAtCaret(text: string){
  const input = msgInput.value as HTMLTextAreaElement | null
  if (!input){ content.value += text; return }
  const start = input.selectionStart ?? input.value.length
  const end = input.selectionEnd ?? input.value.length
  const before = input.value.slice(0, start)
  const after = input.value.slice(end)
  const newVal = before + text + after
  content.value = newVal
  nextTick(()=>{
    input.focus()
    const pos = start + text.length
    input.setSelectionRange(pos, pos)
    autoResize()
  })
}

function autoResize(){
  const el = msgInput.value
  if (!el) return
  el.style.height = 'auto'
  const h = Math.min(el.scrollHeight, 140)
  el.style.height = h + 'px'
}

function onEnterSend(e: KeyboardEvent){
  // 单纯 Enter 直接发送；Shift+Enter 在模板上已 stop 作为换行
  send()
  // 发送后重置高度
  nextTick(()=> autoResize())
}

// ======== 清理第三方 emoji-button 残留面板 & 动态隐藏样式 ========
function cleanupThirdPartyEmojiPanels(){
  try{
    const nodes = document.querySelectorAll('.emoji-picker')
    nodes.forEach(n => n.parentElement?.removeChild(n))
  }catch{}
}
function injectHideEmojiCss(){
  const id = 'hide-emoji-picker-css'
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `.emoji-picker{display:none!important;}`
  document.head.appendChild(style)
}
function removeHideEmojiCss(){
  const el = document.getElementById('hide-emoji-picker-css')
  if (el && el.parentElement) el.parentElement.removeChild(el)
}

async function send() {
  if (!content.value || !content.value.trim()) return;
  // 发送前移除半角/全角空格，防绕过；前端处理一次，后端也会再次校验
  const cleaned = content.value.replace(/[ \u3000]+/g, '');
  if (!cleaned) { content.value = ''; return; }
  const token = localStorage.getItem('token');
  // 未登录且非客服会话：禁止发送，提示去登录
  if (!token && peerId.value !== 'support') {
    showToast(t('nav.login'));
    window.setTimeout(() => { location.hash = '#/login' }, 800);
    return;
  }
  if (isGuestSupport.value) {
    // 游客通过 HTTP fallback 发送
    const { data } = await api.post('/api/messages/guest/support', { guestId: guestId.value, content: cleaned })
    if (!seen.has(data.id)) { seen.add(data.id); messages.value.push(data); }
  } else {
    // 优先通过 Socket 发送；若未连接，则走 HTTP fallback，确保可以发出
    if (socket && (socket as any).connected) {
      socket.emit('private:message', { toUserId: peerId.value, content: cleaned });
    } else {
      try {
        const { data } = await api.post('/api/messages', { toUserId: String(peerId.value || ''), content: cleaned })
        if (!seen.has(data.id)) { seen.add(data.id); messages.value.push(data); }
      } catch (e: any) {
        const msg = e?.response?.data?.error || '发送失败，请稍后重试'
        showToast(msg)
        return;
      }
    }
    // 不再进行本地乐观追加，避免与服务器回显的同一条消息重复显示
  }
  content.value = '';
  nextTick(() => scrollToBottom())
}

// 自动滚动到最新消息
const chatBody = ref<HTMLElement | null>(null)
function scrollToBottom(){
  const el = chatBody.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}
watch(messages, () => nextTick(() => scrollToBottom()))

// 当切换语言或新消息到达时，自动翻译最近的消息（最多 30 条）
watch([messages, langTarget], async () => {
  if (!langTarget.value) return
  const source = guessSourceLang()
  const recent = messages.value.slice(-30)
  const todo = recent.map(m => ({ m, key: `${m.id}|${langTarget.value}` })).filter(it => !translateCache.has(it.key))
  if (!todo.length) return
  await runPool(todo, 6, async (it) => {
    const t = await translateTextSafe(it.m.content, source as any, langTarget.value as any)
    if (t) { translateCache.set(it.key, t); translateVersion.value++ }
    else { if (typeof translateFailed !== 'undefined') translateFailed.add(it.key); translateVersion.value++ }
    return null as any
  })
}, { deep: true })

// 新消息到达时，若已选择全局语言，优先快速翻译最后一条，避免“刚发出的消息不翻译”的空窗
watch(() => messages.value.length, async (len, old) => {
  if (!langTarget.value) return
  if (len <= 0 || len <= (old || 0)) return
  const m = messages.value[len - 1]
  if (!m) return
  const key = `${m.id}|${langTarget.value}`
  if (translateCache.has(key)) return
  // 立刻触发“翻译中…”渲染
  translateVersion.value++
  const src = detectLangForText(m.content)
  const sNorm = normLang(src)
  const tNorm = normLang(langTarget.value)
  const t = (sNorm === tNorm) ? m.content : await translateTextSafe(m.content, src as any, langTarget.value as any)
  if (t) { translateCache.set(key, t); translateVersion.value++ }
  else { if (typeof translateFailed !== 'undefined') translateFailed.add(key); translateVersion.value++ }
})

// 文本内容变化时也调整高度（包括外部插入表情）
watch(content, () => nextTick(()=> autoResize()))

// 路由切换时重新加载历史与性别等
async function loadHistory(){
  messages.value = []
  seen.clear()
  try{
    if (isGuestSupport.value) {
      const { data } = await api.get(`/api/messages/${peerId.value}`, { headers: { 'x-guest-id': guestId.value } })
      messages.value = data
      data.forEach((m: Message) => seen.add(m.id))
    } else {
      const { data } = await api.get(`/api/messages/${peerId.value}`)
      messages.value = data
      data.forEach((m: Message) => seen.add(m.id))
    }
  } finally {
    nextTick(() => scrollToBottom())
  }
}

async function loadGenders(){
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const [{ data: meUser }, { data: users }] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/users')
      ])
      myGender.value = (meUser.gender || 'other') as Gender
      me.value = (meUser.id || localStorage.getItem('uid') || me.value || '') as string
      const peer = Array.isArray(users) ? users.find((u: any) => u.id === peerId.value) : null
      peerGender.value = (peer?.gender || 'other') as Gender
      peerNickname.value = peer?.nickname || ''
    } else {
      // 游客：无论是否与客服会话，都设置临时 uid，保证 socket 回显匹配
      const { data: users } = await api.get('/api/users')
      const isSupport = peerId.value === 'support'
      const pid = isSupport ? 'support' : peerId.value
      const peer = Array.isArray(users) ? users.find((u: any) => u.id === pid) : null
      peerGender.value = (peer?.gender || 'other') as Gender
      myGender.value = 'other'
      me.value = `guest:${guestId.value}`
      if (isSupport) peerNickname.value = ''
    }
  } catch {}
}

// ========== 搜索与最近会话 ==========
type UserLite = { id: string; nickname?: string; gender?: Gender }
const activeTab = ref<'search'|'chat'>('chat')
const searchKey = ref('')
const searching = ref(false)
const allUsers = ref<UserLite[]>([])
const searchResults = ref<UserLite[]>([])
const recentList = ref<Array<{ peerId: string; lastAt: number; lastContent: string; unread: number; peer: UserLite }>>([])

async function preloadUsers(){
  try{
    const { data } = await api.get('/api/users')
    const list = Array.isArray(data) ? data : []
    // 过滤掉自己与客服账号
    const my = localStorage.getItem('uid')
    allUsers.value = list.filter((u:any)=> u && u.id && u.id !== my && u.id !== 'support')
  }catch{}
}

async function fetchRecent(){
  try{
    const { data } = await api.get('/api/messages/recent')
    recentList.value = data?.list || []
  }catch{}
}

function normalize(s:string){ return (s||'').toLowerCase() }
let searchTimer:number|undefined
function onSearchInput(){
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(doSearch, 200)
}
function doSearch(){
  const key = normalize(searchKey.value)
  if (!key){ searchResults.value = []; return }
  searching.value = true
  // 本地过滤（如需可切换为服务端模糊查询）
  const res = allUsers.value.filter(u => normalize(u.nickname||u.id).includes(key)).slice(0, 20)
  searchResults.value = res
  searching.value = false
}
function openChatWith(uid: string){
  activeTab.value = 'chat'
  // 跳转到该用户会话
  window.setTimeout(()=>{ location.hash = '#/chat/' + encodeURIComponent(uid) }, 0)
}

function isToday(ts:number){ const d=new Date(ts); const n=new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate() }
function isYesterday(ts:number){ const n=new Date(); const y=new Date(n.getFullYear(), n.getMonth(), n.getDate()-1); const d=new Date(ts); return d.getFullYear()===y.getFullYear() && d.getMonth()===y.getMonth() && d.getDate()===y.getDate() }
function formatTime(ts:number){ const d=new Date(ts); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${m}-${day}` }
function formatRelative(ts:number){ if(isToday(ts)) return t('chat.time.today'); if(isYesterday(ts)) return t('chat.time.yesterday'); return formatTime(ts) }

watch(() => route.params.id, async () => {
  await Promise.all([loadHistory(), loadGenders()])
  // 切换会话时也标记已读
  if (!isGuestSupport.value && peerId.value) {
    api.post('/api/messages/read', { peerId: peerId.value }).then(()=>{
      window.dispatchEvent(new Event('conv-read'))
    }).catch(()=>{})
  }
  // 切换到某个会话后，自动切回聊天页签
  activeTab.value = 'chat'
})

// ====== 跨页联动：Lucky 或其他页面可通过全局函数唤起会员弹窗 ======
function openVipNow(){
  const fn = (window as any).__openVipModal
  if (typeof fn === 'function') fn()
  else router.push('/settings')
}
</script>

<style scoped>
/* 充满视口的固定背景层 */
.chat-bg{ background: url('/backgrounds/chat-bg.jpg') center/cover no-repeat fixed; }
.chat-body{ background: radial-gradient(1200px 600px at 50% 0%, rgba(255,255,255,.65), rgba(255,255,255,.45)); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.chat-input{ background: rgba(255,255,255,0.68); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }

/* 标签条样式（参考草图） */
.tab-bar{ display:flex; gap:0; border-bottom:1px solid #e5e7eb; }
.tab{ padding:10px 14px; font-weight:700; color:#6b7280; border-right:1px solid #e5e7eb; cursor:pointer; user-select:none; }
.tab:hover{ background:#f9fafb; }
.tab.active{ color:#111827; position:relative; }
.tab.active::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:3px; background: var(--brand-main, #e67a88); }

/* 底部工具圆按钮与发送 */
.circle-icon{ width:36px; height:36px; border-radius:50%; border:1.5px solid #e5e7eb; display:grid; place-items:center; background:#fff; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,.06); }
.circle-icon:hover{ background:#f9fafb; }
.send-btn{ background: var(--brand-main, #e67a88); color:#fff; font-weight:800; border:2px solid rgba(255,255,255,.5); box-shadow:0 6px 16px rgba(230,122,136,.35); }

/* emoji-button 轻样式适配 */
:global(.emoji-picker){ box-shadow: 0 10px 30px rgba(0,0,0,.15); border-radius:12px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.send-btn:hover{ filter: brightness(1.06); }

/* 新：居中悬浮输入气泡（更聚焦） */
.composer{ max-width: 920px; margin: 0 auto; display:flex; align-items:center; gap:10px; padding:6px; border-radius:999px; background:#fff; border:1px solid #e5e7eb; box-shadow:0 6px 20px rgba(0,0,0,.06); }
.composer:focus-within{ box-shadow:0 10px 26px rgba(0,0,0,.10); border-color:#e4e4e7; }
.composer input::placeholder{ color:#b8bcc3; }

/* 语言菜单（底部更多按钮） */
.lang-menu{ background:#fff; color:#111; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.14); padding:8px; width:180px; z-index:10010; }
.lang-menu .tip{ position:absolute; bottom:-7px; right:12px; width:14px; height:14px; background:#fff; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; transform:rotate(45deg); }
.lang-menu .group-title{ font-size:12px; color:#64748b; font-weight:800; padding:4px 10px 6px; }
.lang-menu .menu-item{ width:100%; text-align:left; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:8px; font-weight:800; color:#111; }
.lang-menu .menu-item:hover{ background:#f9fafb; }
.lang-menu .menu-item.active{ background:#fff5f7; color: var(--brand-main, #e67a88); }
.lang-menu .menu-item.toggle{ cursor:pointer; }
.lang-menu .menu-item.toggle input{ accent-color: var(--brand-main, #e67a88); }
.lang-menu .divider{ height:1px; background:#f1f5f9; margin:6px 4px; border-radius:999px; }

/* 双语气泡内排版 */
.line-1{ font-weight:700; line-height:1.3; }
.line-2{ margin-top:2px; font-size:12px; line-height:1.25; opacity:.9; }
.line-2.muted{ opacity:.7; font-style:italic; }

/* 客服头像：与右上角 SupportButton 保持一致视觉（粉底 + 荧光绿描边） */
.cs-support-avatar{ display:inline-grid; place-items:center; border-radius:50%; background: var(--brand-pink, #f17384);
  box-shadow: 0 0 0 2px var(--brand-pink-deep, #ea6f82), 0 0 0 6px var(--brand-ring, #b6ff3f); color:#fff; }
.cs-support-avatar svg{ width: 70%; height: 70%; display:block; }
.cs-support-avatar.cs-sm{ width:28px; height:28px; }
.cs-support-avatar.cs-md{ width:38px; height:38px; }

/* 搜索面板样式 */
.tab-bar .tab--search{ flex:0 0 18.75%; }
.tab-bar .tab.active{ flex:1 1 auto; }
/* 顶部内嵌搜索框（风格近似导航） */
.navlike-search{ position:relative; display:flex; align-items:center; height:34px; }
.navlike-search input{ width:100%; height:34px; border:1px solid #e5e7eb; border-radius:999px; padding:0 40px 0 12px; background:#fff; color:#333; font-weight:600; font-size:13px; }
.navlike-search input::placeholder{ color:#bfbfbf; }
.navlike-search .go{ position:absolute; right:4px; top:50%; transform:translateY(-50%); width:28px; height:28px; border-radius:50%; border:0; background:#fff; color:#999; display:grid; place-items:center; box-shadow:0 1px 2px rgba(0,0,0,.06); }

/* 新布局：侧栏 + 聊天区（左列宽度为之前的 3/4 ≈ 18.75%） */
.content-grid{ display:grid; grid-template-columns: 18.75% 1fr; gap:0; padding:0; }
.side-col{ min-height:0; overflow:auto; padding:12px; }
.chat-col{ min-height:0; border-left:1px solid #e5e7eb; }

/* 列表样式沿用 */
.result-list{ display:flex; flex-direction:column; gap:8px; }
.result-item{ display:flex; align-items:center; gap:10px; border:1px solid #eef2f7; border-radius:12px; padding:8px; background:#fff; transition:background .15s ease, box-shadow .15s ease; }
.result-item:hover{ background:#fafafa; box-shadow:0 2px 10px rgba(0,0,0,.04); }
.ri-main{ flex:1; min-width:0; }
.ri-name{ font-weight:800; color:#111; font-size:13px; line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.ri-sub{ font-size:10.5px; color:#64748b; font-weight:600; margin-top:1px; word-break:break-all; }
.ri-btn{ height:30px; padding:0 10px; border-radius:999px; background:#f9fafb; border:1px solid #e5e7eb; font-weight:800; white-space:nowrap; }

.recent-head{ font-weight:900; color:#111; margin:6px 2px; font-size:13px; }
.recent-list{ display:flex; flex-direction:column; gap:8px; }
.recent-item{ display:flex; align-items:center; gap:10px; border:1px solid #eef2f7; border-radius:12px; padding:8px; cursor:pointer; background:#fff; transition:background .15s ease, box-shadow .15s ease; }
.recent-item:hover{ background:#fafafa; box-shadow:0 2px 10px rgba(0,0,0,.04); }
.rc-main{ flex:1; min-width:0; }
.rc-top{ display:flex; align-items:center; justify-content:space-between; color:#111; }
.rc-name{ font-weight:800; font-size:13px; line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.rc-time{ font-size:11px; color:#94a3b8; font-weight:700; margin-left:8px; white-space:nowrap; }
.rc-msg{ color:#6b7280; font-size:11.5px; line-height:1.3; margin-top:2px; display:-webkit-box; -webkit-line-clamp:2; line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; word-break:break-word; font-weight:600; }
.rc-unread{ min-width:18px; height:18px; padding:0 4px; border-radius:999px; background:#ef4444; color:#fff; font-size:11px; line-height:18px; text-align:center; font-weight:900; box-shadow:0 0 0 2px #fff; }
.result-list{ display:flex; flex-direction:column; gap:10px; margin-top:10px; }
.recent-wrap{ background:#fff; border:1px solid #eef2f7; border-radius:12px; padding:10px; }
.rc-unread{ min-width:18px; height:18px; padding:0 4px; border-radius:999px; background:#ef4444; color:#fff; font-size:11px; line-height:18px; text-align:center; font-weight:900; box-shadow:0 0 0 2px #fff; }
/* 礼物卡片样式（弹窗内复用） */
.g-card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:10px; display:flex; flex-direction:column; gap:10px; box-shadow:0 4px 14px rgba(0,0,0,.06); }
.g-thumb{ display:grid; place-items:center; height:110px; background:linear-gradient(135deg,#fff5f7,#fef3c7); border-radius:12px; overflow:hidden; }
.g-thumb img{ width:74px; height:74px; object-fit:contain; }
.g-meta{ display:flex; align-items:center; justify-content:space-between; font-weight:800; }
.g-name{ color:#111827; font-size:14px; }
.g-price{ color: var(--brand-main, #e67a88); font-size:14px; }
.g-send{ height:34px; border-radius:10px; background: var(--brand-main, #e67a88); color:#fff; font-weight:800; }
.g-send:hover{ filter:brightness(1.06); }

/* 选中文本翻译悬浮 UI */
.seltr-wrap{ pointer-events:auto; }
.seltr-box{ background:#fff; border:1px solid #e5e7eb; border-radius:999px; box-shadow:0 8px 24px rgba(0,0,0,.12); display:flex; align-items:center; position:relative; }
.seltr-btn{ padding:8px 14px; font-weight:800; background:transparent; border:0; border-radius:999px; cursor:pointer; }
.seltr-btn:hover{ background:#f9fafb; }
.seltr-lang{ position:absolute; top:calc(100% + 6px); left:0; background:#fff; border:1px solid #e5e7eb; border-radius:10px; box-shadow:0 10px 28px rgba(0,0,0,.14); padding:6px; display:flex; gap:6px; }
.seltr-lang .lang-item{ padding:6px 10px; border-radius:8px; border:0; background:#fff; font-weight:700; cursor:pointer; }
.seltr-lang .lang-item:hover{ background:#f1f5f9; }
.seltr-result{ margin-top:8px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.14); overflow:hidden; }
.seltr-result .content{ padding:10px 12px; font-weight:700; max-width: 60vw; max-height: 40vh; overflow:auto; }
.seltr-result .actions{ display:flex; justify-content:flex-end; gap:8px; padding:8px; border-top:1px solid #f1f5f9; }
.seltr-result .actions button{ padding:6px 10px; border-radius:8px; border:0; background:#f8fafc; font-weight:800; }
.seltr-result .actions button:hover{ background:#eef2f7; }

/* 礼物气泡面板（锚定按钮） */
.gift-popover{ width: 460px; background:#fff; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 14px 34px rgba(0,0,0,.16); z-index:10020; overflow:hidden; }
.gift-popover .gp-head{ display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #f1f5f9; }
.gift-popover .gp-title{ font-weight:900; color:#111827; display:flex; align-items:center; gap:6px; }
.gift-popover .gp-title .emoji{ font-size:18px; }
.gift-popover .gp-close{ width:28px; height:28px; border-radius:50%; border:0; background:#f8fafc; }
.gift-popover .gp-close:hover{ background:#eef2f7; }
.gift-popover .gp-body{ max-height: 360px; overflow:auto; padding:10px; }
.gift-popover .gp-loading,.gift-popover .gp-error{ padding:40px 0; text-align:center; color:#64748b; font-weight:700; }
.gift-popover .gp-grid{ display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; }
.gift-popover .gp-item{ display:flex; flex-direction:column; align-items:center; gap:6px; padding:8px; border:1px solid #eef2f7; border-radius:12px; background:#fff; cursor:pointer; }
.gift-popover .gp-item:hover{ background:#fafafa; box-shadow:0 2px 10px rgba(0,0,0,.04); }
.gift-popover .gp-item .thumb{ width:100%; height:96px; display:grid; place-items:center; background:linear-gradient(135deg,#fff5f7,#fef3c7); border-radius:10px; overflow:hidden; }
.gift-popover .gp-item .thumb img{ width:56px; height:56px; object-fit:contain; }
.gift-popover .gp-item .name{ font-weight:800; color:#111; font-size:13px; }
.gift-popover .gp-item .price{ color: var(--brand-main, #e67a88); font-weight:900; font-size:13px; }
.gift-popover .gp-foot{ border-top:1px solid #f1f5f9; padding:8px; display:flex; justify-content:flex-end; }
.gift-popover .gp-more{ border:0; background:#f8fafc; padding:8px 12px; border-radius:10px; font-weight:800; }
.gift-popover .gp-more:hover{ background:#eef2f7; }

/* 单条消息翻译菜单 */
.msgtr-menu{ background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.14); padding:8px; width:200px; }
.msgtr-menu .msgtr-head{ font-size:12px; color:#64748b; font-weight:800; padding:4px 8px 6px; }
.msgtr-menu .msgtr-list{ display:flex; flex-direction:column; gap:6px; }
.msgtr-menu .msgtr-item{ text-align:left; padding:8px 10px; border-radius:8px; border:0; background:#fff; font-weight:800; }
.msgtr-menu .msgtr-item:hover{ background:#f9fafb; }
</style>

<style>
/* 背景完全由后端返回的 URL 控制，不再从前端写死 */
/* 全局：emoji 选择器外观适配（最小化样式，避免直接依赖包内 CSS 路径） */
.emoji-picker{ box-shadow: 0 10px 30px rgba(0,0,0,.15); border-radius:12px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); background:#fff; border:1px solid rgba(17,24,39,0.06); }
.emoji-picker .emoji-picker__search-container{ padding:8px; border-bottom:1px solid rgba(17,24,39,0.06); }
.emoji-picker .emoji-picker__search{ width:100%; height:32px; border:1px solid #e5e7eb; border-radius:8px; padding:0 10px; }
.emoji-picker .emoji-picker__category-buttons{ display:flex; gap:6px; padding:6px; border-bottom:1px solid rgba(17,24,39,0.06); }
.emoji-picker .emoji-picker__emojis{ max-height:260px; overflow:auto; padding:6px; display:grid; grid-template-columns: repeat(8, 1fr); gap:6px; }
.emoji-picker .emoji-picker__emoji{ display:grid; place-items:center; width:32px; height:32px; border-radius:6px; cursor:pointer; }
.emoji-picker .emoji-picker__emoji:hover{ background:#f3f4f6; }
</style>
