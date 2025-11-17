<template>
  <div class="chat-page relative min-h-[calc(100vh-72px)]">
    <!-- 鑳屾櫙灞傦細鍥哄畾鍏呮弧瑙嗗彛锛岀‘淇濆湪浠讳綍灞忓箷涓婇兘鑳界湅鍒拌儗鏅浘 -->
    <div class="chat-bg fixed inset-0 z-0"></div>
    <div class="relative z-10 container mx-auto px-2 py-4">
      <div class="grid grid-cols-12 gap-3">
        <!-- 宸﹀垪锛氳亰澶╅潰鏉匡紙瀹㈡湇妯″紡涓嬫按骞冲眳涓級 -->
        <div :class="['col-span-12 min-h-0', isSupportSimple ? 'max-w-[696px] w-full mx-auto' : 'lg:col-span-9']">
          <div :class="['flex flex-col min-h-0 chat-card overflow-hidden rounded-2xl border bg-white/65 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,.12)]', 'h-[calc(100vh-72px-32px)]']">
            <!-- 椤堕儴鏉★細宸︿晶涓哄彲鎼滅储杈撳叆妗嗭紙鍗?1/4 瀹藉害锛夛紝鍙充晶涓哄綋鍓嶄細璇濇爣棰?-->
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
              <!-- 客服头像：优先使用图片，失败时回退到耳机图标 -->
              <template v-if="supportAvatarOk">
                <img :src="SUPPORT_AVATAR_URL" alt="support avatar" class="cs-support-photo cs-md" @error="onSupportImgError" />
              </template>
              <template v-else>
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
              </template>
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-gray-800 truncate">{{ t('nav.contactService') }}</h3>
                  <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{{ t('chat.support.online') }}</span>
                </div>
                <p class="text-xs text-gray-500 leading-snug">{{ t('chat.support.subtitle') }}</p>
              </div>
            </div>
            <div v-if="!isSupportSimple" class="flex-1 min-h-0 content-grid">
              <aside class="side-col">
                <!-- 鎼滅储缁撴灉浼樺厛锛屽惁鍒欏睍绀虹粡甯歌亰澶?-->
                <template v-if="searching">
                  <div class="muted text-sm">{{ t('chat.search.searching') }}</div>
                </template>
                <template v-else-if="searchKey">
                  <div v-if="searchResults.length" class="result-list">
                    <div v-for="u in searchResults" :key="u.id" class="result-item">
                      <AvatarImg :src="(u as any).avatarUrl || ''" :gender="(u.gender as any)" :size="36" />
                      <div class="ri-main">
                        <div class="ri-name" :title="u.nickname || u.id">{{ u.nickname || u.id }}</div>
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
                      <AvatarImg :src="(c.peer as any).avatarUrl || ''" :gender="(c.peer.gender as any)" :size="34" />
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
              <div class="chat-col flex flex-col min-h-0">
                <div ref="chatBody" class="flex-1 min-h-0 overflow-auto px-0 py-3 space-y-2 chat-body">
                  <!-- 绌烘€佹彁绀猴紙浠呭鏈嶄細璇濆睍绀猴紱鏅€氱敤鎴蜂細璇濅笉灞曠ず锛?-->
                  <div v-if="messages.length === 0 && peerId==='support'" class="flex flex-col items-center justify-center h-[40vh] text-gray-500">
                    <div class="text-4xl mb-2">😊</div>
                    <p class="font-semibold">{{ t('chat.support.hello') }}</p>
                    <p class="text-sm">{{ t('chat.support.subtitle') }}</p>
                  </div>
                  <div v-else v-for="m in messages" :key="m.id" class="flex items-end" :class="m.fromUserId===me ? 'justify-end' : 'justify-start'">
                    <!-- 宸︿晶锛氬鏂规秷鎭ご鍍?-->
                    <div v-if="m.fromUserId!==me" class="mr-2">
                      <template v-if="isSupportSimple">
                        <template v-if="supportAvatarOk">
                          <img :src="SUPPORT_AVATAR_URL" alt="support avatar" class="cs-support-photo cs-sm" @error="onSupportImgError" />
                        </template>
                        <template v-else>
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
                      </template>
                      <template v-else>
                        <AvatarImg :src="peerAvatarUrl" :gender="peerGender" :size="50" :alt="'peer avatar'" />
                      </template>
                    </div>
                    <!-- 娑堟伅姘旀场 -->
                    <span class="inline-block max-w-[75%] rounded-xl px-3 py-2 break-words shadow-sm"
                      :class="m.fromUserId===me ? 'bg-main text-white' : 'bg-white/90 border border-gray-200'">
                      <div @click.stop="openMsgTrMenu($event, m)">
                        <template v-if="!shouldShowDual(m)">
                      <template v-if="isImageMessage(m)">
                        <img :src="getImageSrc(m)" alt="image" class="chat-img" @load="onImageLoaded" @click.stop="openPreview(m)" />
                      </template>
                      <template v-else>
                        {{ loadingAnyTranslation(m) ? getTranslatingLabel(m) : (isAnyTranslationFailed(m) ? failedLabel : (getAnyTranslation(m) || displayContent(m))) }}
                      </template>
                    </template>
                        <template v-else>
                      <div class="line-1">
                        <template v-if="isImageMessage(m)"><img :src="getImageSrc(m)" alt="image" class="chat-img" @load="onImageLoaded" @click.stop="openPreview(m)" /></template>
                        <template v-else>{{ getAnyTranslation(m) || displayContent(m) }}</template>
                      </div>
                          <div class="line-2" :class="{muted: !hasAnyTranslation(m)}">{{ hasAnyTranslation(m) ? m.content : (loadingAnyTranslation(m) ? getTranslatingLabel(m) : (isAnyTranslationFailed(m) ? failedLabel : m.content)) }}</div>
                        </template>
                      </div>
                    </span>
                    <!-- 鍙充晶锛氭垜鐨勬秷鎭ご鍍?-->
                    <div v-if="m.fromUserId===me" class="ml-2">
                      <AvatarImg :src="myAvatarUrl" :gender="myGender" :size="50" :alt="'my avatar'" />
                    </div>
                  </div>
                </div>
                <!-- 搴曢儴杈撳叆鍖猴細浠呭崰鍙充晶鍒楀搴?-->
                <form class="px-3 md:px-4 py-3 md:py-4 border-t chat-input bg-white/70 backdrop-blur-lg shrink-0" @submit.prevent="send">
                  <div v-if="limitReached" class="mb-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 flex items-center justify-between gap-3">
                    <div class="text-sm font-semibold truncate">{{ t('chat.limit.upgradeToUnlock') }}</div>
                    <button type="button" class="rounded bg-amber-400 text-white text-sm font-bold px-3 py-1.5 hover:brightness-105" @click="openVipNow">{{ t('chat.limit.cta') }}</button>
                  </div>
                  <div class="composer">
                    <textarea
                      ref="msgInput"
                      v-model="content"
                      :placeholder="t('chat.placeholder')"
                      rows="1"
                      @input="autoResize"
                      @keydown.enter.exact.prevent="onEnterSend($event)"
                      @keydown.enter.shift.stop
                      class="flex-1 px-3 py-2 text-[15px] outline-none bg-transparent resize-none overflow-hidden leading-[1.35] max-h-[140px]"
                    />
                    <div class="tools relative flex items-center gap-2">
                      <button type="button" class="circle-icon" aria-label="emoji" ref="emojiBtn" @click.stop="toggleEmoji($event)" @mousedown.stop>😊</button>
                      <button type="button" class="circle-icon" aria-label="image" @click="onImageClick">🖼️</button>
                      <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="onImageSelected" />
                      <button type="button" class="circle-icon" aria-label="gift" ref="giftBtn" @click.stop="toggleGift($event)">🎁</button>
                      <button type="button" class="circle-icon" aria-label="more" ref="moreBtn" @click="toggleLangMenu($event)">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 20 4" aria-hidden="true">
                          <circle cx="2" cy="2" r="2"></circle>
                          <circle cx="10" cy="2" r="2"></circle>
                          <circle cx="18" cy="2" r="2"></circle>
                        </svg>
                      </button>
                    </div>
                    <button class="send-btn rounded-full px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="sendDisabled">{{ t('chat.send') }}</button>
                  </div>
                </form>
            <teleport to="body">
              <div
                v-if="langMenuOpen"
                ref="langMenuRef"
                class="lang-menu"
                :class="{ 'is-below': langMenuBelow }"
                :style="langMenuStyle"
              >
                <div class="tip" aria-hidden="true" :style="{ left: langMenuTipLeft + 'px' }"></div>
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
            </teleport>

              </div>
            </div>
            <div v-else ref="chatBody" class="flex-1 min-h-0 overflow-auto px-4 py-3 space-y-2 chat-body">
              <!-- 绌烘€佹彁绀猴紙鏃犲巻鍙叉秷鎭椂锛?-->
              <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-[40vh] text-gray-500">
                <div class="text-4xl mb-2">😊</div>
                <p class="font-semibold">{{ t('chat.support.hello') }}</p>
                <p class="text-sm">{{ t('chat.support.subtitle') }}</p>
              </div>
              <div v-else v-for="m in messages" :key="m.id" class="flex items-end" :class="m.fromUserId===me ? 'justify-end' : 'justify-start'">
                <!-- 宸︿晶锛氬鏂规秷鎭ご鍍?-->
                <div v-if="m.fromUserId!==me" class="mr-2">
                  <template v-if="isSupportSimple">
                    <template v-if="supportAvatarOk">
                      <img :src="SUPPORT_AVATAR_URL" alt="support avatar" class="cs-support-photo cs-sm" @error="onSupportImgError" />
                    </template>
                    <template v-else>
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
                  </template>
                  <template v-else>
                    <AvatarImg :src="peerAvatarUrl" :gender="peerGender" :size="50" :alt="'peer avatar'" />
                  </template>
                </div>
                <!-- 娑堟伅姘旀场 -->
                <span class="inline-block max-w-[75%] rounded-xl px-3 py-2 break-words shadow-sm"
                  :class="m.fromUserId===me ? 'bg-main text-white' : 'bg-white/90 border border-gray-200'">
                  <div @click.stop="openMsgTrMenu($event, m)">
                    <template v-if="!shouldShowDual(m)">
                      <template v-if="isImageMessage(m)">
                        <img :src="getImageSrc(m)" alt="image" class="chat-img" @load="onImageLoaded" @click.stop="openPreview(m)" />
                      </template>
                      <template v-else>
                        {{ loadingAnyTranslation(m) ? getTranslatingLabel(m) : (isAnyTranslationFailed(m) ? failedLabel : (getAnyTranslation(m) || displayContent(m))) }}
                      </template>
                    </template>
                    <template v-else>
                      <div class="line-1">{{ getAnyTranslation(m) || displayContent(m) }}</div>
                      <div class="line-2" :class="{muted: !hasAnyTranslation(m)}">{{ hasAnyTranslation(m) ? m.content : (loadingAnyTranslation(m) ? getTranslatingLabel(m) : (isAnyTranslationFailed(m) ? failedLabel : m.content)) }}</div>
                    </template>
                  </div>
                </span>
                <!-- 鍙充晶锛氭垜鐨勬秷鎭ご鍍?-->
                <div v-if="m.fromUserId===me" class="ml-2">
                  <AvatarImg :src="myAvatarUrl" :gender="myGender" :size="50" :alt="'my avatar'" />
                </div>
              </div>
            </div>
            <!-- 搴曢儴杈撳叆鍖猴紙浠呮枃瀛楄緭鍏ワ紱瀹㈡湇绠€鍖栨ā寮忔樉绀哄湪鏁村涓嬫柟锛?-->
            <form v-if="isSupportSimple" class="p-3 md:p-4 border-t chat-input bg-white/70 backdrop-blur-lg shrink-0" @submit.prevent="send">
              <div v-if="limitReached" class="mb-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 flex items-center justify-between gap-3">
                <div class="text-sm font-semibold truncate">{{ t('chat.limit.upgradeToUnlock') }}</div>
                <button type="button" class="rounded bg-amber-400 text-white text-sm font-bold px-3 py-1.5 hover:brightness-105" @click="openVipNow">{{ t('chat.limit.cta') }}</button>
              </div>
              <div class="composer">
                <textarea ref="msgInput" v-model="content" :placeholder="t('chat.placeholder')" rows="1"
                          @input="autoResize" @keydown.enter.exact.prevent="onEnterSend($event)" @keydown.enter.shift.stop
                          class="flex-1 px-3 py-2 text-[15px] outline-none bg-transparent resize-none overflow-hidden leading-[1.35] max-h-[140px]" />
                <button class="send-btn rounded-full px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="sendDisabled">{{ t('chat.send') }}</button>
              </div>
            </form>
          </div>
        </div>

  <!-- 鍙冲垪锛氱ぜ鐗╀笌浼氬憳浜ゅ弸鐗规潈锛堝鏈嶆ā寮忛殣钘忥級 -->
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
              <li class="flex gap-2"><span class="text-xl">🏅</span><div>{{ t('chat.side.vip.benefit1') }}</div></li>
              <li class="flex gap-2"><span class="text-xl">👀</span><div>{{ t('chat.side.vip.benefit2') }}</div></li>
              <li class="flex gap-2"><span class="text-xl">💬</span><div>{{ t('chat.side.vip.benefit3') }}</div></li>
              <li class="flex gap-2"><span class="text-xl">❤️</span><div>{{ t('chat.side.vip.benefit4') }}</div></li>
            </ul>
            <button class="mt-3 w-full rounded bg-amber-400 text-white py-2 hover:brightness-105" type="button" @click="openVipNow">{{ t('chat.side.vip.cta') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 图片预览 Lightbox -->
  <teleport to="body">
    <div v-if="previewOpen" class="img-preview-overlay" @click.self="closePreview">
      <div class="ip-box" role="dialog" aria-modal="true">
        <button type="button" class="ip-close" @click="closePreview" aria-label="close">✖</button>
        <div class="ip-stage">
          <!-- 始终渲染图片以触发 load 事件；出错时隐藏并显示错误文案 -->
          <img v-if="!previewError" :src="currentPreviewSrc" :alt="currentPreviewAlt" @load="onPreviewLoaded" @error="onPreviewError" />
          <div v-if="previewError" class="ip-error">{{ previewError }}</div>
          <div v-else-if="previewLoading" class="ip-loading">{{ t('common.loading') }}</div>
        </div>
        <div class="ip-nav" v-if="previewImages.length>1">
          <button type="button" class="ip-btn prev" @click="prevPreview" :disabled="previewImages.length<=1">◀</button>
          <span class="ip-count">{{ previewIndex+1 }} / {{ previewImages.length }}</span>
          <button type="button" class="ip-btn next" @click="nextPreview" :disabled="previewImages.length<=1">▶</button>
        </div>
      </div>
    </div>
  </teleport>
  <!-- 绀肩墿鍟嗗煄妯℃€佹锛坱eleport 鍒?body锛岃鐩栧叏灞€锛?-->
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
            <button type="button" class="circle-icon" aria-label="close" @click="closeGiftModal"></button>
          </div>
          <div class="gm-body p-4">
            <div v-if="giftLoading" class="text-center py-10 text-gray-500">{{ t('common.loading') }}</div>
            <div v-else-if="giftError" class="text-center py-10 text-red-500">{{ giftError }}</div>
            <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div v-for="g in giftCatalog" :key="g.id" class="g-card">
                <div class="g-thumb"><img :src="g.img" :alt="g.name" /></div>
                <div class="g-meta">
                  <div class="g-name">{{ g.name }}</div>
                  <div class="g-price">楼 {{ g.price }}</div>
                </div>
                <button class="g-send" type="button" @click="sendGift(g)">{{ t('chat.gift.send') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 绀肩墿姘旀场闈㈡澘锛堥敋瀹氬埌绀肩墿鎸夐挳锛岀被浼艰〃鎯呴潰鏉匡級 -->
  <teleport to="body">
    <div v-if="giftOpen" class="gift-popover" ref="giftPanelRef">
      <div class="gp-head">
  <div class="gp-title"><span class="emoji">🎁</span> {{ t('chat.side.gift.title') }}</div>
        <button type="button" class="gp-close" @click="closeGiftPanel"></button>
      </div>
      <div class="gp-body">
        <div v-if="giftLoading" class="gp-loading">{{ t('common.loading') }}</div>
        <div v-else-if="giftError" class="gp-error">{{ giftError }}</div>
        <div v-else class="gp-grid">
          <button v-for="g in giftCatalog" :key="g.id" class="gp-item" type="button" @click="sendGiftAndClose(g)">
            <div class="thumb"><img :src="g.img" :alt="g.name" /></div>
            <div class="name" :title="g.name">{{ g.name }}</div>
            <div class="price">楼 {{ g.price }}</div>
          </button>
        </div>
      </div>
      <div class="gp-foot">
        <button type="button" class="gp-more" @click="openGiftModalFromPanel">{{ t('chat.gift.openMall') }}</button>
      </div>
    </div>
  </teleport>

  <!-- 鏂囨湰閫夋嫨锛氱炕璇戞偓娴彍鍗曚笌缁撴灉 -->
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
  <div class="content">{{ selLoading ? getTranslatingLabel() : selResult }}</div>
    <div class="content">{{ selLoading ? getTranslatingLabel() : selResult }}</div>
        <div class="actions">
          <button type="button" @click="copySelResult">{{ copyLabel }}</button>
          <button type="button" @click="closeSelPanel">{{ closeLabel }}</button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- 鍗曟潯娑堟伅锛氱炕璇戣彍鍗曪紙鐐瑰嚮姘旀场寮瑰嚭锛?-->
  <teleport to="body">
    <div v-if="msgTrOpen" class="msgtr-menu fixed z-[126]" :style="{ left: msgTrPos.left+'px', top: msgTrPos.top+'px' }">
      <div class="msgtr-head">{{ t('chat.menu.translateTo') }}</div>
      <div class="msgtr-list">
        <button v-for="opt in LANG_OPTIONS" :key="opt.code" type="button" class="msgtr-item" @click="translateMsgTo(opt.code)">{{ opt.label }}</button>
      </div>
    </div>
  </teleport>

  <!-- 快捷内容文本框：仅在后端开启时显示，位于右下角浮动 -->
  <div v-if="quickEnabled" class="quickbox fixed right-3 md:right-5 bottom-[92px] md:bottom-[108px] z-[60]">
    <div class="qb-panel" v-show="quickOpen">
      <div class="qb-head">
        <div class="qb-title">快捷内容</div>
        <div class="qb-actions">
          <button type="button" class="qb-btn" title="编辑" @click="startQuickEdit">✏️</button>
          <button type="button" class="qb-btn" title="关闭" @click="quickOpen=false">✖</button>
        </div>
      </div>
      <div class="qb-body" v-if="!quickEditing">
        <template v-if="quickPhrases.length">
          <button type="button" v-for="(p, i) in quickPhrases" :key="i" class="qb-chip" @click="insertQuick(p)">{{ p }}</button>
        </template>
        <div v-else class="qb-empty">暂无内容，点击右上角编辑添加。</div>
      </div>
      <div class="qb-edit" v-else>
        <textarea v-model="quickDraft" class="qb-textarea" :placeholder="'一行一句，回车分隔'" rows="6"></textarea>
        <div class="qb-foot">
          <button type="button" class="qb-save" :disabled="quickSaving" @click="saveQuick">保存</button>
          <button type="button" class="qb-cancel" :disabled="quickSaving" @click="cancelQuickEdit">取消</button>
        </div>
        <div v-if="quickError" class="qb-error">{{ quickError }}</div>
      </div>
    </div>
    <button type="button" class="qb-toggle" @click="toggleQuick">
      <span>快捷内容</span>
      <small v-if="quickPhrases.length" class="qb-count">{{ quickPhrases.length }}</small>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, nextTick } from 'vue';
// emoji 閫夋嫨鍣ㄦ牱寮忥紙纭繚寮瑰眰鍙涓庡竷灞€姝ｅ父锛?
// 娉細鏃х増 emoji-button 鐨?CSS 璺緞鍦ㄤ笉鍚岀増鏈樊寮傝緝澶э紝鐩存帴寮曞叆浼氬鑷存瀯寤哄け璐?
// 杩欓噷绉婚櫎鐩存帴 CSS 瀵煎叆锛岃浆鑰屼娇鐢ㄦ湰鏂囦欢涓殑杞婚噺鍏ㄥ眬鏍峰紡浠ヤ繚璇佸彲瑙佹€?
// 寮€婧愯〃鎯呴€夋嫨鍣紙emoji-button锛?
// 浼樺厛浣跨敤缁存姢涓殑 @joeattardi/emoji-button锛屽吋瀹规棫鍖呭悕 emoji-button
let EmojiButton: any | null = null
// 鐢变簬閮ㄥ垎娴忚鍣?鐜涓嬬涓夋柟 emoji-button 鍦ㄥ畾浣嶄笌鍏抽棴涓婂瓨鍦ㄥ吋瀹规€ч棶棰橈紝
// 杩欓噷榛樿鍏抽棴鍏朵娇鐢紝鏀逛负绋冲畾鐨勫唴缃潰鏉匡紱濡傞渶鍚敤鍙敼涓?true銆?
const USE_EMOJI_BUTTON = false
import { useI18n } from 'vue-i18n';
// 利用现有依赖 chinese-conv 做简繁转换回退，避免新增依赖
import { tify, sify } from 'chinese-conv';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
// 前端不再直接访问公共翻译实例，改由后端代理统一走 /api/content/translate
import { enqueueTranslation } from '../translationThrottle'
import { Socket } from 'socket.io-client';
import api from '../api';
import { getSocket } from '../socket';
import { useAuth } from '../stores';
import AvatarImg from '../components/AvatarImg.vue'

// 客服固定头像（仅用于聊天页，不影响导航栏图标）
// 固定客服头像：使用 public 目录静态资源；去掉查询参数避免某些环境下静态文件匹配失败
const SUPPORT_AVATAR_URL = '/images/customer-service-avatar.png'
const supportAvatarOk = ref(true)
function onSupportImgError(){ supportAvatarOk.value = false }

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
const ASCII_WHITESPACE_PATTERN = /[\u0009-\u000D\u0020\u00A0]/g;
const ASCII_EDGE_WHITESPACE_PATTERN = /^[\u0009-\u000D\u0020\u00A0]+|[\u0009-\u000D\u0020\u00A0]+$/g;

function hasSendableContent(text: string): boolean {
  if (!text) return false;
  return text.replace(ASCII_WHITESPACE_PATTERN, '').length > 0;
}

function trimAsciiEdgeWhitespace(text: string): string {
  return text.replace(ASCII_EDGE_WHITESPACE_PATTERN, '');
}

const canSend = computed(() => hasSendableContent(content.value));
const auth = useAuth();
const me = ref<string>(auth.uid || localStorage.getItem('uid') || '');
let socket: Socket | null = null;
const { t, locale } = useI18n();
const myGender = ref<Gender>('other')
const peerGender = ref<Gender>('other')
// 头像 URL（通过 AvatarImg 的缓存破坏参数与 me-avatar-updated 事件实现即时刷新）
const myAvatarUrl = ref<string>('')
const peerAvatarUrl = ref<string>('')
// 会员限制：普通会员每位用户仅可发送 3 条消息
const isVip = ref(false)
const sentByMeCount = computed(() => messages.value.filter(m => m.fromUserId === me.value).length)
const limitReached = computed(() => (peerId.value !== 'support') && !isVip.value && sentByMeCount.value >= 3)
const sendDisabled = computed(() => !canSend.value || limitReached.value)
// 仅在“未登录 + 客服”场景使用精简模式；其余情况（已登录或普通会话）使用常规聊天布局
const isGuestSupport = computed(() => !localStorage.getItem('token') && peerId.value === 'support')
const isSupportSimple = computed(() => isGuestSupport.value)
const guestId = computed(() => {
  const key = 'guestId';
  let id = localStorage.getItem(key);
  if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem(key, id); }
  return id;
})

// ======== 鑱婂ぉ缈昏瘧锛堣瑷€鑿滃崟 + 缂撳瓨锛?========
type TargetLang = 'zh-CN'|'zh-TW'|'en'|'ko'|'ja'
const LANG_OPTIONS: Array<{ code: TargetLang; label: string }> = [
  { code: 'zh-CN', label: '\u7b80\u4f53\u4e2d\u6587' },
  { code: 'zh-TW', label: '\u7e41\u9ad4\u4e2d\u6587' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '\ud55c\uad6d\uc5b4' },
  { code: 'ja', label: '\u65e5\u672c\u8a9e' }
]
const moreBtn = ref<HTMLElement | null>(null)
const langMenuRef = ref<HTMLElement | null>(null)
const langMenuOpen = ref(false)
const langMenuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })
const langMenuTipLeft = ref(0)
const langMenuBelow = ref(false)
const langTarget = ref<TargetLang | null>(null)
const dualMode = ref(false)
// 绠€鍗曠紦瀛橈細key = messageId + '|' + target
const translateCache = new Map<string, string>()
// 鐗堟湰鍙凤細姣忓綋鍐欏叆缂撳瓨鍚庤嚜澧炰互瑙﹀彂娓叉煋
const translateVersion = ref(0)
// 绠€鏄撳苟鍙戞睜锛氶檺鍒跺苟鍙戯紝鎻愰珮鏁翠綋閫熷害涓旈伩鍏嶇獊鍙戣繃澶氳姹?
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
// 鍗曟潯娑堟伅缈昏瘧鑿滃崟
const msgTrOpen = ref(false)
const msgTrPos = ref({ left: 0, top: 0 })
const msgTrTarget = ref<Message | null>(null)
// 鐢ㄦ埛閽堝鍗曟潯娑堟伅閫夋嫨鐨勭洰鏍囪瑷€
const msgTargetLang = new Map<string, TargetLang>()
// 璁板綍澶辫触 key锛歚messageId|target`
const translateFailed = new Set<string>()

function displayContent(m: Message){
  // 璇诲彇鐗堟湰鍙蜂綔涓轰緷璧栵紝纭繚缂撳瓨鏇存柊鍚庤Е鍙戦噸娓叉煋
  void translateVersion.value
  if (!langTarget.value) return m.content
const key = m.id + '|' + langTarget.value
  const t = translateCache.get(key)
  if (!dualMode.value) return t || m.content
  // 鍙岃妯″紡锛氳瘧鏂囦紭鍏堟樉绀猴紝涓嬩竴琛屾樉绀哄師鏂囷紱鑻ヨ瘧鏂囧皻鏈埌杈撅紝灞曠ず鍗犱綅
  if (t) return t
  return m.content
}

function getTranslation(m: Message): string | null {
  if (!langTarget.value) return null
  const key = m.id + '|' + langTarget.value
  return translateCache.get(key) || null
}
function hasTranslation(m: Message): boolean { return !!getTranslation(m) }
function loadingTranslation(m: Message): boolean { return !!langTarget.value && !hasTranslation(m) }

// ===== 鍗曟潯娑堟伅寮瑰嚭缈昏瘧鑿滃崟锛堜簲绉嶈瑷€锛?=====
function openMsgTrMenu(e: MouseEvent, m: Message){
  // 瀹氫綅鍒版皵娉′笂鏂?
  const t = e.currentTarget as HTMLElement
  const r = t.getBoundingClientRect()
  const pad = 8
  const top = Math.max(pad, r.top + window.scrollY - 44)
  const left = Math.min(window.innerWidth - 200, Math.max(pad, r.left + r.width/2 - 80))
  msgTrPos.value = { left, top }
  msgTrTarget.value = m
  msgTrOpen.value = true
  // 澶栭儴鐐瑰嚮鍏抽棴
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
  const key = m.id + '|' + code
  // 1) 鍏堣褰曠洰鏍囪瑷€骞跺叧闂彍鍗?-> 绔嬪嵆杩涘叆鈥滅炕璇戜腑鈥濈姸鎬?
  msgTargetLang.set(m.id, code)
  msgTrOpen.value = false
  translateVersion.value++
  if (typeof translateFailed !== 'undefined') translateFailed.delete(key)
  // 2) 鑻ユ棤缂撳瓨锛屽紓姝ユ媺鍙栫炕璇?
  if (!translateCache.has(key)){
    const srcGuess = detectLangForText(m.content)
    const sNorm = normLang(srcGuess)
    const tNorm = normLang(code)
    const t = (sNorm === tNorm) ? m.content : await translateTextSafe(m.content, srcGuess, code)
    if (t){ translateCache.set(key, t); translateVersion.value++ }
    else { if (typeof translateFailed !== 'undefined') translateFailed.add(key); translateVersion.value++ }
  }
}

// 鐢ㄤ簬鏈潯鍙岃灞曠ず鐨勪究鎹锋柟娉曪紙浼樺厛褰撳墠鑿滃崟鐩爣璇█锛屽叾娆″叏灞€璇█锛?
function resolveTargetForMsg(m?: Message): TargetLang | null{
  if (m && msgTargetLang.has(m.id)) return msgTargetLang.get(m.id) as TargetLang
  return (langTarget.value as TargetLang | null) || null
}
function getAnyTranslation(m: Message): string | null{
  void translateVersion.value
  const tgt = resolveTargetForMsg(m)
  if (!tgt) return null
  const key = m.id + '|' + tgt
  return translateCache.get(key) || null
}
function hasAnyTranslation(m: Message){ return !!getAnyTranslation(m) }
function loadingAnyTranslation(m: Message){
  void translateVersion.value
  const tgt = resolveTargetForMsg(m); if (!tgt) return false
  const key = m.id + '|' + tgt
  return !translateCache.has(key) && !(typeof translateFailed !== 'undefined' && translateFailed.has(key))
}
function isAnyTranslationFailed(m: Message){
  void translateVersion.value
  const tgt = resolveTargetForMsg(m); if (!tgt) return false
  const key = m.id + '|' + tgt
  return (typeof translateFailed !== 'undefined') && translateFailed.has(key)
}
function shouldShowDual(m: Message){
  // 浠呭綋鐢ㄦ埛寮€鍚€滃弻璇€濅笖瀛樺湪鐩爣璇█鏃讹紝浠ュ弻琛屾樉绀?
  return !!dualMode.value && !!resolveTargetForMsg(m)
}

function closeLangMenu(){
  // 修复：原实现递归调用自身导致无法关闭（第二次点击按钮弹窗不收回）
  if (!langMenuOpen.value) return
  langMenuOpen.value = false
  window.removeEventListener('click', onDocClickCloseLang)
  window.removeEventListener('resize', positionLangMenu)
}
function toggleLangMenu(e?: MouseEvent){
  e?.stopPropagation()
  if (langMenuOpen.value) {
    closeLangMenu()
    return
  }
  langMenuOpen.value = true
  nextTick(() => {
    positionLangMenu()
    window.addEventListener('resize', positionLangMenu, { passive: true })
  })
  window.removeEventListener('click', onDocClickCloseLang)
  window.addEventListener('click', onDocClickCloseLang)
}
function onDocClickCloseLang(ev: MouseEvent){
  const menu = langMenuRef.value
  const btn = moreBtn.value
  if (!menu) { closeLangMenu(); return }
  const target = ev.target as Node
  if (menu.contains(target) || (btn && btn.contains(target))) {
    return
  }
  closeLangMenu()
}
function positionLangMenu(){
  const menu = langMenuRef.value
  const btn = moreBtn.value
  if (!menu || !btn) return
  const pad = 12
  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuWidth = menu.offsetWidth || 0
  const menuHeight = menu.offsetHeight || 0
  const btnRect = btn.getBoundingClientRect()
  let left = btnRect.right - menuWidth
  left = Math.min(Math.max(left, pad), Math.max(pad, vw - menuWidth - pad))
  let top = btnRect.top - menuHeight - 12
  let below = false
  if (top < pad) {
    top = Math.min(btnRect.bottom + 12, vh - menuHeight - pad)
    below = true
  }
  langMenuBelow.value = below
  langMenuStyle.value = { top: `${Math.max(top, pad)}px`, left: `${left}px` }
  const tipPad = 18
  const tipCenter = btnRect.left + btnRect.width / 2 - left
  langMenuTipLeft.value = Math.min(menuWidth - tipPad, Math.max(tipPad, tipCenter))
}

async function chooseLang(code: TargetLang | null){
  langTarget.value = code
  closeLangMenu()
  // 切换目标语言后清除每条消息的临时“单条覆盖”选择，但保留缓存以便快速回显
  msgTargetLang.clear()
  translateVersion.value++
  if (!code) return
  // 自动逐条检测语言：支持混合语种对话逐条翻译
  const batch: Array<{ m: Message; key: string }> = []
  for (const m of messages.value){
    const key = m.id + '|' + code
    if (!translateCache.has(key)) {
      if (typeof translateFailed !== 'undefined') translateFailed.delete(key)
      batch.push({ m, key })
    }
  }
  if (!batch.length) return
  await runPool(batch, 6, async (item) => {
    const src = detectLangForText(item.m.content) // 单条消息源语言自动识别
    const sNorm = normLang(src as string)
    const tNorm = normLang(code)
    // 若源与目标归一化后相同（含 zh / zh-CN / zh-TW），执行必要的简繁转换或直接返回原文
    let translated: string | null
    if (sNorm === tNorm || (sNorm === 'zh' && (tNorm === 'zh-CN' || tNorm === 'zh-TW'))) {
      if (tNorm === 'zh-TW') translated = safeToTraditional(item.m.content)
      else if (tNorm === 'zh-CN') translated = safeToSimplified(item.m.content)
      else translated = item.m.content
    } else {
      translated = await translateTextSafe(item.m.content, src as any, code as any)
    }
    if (translated) { translateCache.set(item.key, translated); translateVersion.value++ }
    else { if (typeof translateFailed !== 'undefined') translateFailed.add(item.key); translateVersion.value++ }
    return null as any
  })
}

function guessSourceLang(): TargetLang | 'auto' {
  // 绠€鍖栵細鑻ュ寘鍚ぇ閲忎腑鏂囧瓧绗﹀垯璁や负鏄?zh-CN锛屽惁鍒?auto 浜ょ粰鏈嶅姟绔?
  const text = messages.value.slice(-10).map(m=>m.content).join('\n')
  const zhRatio = (text.match(/[\u4e00-\u9fa5]/g) || []).length / Math.max(1, text.length)
  if (zhRatio > 0.2) return 'zh-CN'
  return 'auto' as any
}

async function translateTextSafe(q: string, source: string, target: string){
  // 统一源语言：后端常见翻译服务对 zh-CN / zh-TW 均可能只接受 zh / auto
  const normSrc = (c: string) => {
    if (/^zh(-CN)?$/i.test(c)) return 'zh'
    if (/^zh-TW$/i.test(c)) return 'zh' // 作为源用 zh，提高成功率
    if (c === 'auto') return 'auto'
    return ({ 'en':'en','ja':'ja','ko':'ko' } as Record<string,string>)[c] || c
  }
  const normTgt = (c: string) => ({ 'zh-CN':'zh-CN','zh-TW':'zh-TW','en':'en','ja':'ja','ko':'ko' } as Record<string,string>)[c] || c
  const srcNorm = normSrc(source)
  const tgtNorm = normTgt(target)
  // 若语种实质相同（例如源检测为 zh，目标为 zh-CN），直接返回原文，避免“distinct languages”错误
  if (srcNorm === 'zh' && (tgtNorm === 'zh-CN' || tgtNorm === 'zh-TW')) {
    // 简繁之间仍尝试转换
    if (tgtNorm === 'zh-TW') return safeToTraditional(q)
    if (tgtNorm === 'zh-CN') return safeToSimplified(q)
    return q
  }
  if (srcNorm === tgtNorm) return q

  // 优先内置后端；若首次失败立即并行开源 Race 加速
  const MAX_ATTEMPTS = 3
  for (let attempt=0; attempt<MAX_ATTEMPTS; attempt++){
    try {
      const { data } = await enqueueTranslation(() => api.post('/api/content/translate', { q, source: srcNorm, target: tgtNorm, format: 'text' }))
      let t = data?.data?.translatedText || data?.data?.translation || null
      if (typeof t === 'string'){
        const s = t.trim()
        const lower = s.toLowerCase()
        const distinctErr = lower.includes('please select two distinct languages') || lower.includes('select two different languages')
        if (distinctErr){
          if (tgtNorm === 'zh-TW') return safeToTraditional(q)
          if (tgtNorm === 'zh-CN') return safeToSimplified(q)
          return q
        }
        if ((tgtNorm === 'zh-TW' || tgtNorm === 'zh-CN') && isMostlySameChinese(q, s)){
          return tgtNorm === 'zh-TW' ? safeToTraditional(q) : safeToSimplified(q)
        }
        return t
      }
    }catch{
      // 失败时继续退避重试后端代理；不再直接请求公共实例
    }
    // 退避等待再试后端
    await sleep(120 * Math.pow(2, attempt))
  }
  // 最终失败：进行本地简繁转换或返回 null
  if (tgtNorm === 'zh-TW') return safeToTraditional(q)
  if (tgtNorm === 'zh-CN') return safeToSimplified(q)
  return null
}

function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)) }
function isMostlySameChinese(a:string,b:string){
  if (a === b) return true
  const strip = (s:string)=> s.replace(/[^\u4e00-\u9fa5]/g,'')
  const sa = strip(a); const sb = strip(b)
  if (!sa || !sb) return false
  const minLen = Math.min(sa.length, sb.length)
  if (minLen === 0) return false
  let same = 0
  for (let i=0;i<minLen;i++){ if (sa[i] === sb[i]) same++ }
  return same / minLen > 0.9
}
function safeToTraditional(txt:string){
  try{ return tify(txt) }catch{ return txt }
}
function safeToSimplified(txt:string){
  try{ return sify(txt) }catch{ return txt }
}

// 璇█瑙勮寖鍖栦笌杞婚噺鏈湴妫€娴?
// 娉ㄦ剰锛氫笉瑕佸皢 zh-CN 涓?zh-TW 褰掍竴涓哄悓涓€鍊硷紝鍚﹀垯浼氭妸鈥滅畝浣撯啋绻佷綋鈥濈殑缈昏瘧璇垽涓衡€滃悓璇鈥濊€岃烦杩?
function normLang(c: string){ return ({ 'zh': 'zh', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'en': 'en', 'ja': 'ja', 'ko': 'ko', 'auto': 'auto' } as Record<string,string>)[c] || c }
function detectLangForText(text: string): TargetLang | 'auto'{
  const s = text || ''
  const hasKo = /[\uac00-\ud7af]/.test(s)
  if (hasKo) return 'ko'
  const hasJa = /[\u3040-\u30ff]/.test(s) // 銇层倝銇屻仾/銈偪銈儕
  if (hasJa) return 'ja'
  const zhCount = (s.match(/[\u4e00-\u9fa5]/g) || []).length
  if (zhCount > Math.max(1, s.length * 0.15)) return 'zh-CN'
  return 'en'
}

// ======== 鏂囨湰閫夋嫨缈昏瘧锛堟偓娴伐鍏凤級 ========
const LANG_AUTONYMS: Array<{ code: TargetLang; label: string }> = [
  { code: 'zh-TW', label: '\u7e41\u9ad4\u4e2d\u6587' },
  { code: 'zh-CN', label: '\u7b80\u4f53\u4e2d\u6587' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '\u65e5\u672c\u8a9e' },
  { code: 'ko', label: '\ud55c\uad6d\uc5b4' }
]
// 本地化 UI 文案（使用真实字符，避免显示 \uXXXX 序列）
const translateLabel = computed(() => ({ 'zh-CN': '翻译', 'zh-TW': '翻譯', 'ja': '翻訳', 'ko': '번역', 'en': 'Translate' }[locale.value as string] || 'Translate'))
const copyLabel = computed(() => ({ 'zh-CN': '复制', 'zh-TW': '複製', 'ja': 'コピー', 'ko': '복사', 'en': 'Copy' }[locale.value as string] || 'Copy'))
const closeLabel = computed(() => ({ 'zh-CN': '关闭', 'zh-TW': '關閉', 'ja': '閉じる', 'ko': '닫기', 'en': 'Close' }[locale.value as string] || 'Close'))
const failedLabel = computed(() => ({ 'zh-CN': '翻译失败', 'zh-TW': '翻譯失敗', 'ja': '翻訳に失敗しました', 'ko': '번역 실패', 'en': 'Translate failed' }[locale.value as string] || 'Translate failed'))

// “翻译中”需要根据目标语言显示（而不是当前站点语言）
const TRANSLATING_TEXT: Record<TargetLang | 'en', string> = {
  'zh-CN': '翻译中',
  'zh-TW': '翻譯中',
  'ja': '翻訳中',
  'ko': '번역 중',
  'en': 'Translating...'
}
function getTranslatingLabel(m?: Message){
  const tgt = m ? resolveTargetForMsg(m) : (langTarget.value as TargetLang | null)
  if (tgt && TRANSLATING_TEXT[tgt]) return TRANSLATING_TEXT[tgt]
  // 兜底用当前站点语言
  const key = (locale.value as any) as TargetLang | 'en'
  return TRANSLATING_TEXT[key] || 'Translating...'
}

// 寮€鍏筹細绂佺敤鍙屽嚮/鏂囨湰閫夋嫨瑙﹀彂鐨勭炕璇戞诞灞?
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
  // 浠呭湪鑱婂ぉ鍖哄煙閫夋嫨鏃跺睍绀猴紙鍩虹鍒ゆ柇锛?
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed){ hideSelPanel(); return }
  updateSelectionUI()
}
function onSelKeyUp(){ updateSelectionUI() }
if (ENABLE_SELECTION_TRANSLATE){
  window.addEventListener('mouseup', onSelMouseUp)
  window.addEventListener('keyup', onSelKeyUp)
}

// ======== 绀肩墿鍟嗗煄锛堟ā鎬佹锛?========
interface Gift { id: string; name: string; price: number; img: string }
const giftModalOpen = ref(false)
const giftLoading = ref(false)
const giftError = ref('')
const giftCatalog = ref<Gift[]>([])
// 绀肩墿姘旀场闈㈡澘锛堜笌琛ㄦ儏绫讳技锛?
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
  // 鍙戦€佺ぜ鐗╅渶瑕佺櫥褰曟€?
  const token = localStorage.getItem('token')
  if (!token){
  showToast(t('chat.toasts.loginBeforeGift'))
    // 蹇嵎璺宠浆鍒扮櫥褰曢〉
    window.setTimeout(()=>{ location.hash = '#/login' }, 800)
    return
  }
  // 鐩爣鐢ㄦ埛 ID
  const to = String(peerId.value || '')
  if (!to){ showToast(t('chat.toasts.choosePeer')); return }
  try {
    await api.post('/api/gifts/send', { toUserId: to, giftId: g.id })
    showToast('已送出「' + g.name + '」')
    closeGiftModal()
  } catch (e: any) {
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
  // If there is not enough space above the anchor, position the panel below the button
  if (top < pad) top = Math.min(a.bottom + 10, window.innerHeight - h - pad)
  panel.style.left = left + 'px'
  panel.style.top = top + 'px'
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

// 琛ㄦ儏閫夋嫨鍣ㄥ紩鐢ㄤ笌瀹炰緥
const emojiBtn = ref<HTMLElement | null>(null)
const msgInput = ref<HTMLTextAreaElement | null>(null)
let emojiPicker: any | null = null
const emojiOpen = ref(false)

function getEmojiPanelEl(): HTMLElement | null {
  return document.querySelector('.emoji-picker') as HTMLElement | null
}

// 浣跨敤 pointerdown + 鎹曡幏闃舵锛岄槻姝㈡墦寮€鍚庡悓涓€娆?click 瑙﹀彂澶栭儴鍏抽棴
function onDocClickCloseEmoji(ev: PointerEvent){
  const panel = getEmojiPanelEl()
  const btn = emojiBtn.value
  const t = ev.target as Node
  if (!panel) { emojiOpen.value = false; removeEmojiOutsideGuard(); return }
  if (panel.contains(t) || (btn && btn.contains(t))) return
  // 鐐瑰嚮鍦ㄥ閮細鍏抽棴
  if (emojiPicker && typeof (emojiPicker as any).hidePicker === 'function') (emojiPicker as any).hidePicker()
  else panel.setAttribute('hidden', 'true')
  emojiOpen.value = false
  removeEmojiOutsideGuard()
}

function addEmojiOutsideGuard(){
  // 閬垮厤閲嶅缁戝畾
  removeEmojiOutsideGuard()
  window.addEventListener('pointerdown', onDocClickCloseEmoji, true)
}
function removeEmojiOutsideGuard(){
  window.removeEventListener('pointerdown', onDocClickCloseEmoji, true)
}

onMounted(async () => {
  // 杩涘叆鑱婂ぉ椤垫椂缁?body 鍔犺儗鏅被锛屼粎鏈〉鐢熸晥
  // 鍔ㄦ€佹媺鍙栧悗绔厤缃殑鑱婂ぉ鑳屾櫙锛堜粎鍚庣鍙帶锛?
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
    if (el) {
      const backgroundStyle = "background:url('" + (absUrl || fallback) + "') center/cover no-repeat fixed;";
      el.setAttribute('style', backgroundStyle);
    }
    // 鐩存帴浣滅敤浜?body锛屼繚璇侀€忔槑鍖哄煙鑳芥樉绀鸿儗鏅?
    document.body.style.background = "url('" + (absUrl || fallback) + "') center/cover no-repeat fixed";
  } catch {
    // 澶辫触鐩存帴浣跨敤鏈湴闈欐€佽儗鏅?
    const el = document.getElementById('app-bg');
    const fallbackGradient = 'linear-gradient(135deg, #ffe4e6 0%, rgba(255, 243, 209, 0.85) 45%, rgba(224, 242, 254, 0.85) 100%)';
    if (el) el.setAttribute('style', 'background:' + fallbackGradient + ' fixed');
    document.body.style.background = fallbackGradient;
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
  }
  socket = getSocket();
  window.addEventListener('resize', handleChatResize);
  // 閲嶆柊娉ㄥ唽鐩戝惉鍓嶏紝鍏堢Щ闄ゆ棫鐨勭洃鍚紝閬垮厤 HMR 鎴栭噸澶嶆寕杞介€犳垚鐨勯噸澶嶆帹閫?
  socket.off('private:message');
  socket.on('private:message', (m: Message) => {
    if ((m.fromUserId === me.value && m.toUserId === peerId.value) || (m.fromUserId === peerId.value && m.toUserId === me.value)) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        messages.value.push(m);
      nextTick(() => {
        scrollToBottom('smooth')
        if (langMenuOpen.value) positionLangMenu()
      })
      }
    }
  });
  // 鍔犺浇鍘嗗彶娑堟伅锛氭父瀹粎鍏佽 support 瀵硅瘽
  if (isGuestSupport.value) {
    const { data } = await api.get('/api/messages/' + peerId.value, { headers: { 'x-guest-id': guestId.value } })
    messages.value = data
    data.forEach((m: Message) => seen.add(m.id))
    nextTick(() => {
      scrollToBottom('auto')
      if (langMenuOpen.value) positionLangMenu()
    })
  } else {
    const { data } = await api.get('/api/messages/' + peerId.value)
    messages.value = data
    data.forEach((m: Message) => seen.add(m.id))
    nextTick(() => {
      scrollToBottom('auto')
      if (langMenuOpen.value) positionLangMenu()
    })
  }
  const meId = localStorage.getItem('uid');
  if (meId) me.value = meId;
  // 鍔犺浇鍙屾柟鎬у埆浠ュ惎鐢ㄩ粯璁ゅご鍍忥紙娓稿鏃朵粎闇€瀵规柟锛?
  await loadGenders();
  // 鎼滅储椤电锛氬垵濮嬪寲鏈€杩戜細璇?
  if (!isSupportSimple.value) {
    fetchRecent();
    preloadUsers();
  }
  // 杩涘叆鑱婂ぉ椤靛嵆鏍囪璇ヤ細璇濅负宸茶锛堢櫥褰曟€侊級
  if (!isGuestSupport.value && peerId.value) {
    api.post('/api/messages/read', { peerId: peerId.value }).then(()=>{
      // 閫氱煡鍏朵粬椤甸潰鍒锋柊浼氳瘽鏈
      window.dispatchEvent(new Event('conv-read'))
    }).catch(()=>{})
  }

  // 鑻ョ鐢ㄧ涓夋柟閫夋嫨鍣紝娓呯悊浠讳綍娈嬬暀 DOM锛屽苟娉ㄥ叆闅愯棌鏍峰紡浠ラ伩鍏嶈鏄?
  if (!USE_EMOJI_BUTTON) {
    cleanupThirdPartyEmojiPanels()
    injectHideEmojiCss()
  } else {
    // 棰勭儹鍔ㄦ€佸鍏ワ紙鑻ュけ璐ヤ笉浼氶樆濉烇紝棣栨鐐瑰嚮鏃惰繕浼氬啀灏濊瘯锛?
    try { await import('emoji-button') } catch {}
  }

  // 鍒濆鍖栬緭鍏ラ珮搴?
  nextTick(() => {
    autoResize()
    scrollToBottom('auto')
    if (langMenuOpen.value) positionLangMenu()
  })
  // 加载快捷内容配置（登录用户）
  loadQuick()
  // 监听我头像通过审核后的全站事件，刷新我的头像 URL（即便 URL 不变也触发 AvatarImg 通过版本号刷新缓存）
  const onMeAvatarUpdated = () => { refreshMyAvatar() }
  window.addEventListener('me-avatar-updated', onMeAvatarUpdated as any)
  // 监听 VIP 升级，刷新会员状态
  const onVipUpdated = () => { loadGenders() }
  window.addEventListener('vip-updated', onVipUpdated as any)
  // 在卸载时移除监听
  onUnmounted(() => {
    window.removeEventListener('me-avatar-updated', onMeAvatarUpdated as any)
    window.removeEventListener('vip-updated', onVipUpdated as any)
  })
});

onUnmounted(() => {
  // 娓呯悊搴旂敤绾ц儗鏅牱寮?
  const el = document.getElementById('app-bg');
  if (el) el.removeAttribute('style');
  document.body.style.background = '';
  document.body.style.backgroundAttachment = '';
  document.body.style.backgroundSize = '';
  closeLangMenu()
  socket?.disconnect();
  window.removeEventListener('resize', handleChatResize)
  window.removeEventListener('keydown', onEscClose)
  removeEmojiOutsideGuard()
  if (ENABLE_SELECTION_TRANSLATE){
    window.removeEventListener('mouseup', onSelMouseUp)
    window.removeEventListener('keyup', onSelKeyUp)
  }
  cleanupThirdPartyEmojiPanels()
  removeHideEmojiCss()
  // 清理快捷内容状态（可选）
  quickOpen.value = false
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
      i18n: { search: '鎼滅储', categories: { recents: '甯哥敤', smileys: '琛ㄦ儏', people: '浜虹墿', animals: '鍔ㄧ墿', foods: '椋熺墿', travel: '鏃呰', activities: '娲诲姩', objects: '鐗╁搧', symbols: '绗﹀彿', flags: '鏃楀笢' } }
    })
    emojiPicker.on('emoji', (selection: any) => {
      const ch = selection?.emoji ?? selection
      if (typeof ch === 'string') insertAtCaret(ch); else insertAtCaret(selection.emoji)
    })
    // 鍚屾灞曠ず鐘舵€侊紝鑷姩鎸?鍗稿閮ㄧ偣鍑荤洃鍚?
    const onShown = () => { emojiOpen.value = true; addEmojiOutsideGuard() }
    const onHidden = () => { emojiOpen.value = false; removeEmojiOutsideGuard() }
    ;(emojiPicker as any).on?.('show', onShown)
    ;(emojiPicker as any).on?.('hidden', onHidden)
    return emojiPicker
  }catch(err){
    // 浜ょ敱璋冪敤鏂瑰厹搴?
    throw err
  }
}

function isEmojiPanelVisible(picker?: any){
  // 浼樺厛浣跨敤搴撹嚜甯︾殑鏍囧織浣嶏紙涓嶅悓鐗堟湰瀛楁鎴栧嚱鏁板悕鍙兘涓嶅悓锛?
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
  // 闃绘鏈鐐瑰嚮鍐掓场鍒?document锛岄伩鍏嶅垰鎵撳紑灏辫鈥滃閮ㄧ偣鍑烩€濋€昏緫鍏抽棴
  e?.stopPropagation()
  const anchor = (e?.currentTarget as HTMLElement) || emojiBtn.value
  if (!anchor) return
  // 閲囩敤鍐呯疆鏈湴闈㈡澘涓轰富锛岀‘淇濊法鐜绋冲畾
  if (!USE_EMOJI_BUTTON){
    // 淇濆畧澶勭悊锛氭樉绀哄唴缃潰鏉垮墠锛屾竻涓€娆＄涓夋柟娈嬬暀
    cleanupThirdPartyEmojiPanels()
    if (localEmojiPanel) { hideLocalEmojiFallback(); return }
    showLocalEmojiFallback(anchor)
    return
  }
  // 濡傛灉鏈湴鍏滃簳闈㈡澘宸叉樉绀猴紝鍒欎紭鍏堝叧闂苟杩斿洖
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
      // 浣跨敤 setTimeout 鎺ㄨ繜鍒颁簨浠跺惊鐜悗鎵ц锛岄伩鍏嶅悓涓€娆?click 琚閮ㄧ偣鍑讳睛鍚櫒璇垽
      window.setTimeout(() => {
        if (typeof (picker as any).openPicker === 'function') (picker as any).openPicker(anchor)
        else if (typeof (picker as any).showPicker === 'function') (picker as any).showPicker(anchor)
        else (picker as any).togglePicker?.(anchor)
        window.setTimeout(() => {
          ensurePanelInViewport(anchor)
        }, 60)
        emojiOpen.value = true
        // 鎹曡幏闃舵鐩戝惉锛屼紭鍏堜簬搴撳唴閮ㄧ殑鍐掓场鍏抽棴閫昏緫澶勭悊
        addEmojiOutsideGuard()
        // 鑻ョ煭鏃堕棿鍐呬粛鏈彲瑙侊紝鍒欒嚜鍔ㄥ惎鐢ㄦ湰鍦板厹搴曢潰鏉?
        window.setTimeout(() => {
          const nowVisible = isEmojiPanelVisible(picker)
          if (!nowVisible){
            // 鍏抽棴绗笁鏂癸紙鑻ュ凡缁忓垱寤轰簡鍗犱綅灞傦級骞跺垏鍒版湰鍦伴潰鏉?
            try{ (picker as any).hidePicker?.() }catch{}
            removeEmojiOutsideGuard()
            showLocalEmojiFallback(anchor)
          }
        }, 180)
      }, 0)
    }
  }catch{
    // 濡傛灉绗笁鏂瑰簱鍔犺浇澶辫触锛屽垯浣跨敤鏈湴绠€鏄撹〃鎯呴潰鏉匡紝骞舵敮鎸?toggle
    if (localEmojiPanel) { hideLocalEmojiFallback(); return }
    showLocalEmojiFallback(anchor)
  }
}

// ========== 鍔熻兘鏈В閿佹彁绀?==========
function showToast(msg: string, key = 'toast-locked'){
  // 绉婚櫎鍚?key 鐨勬棫鎻愮ず锛岄伩鍏嶅彔鍔?
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
  const token = localStorage.getItem('token')
  // 仅开放：已登录 & 当前客服会话
  if (!token || peerId.value !== 'support'){
    showToast(t('chat.toasts.notUnlocked'))
    return
  }
  imageInputRef.value?.click()
}

const imageInputRef = ref<HTMLInputElement | null>(null)
const sendingImage = ref(false)
function onImageSelected(e: Event){
  const input = e.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  if (!/^image\//.test(file.type)){ showToast(t('chat.toasts.sendFailed')); input.value=''; return }
  const MAX = 2 * 1024 * 1024
  if (file.size > MAX){
    compressImage(file, 0.75, MAX).then(f => readImageFile(f)).catch(()=>{ showToast(t('chat.toasts.sendFailed')); })
  } else {
    readImageFile(file)
  }
  input.value=''
}
function readImageFile(file: File){
  const reader = new FileReader()
  sendingImage.value = true
  reader.onload = async () => {
    const dataUrl = typeof reader.result === 'string' ? reader.result : ''
    if (!dataUrl){ sendingImage.value=false; showToast(t('chat.toasts.sendFailed')); return }
    await sendImageMessage(dataUrl)
    sendingImage.value=false
  }
  reader.onerror = () => { sendingImage.value=false; showToast(t('chat.toasts.sendFailed')) }
  reader.readAsDataURL(file)
}
async function sendImageMessage(dataUrl: string){
  try{
    const token = localStorage.getItem('token')
    if (!token){ showToast(t('nav.login')); return }
    if (socket && (socket as any).connected){
      socket.emit('private:message', { toUserId: 'support', content: dataUrl })
    } else {
      const { data } = await api.post('/api/messages', { toUserId: 'support', content: dataUrl })
      if (!seen.has(data.id)){ seen.add(data.id); messages.value.push(data) }
    }
    nextTick(()=> scrollToBottom('smooth'))
  }catch{ showToast(t('chat.toasts.sendFailed')) }
}
function isImageMessage(m: Message){
  // 支持两种格式：1) base64 data URL 2) 服务器返回的 img: 前缀 + 路径
  if (!m || !m.content) return false
  return /^data:image\//.test(m.content) || /^img:/i.test(m.content)
}
function getImageSrc(m: Message){
  if (!m || !m.content) return ''
  const c = m.content
  if (/^data:image\//.test(c)) return c
  const m2 = c.match(/^img:(.+)$/i)
  if (!m2) return ''
  let p = m2[1].trim()
  // 若是完整 URL 直接返回
  if (/^(https?:)?\/\//i.test(p)) return p
  // 规范化：确保以 /
  if (!p.startsWith('/')) p = '/' + p
  // 若当前 API_BASE_URL 为其他域名，拼接 origin；否则使用相对路径以支持代理
  try {
    // 这些常量在本文件顶部未导入，这里使用运行时全局推断；若需要更严格，可从 api.ts 导入 API_ORIGIN
    // 为避免循环引用，这里简单使用 location.origin（后端静态资源与 API 同源时成立）
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : ''
    // 如果路径看起来是静态资源且当前存在非空 origin，则拼接
    if (origin && /\/static\//.test(p)) return origin + p
  } catch {}
  return p
}
function onImageLoaded(){ nextTick(()=>{ scrollToBottom('auto'); if (langMenuOpen.value) positionLangMenu() }) }
// ==== 图片预览 Lightbox 逻辑 ====
const previewOpen = ref(false)
const previewIndex = ref(0)
const previewLoading = ref(false)
const previewError = ref('')
const previewImages = computed(() => messages.value.filter(isImageMessage))
const currentPreviewMsg = computed(() => previewImages.value[previewIndex.value] || null)
const currentPreviewSrc = computed(() => currentPreviewMsg.value ? getImageSrc(currentPreviewMsg.value) : '')
const currentPreviewAlt = computed(() => currentPreviewMsg.value ? 'image message' : '')
function openPreview(m: Message){
  const idx = previewImages.value.findIndex(x => x.id === m.id)
  if (idx < 0) return
  previewIndex.value = idx
  previewError.value = ''
  previewLoading.value = true
  previewOpen.value = true
  // 预加载当前图片（浏览器会自动加载 <img>），这里仅重置状态
  nextTick(()=>{})
}
function closePreview(){ previewOpen.value = false }
function onPreviewLoaded(){ previewLoading.value = false }
function onPreviewError(){ previewLoading.value = false; previewError.value = t('chat.toasts.sendFailed') }
function prevPreview(){
  if (previewImages.value.length <= 1) return
  previewIndex.value = (previewIndex.value - 1 + previewImages.value.length) % previewImages.value.length
  previewLoading.value = true; previewError.value=''
}
function nextPreview(){
  if (previewImages.value.length <= 1) return
  previewIndex.value = (previewIndex.value + 1) % previewImages.value.length
  previewLoading.value = true; previewError.value=''
}
function compressImage(file: File, quality: number, targetSize: number): Promise<File>{
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const maxW = 1280
      const scale = img.width > maxW ? maxW / img.width : 1
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      ctx.drawImage(img,0,0,canvas.width,canvas.height)
      canvas.toBlob(b => {
        URL.revokeObjectURL(url)
        if (!b){ reject(new Error('blob fail')); return }
        resolve(new File([b], file.name.replace(/\.(\w+)$/, '.jpg'), { type: 'image/jpeg' }))
      }, 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img error')) }
    img.src = url
  })
}

// 鏀寔鎸?ESC 鍏抽棴绗笁鏂硅〃鎯呴潰鏉夸笌鍏滃簳闈㈡澘
function onEscClose(e: KeyboardEvent){
  if (previewOpen.value){
    if (e.key === 'Escape'){ closePreview(); return }
    if (e.key === 'ArrowLeft'){ prevPreview(); return }
    if (e.key === 'ArrowRight'){ nextPreview(); return }
  }
  if (e.key !== 'Escape') return
  const panel = document.querySelector('.emoji-picker') as HTMLElement | null
  if (panel && isEmojiPanelVisible()){
    // 灏濊瘯閫氳繃 picker API 鍏抽棴
    if (emojiPicker && typeof (emojiPicker as any).hidePicker === 'function') (emojiPicker as any).hidePicker()
    else panel.setAttribute('hidden', 'true')
    emojiOpen.value = false
    removeEmojiOutsideGuard()
  }
  // 鍏抽棴绀肩墿寮圭獥
  if (giftModalOpen.value) giftModalOpen.value = false
  // 鍏抽棴璇█鑿滃崟
  if (langMenuOpen.value) closeLangMenu()
  if (localEmojiPanel) hideLocalEmojiFallback()
}
window.addEventListener('keydown', onEscClose)

// ======== 鏈湴绠€鏄撹〃鎯呴潰鏉匡紙鍏滃簳锛?========
let localEmojiPanel: HTMLElement | null = null
// 鎵╁厖褰撳墠甯哥敤/鐑棬琛ㄦ儏闆嗗悎
const BASIC_EMOJIS = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😍','😘','😗','😙','😚','🙂','🤗','🤔','😐',
  '😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','🤓','😛','😜','😝','🤤','😒','😓',
  '😔','😕','🙁','😖','😞','😟','😢','😭','😤','😠','😡','🤬','🤯','😳','🤪','😜'
]
function showLocalEmojiFallback(anchor: HTMLElement){
  hideLocalEmojiFallback()
  const rect = anchor.getBoundingClientRect()
  const panel = document.createElement('div')
  panel.className = 'mini-emoji-fallback'
  Object.assign(panel.style, {
    position: 'fixed',
    left: String(rect.left) + 'px',
    top: String(rect.top - 240) + 'px',
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
  // 鐐瑰嚮澶栭儴鍏抽棴
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

// 灏嗗脊灞傞檺鍒跺埌瑙嗗彛鑼冨洿鍐咃紙绗笁鏂规垨鏈湴闈㈡澘鍧囧彲澶嶇敤锛?
function ensurePanelInViewport(anchor: HTMLElement){
  const panel = document.querySelector('.emoji-picker') as HTMLElement | null
  if (!panel) return
  const a = anchor.getBoundingClientRect()
  panel.style.position = 'fixed'
  // 鍒濇鏀惧湪鎸夐挳涓婃柟
  let left = a.left
  let h = (panel.offsetHeight || 280)
  let w = (panel.offsetWidth || 320)
  let top = a.top - h - 8
  const pad = 8
  const maxLeft = window.innerWidth - w - pad
  const maxTop = window.innerHeight - h - pad
  left = Math.max(pad, Math.min(left, maxLeft))
  // 閬垮厤閬尅搴曢儴娑堟伅鍙戦€佹潯
  const bar = document.querySelector('.chat-input') as HTMLElement | null
  if (bar){
    const br = bar.getBoundingClientRect()
    const idealTop = br.top - h - 8
    if (idealTop > pad){
      top = idealTop
    } else if (top < pad) {
      // 瀹炲湪鏀句笉涓嬪啀鏀惧埌宸ュ叿鏉′笅鏂癸紙閫氬父宸叉帴杩戣鍙ｅ簳閮級锛屽苟灏介噺璐村簳浣嗕笉閬尅
      top = Math.min(br.bottom + 8, maxTop)
    }
  } else if (top < pad) {
    top = Math.min(a.bottom + 8, maxTop)
  }
  panel.style.left = left + 'px'
  panel.style.top = top + 'px'
}

function clampPanelToViewport(panel: HTMLElement, anchorRect: DOMRect){
  const pad = 8
  const w = panel.offsetWidth || 320
  const h = panel.offsetHeight || 280
  let left = parseFloat(panel.style.left || String(anchorRect.left))
  let top = parseFloat(panel.style.top || String(anchorRect.top - h - 8))
  const maxLeft = window.innerWidth - w - pad
  const maxTop = window.innerHeight - h - pad
  left = Math.max(pad, Math.min(left, maxLeft))
  // 閬垮厤閬尅搴曢儴娑堟伅鍙戦€佹潯
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
  panel.style.left = left + 'px'
  panel.style.top = top + 'px'
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
  // 鍗曠函 Enter 鐩存帴鍙戦€侊紱Shift+Enter 鍦ㄦā鏉夸笂宸?stop 浣滀负鎹㈣
  send()
  // 鍙戦€佸悗閲嶇疆楂樺害
  nextTick(()=> autoResize())
}

// ======== 娓呯悊绗笁鏂?emoji-button 娈嬬暀闈㈡澘 & 鍔ㄦ€侀殣钘忔牱寮?========
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
    style.textContent = '.emoji-picker{display:none!important;}'
  document.head.appendChild(style)
}
function removeHideEmojiCss(){
  const el = document.getElementById('hide-emoji-picker-css')
  if (el && el.parentElement) el.parentElement.removeChild(el)
}

async function send() {
  if (!hasSendableContent(content.value)) return;
  // 发送前：仅去除 ASCII 边界空白，并移除消息中所有 ASCII 空格（保留全角空格等 CJK 空白）
  const edgeTrimmed = trimAsciiEdgeWhitespace(content.value);
  // 如果只包含 ASCII 空白则不发送（支持仅全角空格 “　” 的消息发送）
  if (!hasSendableContent(edgeTrimmed)) { content.value = ''; return; }
  // 移除中间所有 ASCII 空格（U+0020），不移除换行与全角空格
  const payload = edgeTrimmed.replace(/ /g, '');
  const token = localStorage.getItem('token');
  // 鏈櫥褰曚笖闈炲鏈嶄細璇濓細绂佹鍙戦€侊紝鎻愮ず鍘荤櫥褰?
  if (!token && peerId.value !== 'support') {
    showToast(t('nav.login'));
    window.setTimeout(() => { location.hash = '#/login' }, 800);
    return;
  }
  // 非 VIP 的普通会员：对单个用户仅可发送 3 条
  if (limitReached.value) {
    showToast(t('chat.limit.upgradeToUnlock'))
    // 引导用户升级
    window.setTimeout(() => { try{ openVipNow() }catch{} }, 300)
    return
  }
  if (isGuestSupport.value) {
    // 娓稿閫氳繃 HTTP fallback 鍙戦€?
    const { data } = await api.post('/api/messages/guest/support', { guestId: guestId.value, content: payload })
    if (!seen.has(data.id)) { seen.add(data.id); messages.value.push(data); }
  } else {
    // 浼樺厛閫氳繃 Socket 鍙戦€侊紱鑻ユ湭杩炴帴锛屽垯璧?HTTP fallback锛岀‘淇濆彲浠ュ彂鍑?
    if (socket && (socket as any).connected) {
      socket.emit('private:message', { toUserId: peerId.value, content: payload });
    } else {
      try {
        const { data } = await api.post('/api/messages', { toUserId: String(peerId.value || ''), content: payload })
        if (!seen.has(data.id)) { seen.add(data.id); messages.value.push(data); }
      } catch (e: any) {
        const msg = e?.response?.data?.error || '发送失败，请稍后重试。'
        showToast(msg)
        return;
      }
    }
    // 涓嶅啀杩涜鏈湴涔愯杩藉姞锛岄伩鍏嶄笌鏈嶅姟鍣ㄥ洖鏄剧殑鍚屼竴鏉℃秷鎭噸澶嶆樉绀?
  }
  content.value = '';
  nextTick(() => {
    scrollToBottom('smooth')
    if (langMenuOpen.value) positionLangMenu()
  })
}

// 鑷姩婊氬姩鍒版渶鏂版秷鎭?
const chatBody = ref<HTMLElement | null>(null)
function scrollToBottom(behavior: ScrollBehavior = 'auto'){
  const el = chatBody.value
  if (!el) return
  const last = el.lastElementChild as HTMLElement | null
  if (last){
    last.scrollIntoView({ behavior, block: 'end', inline: 'nearest' })
  }
  el.scrollTop = el.scrollHeight
}
const handleChatResize = () => {
  scrollToBottom('auto')
  if (langMenuOpen.value) nextTick(() => positionLangMenu())
}
watch(messages, () => nextTick(() => {
  scrollToBottom('smooth')
  if (langMenuOpen.value) positionLangMenu()
}))

// 褰撳垏鎹㈣瑷€鎴栨柊娑堟伅鍒拌揪鏃讹紝鑷姩缈昏瘧鏈€杩戠殑娑堟伅锛堟渶澶?30 鏉★級
watch([messages, langTarget], async () => {
  if (!langTarget.value) return
  const source = guessSourceLang()
  const recent = messages.value.slice(-30)
  const todo = recent.map(m => ({ m, key: m.id + '|' + langTarget.value })).filter(it => !translateCache.has(it.key))
  if (!todo.length) return
  await runPool(todo, 6, async (it) => {
    const t = await translateTextSafe(it.m.content, source as any, langTarget.value as any)
    if (t) { translateCache.set(it.key, t); translateVersion.value++ }
    else { if (typeof translateFailed !== 'undefined') translateFailed.add(it.key); translateVersion.value++ }
    return null as any
  })
}, { deep: true })

// 鏂版秷鎭埌杈炬椂锛岃嫢宸查€夋嫨鍏ㄥ眬璇█锛屼紭鍏堝揩閫熺炕璇戞渶鍚庝竴鏉★紝閬垮厤鈥滃垰鍙戝嚭鐨勬秷鎭笉缈昏瘧鈥濈殑绌虹獥
watch(() => messages.value.length, async (len, old) => {
  if (!langTarget.value) return
  if (len <= 0 || len <= (old || 0)) return
  const m = messages.value[len - 1]
  if (!m) return
  const key = m.id + '|' + langTarget.value
  if (translateCache.has(key)) return
  // 绔嬪埢瑙﹀彂鈥滅炕璇戜腑鈥︹€濇覆鏌?
  translateVersion.value++
  const src = detectLangForText(m.content)
  const sNorm = normLang(src)
  const tNorm = normLang(langTarget.value)
  const t = (sNorm === tNorm) ? m.content : await translateTextSafe(m.content, src as any, langTarget.value as any)
  if (t) { translateCache.set(key, t); translateVersion.value++ }
  else { if (typeof translateFailed !== 'undefined') translateFailed.add(key); translateVersion.value++ }
})

// 鏂囨湰鍐呭鍙樺寲鏃朵篃璋冩暣楂樺害锛堝寘鎷閮ㄦ彃鍏ヨ〃鎯咃級
watch(content, () => nextTick(()=> autoResize()))

// 璺敱鍒囨崲鏃堕噸鏂板姞杞藉巻鍙蹭笌鎬у埆绛?
async function loadHistory(){
  messages.value = []
  seen.clear()
  try{
    if (isGuestSupport.value) {
      const { data } = await api.get('/api/messages/' + peerId.value, { headers: { 'x-guest-id': guestId.value } })
      messages.value = data
      data.forEach((m: Message) => seen.add(m.id))
    } else {
      const { data } = await api.get('/api/messages/' + peerId.value)
      messages.value = data
      data.forEach((m: Message) => seen.add(m.id))
    }
  } finally {
    nextTick(() => scrollToBottom('auto'))
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
      myAvatarUrl.value = String(meUser?.avatarUrl || '')
      // 会员有效性：等级非 none 且未过期
      try{
        const lvl = String(meUser?.membershipLevel || 'none')
        const until = Number(meUser?.membershipUntil || 0)
        isVip.value = lvl !== 'none' && until > Date.now()
      }catch{}
      const peer = Array.isArray(users) ? users.find((u: any) => u.id === peerId.value) : null
      peerGender.value = (peer?.gender || 'other') as Gender
      // 若为客服会话，统一使用固定客服头像
      if (peerId.value === 'support') {
        peerAvatarUrl.value = SUPPORT_AVATAR_URL
      } else {
        peerAvatarUrl.value = String(peer?.avatarUrl || '')
      }
      peerNickname.value = peer?.nickname || ''
    } else {
      // 娓稿锛氭棤璁烘槸鍚︿笌瀹㈡湇浼氳瘽锛岄兘璁剧疆涓存椂 uid锛屼繚璇?socket 鍥炴樉鍖归厤
      const { data: users } = await api.get('/api/users')
  const isSupport = peerId.value === 'support'
      const pid = isSupport ? 'support' : peerId.value
      const peer = Array.isArray(users) ? users.find((u: any) => u.id === pid) : null
      peerGender.value = (peer?.gender || 'other') as Gender
  // 访客模式下的客服同样使用固定头像
  peerAvatarUrl.value = isSupport ? SUPPORT_AVATAR_URL : String(peer?.avatarUrl || '')
      myGender.value = 'other'
      me.value = 'guest:' + guestId.value
      if (isSupport) peerNickname.value = ''
    }
  } catch {}
}

async function refreshMyAvatar(){
  try{
    const { data } = await api.get('/api/users/me')
    myAvatarUrl.value = String(data?.avatarUrl || '')
    if (data?.gender) myGender.value = (data.gender as Gender)
  }catch{}
}

// ========== 鎼滅储涓庢渶杩戜細璇?==========
type UserLite = { id: string; nickname?: string; gender?: Gender; avatarUrl?: string }
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
    // 杩囨护鎺夎嚜宸变笌瀹㈡湇璐﹀彿
    const my = localStorage.getItem('uid')
    allUsers.value = list.filter((u:any)=> u && u.id && u.id !== my && u.id !== 'support')
  }catch{}
}

async function fetchRecent(){
  try{
    const { data } = await api.get('/api/messages/recent')
    const list = Array.isArray(data?.list) ? data.list : []
    // 覆盖：确保“客服”在最近列表中使用固定头像
    recentList.value = list.map((c: any) => {
      if (c && c.peerId === 'support') {
        const peer = c.peer || { id: 'support', nickname: t('nav.contactService'), gender: 'other' }
        return { ...c, peer: { ...peer, avatarUrl: SUPPORT_AVATAR_URL } }
      }
      return c
    })
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
  // 鏈湴杩囨护锛堝闇€鍙垏鎹负鏈嶅姟绔ā绯婃煡璇級
  const res = allUsers.value.filter(u => normalize(u.nickname||u.id).includes(key)).slice(0, 20)
  searchResults.value = res
  searching.value = false
}
function openChatWith(uid: string){
  activeTab.value = 'chat'
  // 璺宠浆鍒拌鐢ㄦ埛浼氳瘽
  window.setTimeout(()=>{ location.hash = '#/chat/' + encodeURIComponent(uid) }, 0)
}

function isToday(ts:number){ const d=new Date(ts); const n=new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate() }
function isYesterday(ts:number){ const n=new Date(); const y=new Date(n.getFullYear(), n.getMonth(), n.getDate()-1); const d=new Date(ts); return d.getFullYear()===y.getFullYear() && d.getMonth()===y.getMonth() && d.getDate()===y.getDate() }
function formatTime(ts: number){
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return m + '-' + day;
}
function formatRelative(ts:number){ if(isToday(ts)) return t('chat.time.today'); if(isYesterday(ts)) return t('chat.time.yesterday'); return formatTime(ts) }

// 最近会话中加入“客服”逻辑：当用户与客服聊天后离开客服，确保客服会话出现在 recentList
function addSupportToRecent(fromMessages: Message[]){
  // 已存在则跳过
  if (recentList.value.some(c => c.peerId === 'support')) return
  // 没有聊天记录时给一个默认展示内容
  const last = fromMessages[fromMessages.length - 1] || null
  recentList.value = [
    {
      peerId: 'support',
      lastAt: last ? last.createdAt : Date.now(),
      lastContent: last ? last.content : t('chat.support.hello'),
      unread: 0,
      // 使用固定客服头像（若加载失败在 Chat 列表中已有回退机制，这里仅提供 URL）
      peer: { id: 'support', nickname: t('nav.contactService'), gender: 'other', avatarUrl: SUPPORT_AVATAR_URL }
    },
    ...recentList.value.filter(c => c.peerId !== 'support')
  ]
}

watch(() => route.params.id, async (newVal, oldVal) => {
  // 在切换前保留旧的消息快照，用于支持客服会话进入最近列表
  const prevMessages = messages.value.slice()
  await Promise.all([loadHistory(), loadGenders()])
  // 标记已读
  if (!isGuestSupport.value && peerId.value) {
    api.post('/api/messages/read', { peerId: peerId.value }).then(()=>{
      window.dispatchEvent(new Event('conv-read'))
    }).catch(()=>{})
  }
  activeTab.value = 'chat'
  // 如果离开的是客服会话（oldVal === 'support'）并且当前是已登录用户，加入最近列表
  if (oldVal === 'support' && localStorage.getItem('token')) {
    addSupportToRecent(prevMessages)
  }
  // 如果当前进入的是客服（newVal === 'support'），稍后（加载完历史消息后）也尝试加入一次，保证首次进入后切走也能看到
  if (newVal === 'support' && localStorage.getItem('token')) {
    // 使用 nextTick 等待 messages 刷新完成后再补充（避免空内容）
    nextTick(() => addSupportToRecent(messages.value.slice()))
  }
})

// ====== 璺ㄩ〉鑱斿姩锛歀ucky 鎴栧叾浠栭〉闈㈠彲閫氳繃鍏ㄥ眬鍑芥暟鍞よ捣浼氬憳寮圭獥 ======
function openVipNow(){
  const fn = (window as any).__openVipModal
  if (typeof fn === 'function') fn()
  else router.push('/settings')
}

// ======== 快捷内容（后端开关 + 用户可编辑短语） ========
const quickEnabled = ref(false)
const quickPhrases = ref<string[]>([])
const quickOpen = ref(false)
const quickEditing = ref(false)
const quickDraft = ref('')
const quickSaving = ref(false)
const quickError = ref('')

function toggleQuick(){ quickOpen.value = !quickOpen.value }
function startQuickEdit(){
  quickEditing.value = true
  quickError.value = ''
  quickDraft.value = quickPhrases.value.join('\n')
}
function cancelQuickEdit(){ quickEditing.value = false; quickError.value = '' }
function insertQuick(text: string){ insertAtCaret(text) }

async function loadQuick(){
  const token = localStorage.getItem('token')
  if (!token) { quickEnabled.value = false; quickPhrases.value = []; return }
  try{
    const { data } = await api.get('/api/users/me/quick-text')
    const d = data?.data || {}
    quickEnabled.value = !!d.enabled
    quickPhrases.value = Array.isArray(d.phrases) ? d.phrases : []
  }catch{
    // 静默失败，不影响聊天
    quickEnabled.value = false
    quickPhrases.value = []
  }
}

async function saveQuick(){
  quickSaving.value = true
  quickError.value = ''
  try{
    const list = quickDraft.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)
    const { data } = await api.put('/api/users/me/quick-text', { phrases: list })
    const d = data?.data || {}
    quickPhrases.value = Array.isArray(d.phrases) ? d.phrases : list
    // enabled 由后端控制，不在此修改
    quickEditing.value = false
  }catch(e:any){
    quickError.value = e?.response?.data?.error || '保存失败，请稍后重试'
  }finally{
    quickSaving.value = false
  }
}
</script>

<style scoped>
/* 背景层：完全透明，不再叠加任何颜色，100% 展示 body 的背景图 */
.chat-bg{ pointer-events:none; background: transparent; }
.chat-body{ background: radial-gradient(1200px 600px at 50% 0%, rgba(255,255,255,.65), rgba(255,255,255,.45)); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding-right:8px; }
/* 头像防裁剪：允许头像在气泡侧占据固定宽度并避免被滚动条覆盖 */
.chat-body::-webkit-scrollbar{ width:10px; }
.chat-body::-webkit-scrollbar-thumb{ background:rgba(0,0,0,.15); border-radius:6px; }
.chat-body::-webkit-scrollbar-track{ background:transparent; }
/* 调整消息行两侧头像与气泡的间距，避免放大后裁切 */
.chat-body .flex.items-end > div[class*='mr-2'],
.chat-body .flex.items-end > div[class*='ml-2']{ flex:0 0 auto; }
.chat-body .flex.items-end span.inline-block{ max-width:68%; }
/* 为更大的 50px 头像增加左右安全距离 */
.chat-body .flex.items-end > .mr-2{ margin-right:10px; }
.chat-body .flex.items-end > .ml-2{ margin-left:10px; }
.chat-input{ background: rgba(255,255,255,0.68); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }

/* 鏍囩鏉℃牱寮忥紙鍙傝€冭崏鍥撅級 */
.tab-bar{ display:flex; gap:0; border-bottom:1px solid #e5e7eb; }
.tab{ padding:10px 14px; font-weight:700; color:#6b7280; border-right:1px solid #e5e7eb; cursor:pointer; user-select:none; }
.tab:hover{ background:#f9fafb; }
.tab.active{ color:#111827; position:relative; }
.tab.active::after{ content:""; position:absolute; left:0; right:0; bottom:-1px; height:3px; background: var(--brand-main, #e67a88); }

/* 搴曢儴宸ュ叿鍦嗘寜閽笌鍙戦€?*/
.circle-icon{ width:36px; height:36px; border-radius:50%; border:1.5px solid #e5e7eb; display:grid; place-items:center; background:#fff; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,.06); }
.circle-icon:hover{ background:#f9fafb; }
.send-btn{ background: var(--brand-main, #e67a88); color:#fff; font-weight:800; border:2px solid rgba(255,255,255,.5); box-shadow:0 6px 16px rgba(230,122,136,.35); }

/* emoji-button 杞绘牱寮忛€傞厤 */
:global(.emoji-picker){ box-shadow: 0 10px 30px rgba(0,0,0,.15); border-radius:12px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.send-btn:hover{ filter: brightness(1.06); }

/* 鏂帮細灞呬腑鎮诞杈撳叆姘旀场锛堟洿鑱氱劍锛?*/
.composer{ max-width: 920px; margin: 0 auto; display:flex; align-items:center; gap:10px; padding:6px; border-radius:999px; background:#fff; border:1px solid #e5e7eb; box-shadow:0 6px 20px rgba(0,0,0,.06); }
.composer:focus-within{ box-shadow:0 10px 26px rgba(0,0,0,.10); border-color:#e4e4e7; }
.composer input::placeholder{ color:#b8bcc3; }

/* 璇█鑿滃崟锛堝簳閮ㄦ洿澶氭寜閽級 */
.lang-menu{ position:fixed; background:#fff; color:#111; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.14); padding:8px; width:180px; z-index:10010; }
.lang-menu .tip{ position:absolute; bottom:-7px; width:14px; height:14px; background:#fff; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; transform:translateX(-50%) rotate(45deg); }
.lang-menu.is-below .tip{ bottom:auto; top:-7px; border-right:none; border-bottom:none; border-left:1px solid #e5e7eb; border-top:1px solid #e5e7eb; }
.lang-menu .group-title{ font-size:12px; color:#64748b; font-weight:800; padding:4px 10px 6px; }
.lang-menu .menu-item{ width:100%; text-align:left; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:8px; font-weight:800; color:#111; }
.lang-menu .menu-item:hover{ background:#f9fafb; }
.lang-menu .menu-item.active{ background:#fff5f7; color: var(--brand-main, #e67a88); }
.lang-menu .menu-item.toggle{ cursor:pointer; }
.lang-menu .menu-item.toggle input{ accent-color: var(--brand-main, #e67a88); }
.lang-menu .divider{ height:1px; background:#f1f5f9; margin:6px 4px; border-radius:999px; }

/* 鍙岃姘旀场鍐呮帓鐗?*/
.line-1{ font-weight:700; line-height:1.3; }
.line-2{ margin-top:2px; font-size:12px; line-height:1.25; opacity:.9; }
.line-2.muted{ opacity:.7; font-style:italic; }

/* 图片消息样式 */
.chat-img{ max-width:240px; height:auto; display:block; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.12); background:#fff; }
@media (max-width:640px){ .chat-img{ max-width:70vw; } }
/* 图片预览 Lightbox */
.img-preview-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); z-index:130; display:flex; align-items:center; justify-content:center; padding:30px 20px; }
.ip-box{ position:relative; max-width:90vw; max-height:85vh; display:flex; flex-direction:column; align-items:center; gap:12px; }
.ip-stage{ position:relative; flex:1; max-width:90vw; max-height:85vh; display:flex; align-items:center; justify-content:center; }
.ip-stage img{ max-width:90vw; max-height:80vh; object-fit:contain; border-radius:14px; box-shadow:0 10px 40px rgba(0,0,0,.4); background:#fff; }
.ip-close{ position:fixed; top:18px; right:18px; background:#fff; color:#6b21a8; border:0; width:38px; height:38px; border-radius:50%; font-weight:800; box-shadow:0 4px 16px rgba(0,0,0,.35); cursor:pointer; z-index:131; }
.ip-close:hover{ filter:brightness(0.95); }
.ip-nav{ display:flex; align-items:center; gap:14px; font-weight:800; color:#fff; }
.ip-btn{ background:#ffffffdd; color:#111; border:0; width:46px; height:46px; border-radius:50%; font-size:18px; font-weight:800; box-shadow:0 4px 14px rgba(0,0,0,.35); cursor:pointer; }
.ip-btn:disabled{ opacity:.4; cursor:not-allowed; }
.ip-btn:hover:not(:disabled){ background:#fff; }
.ip-count{ min-width:80px; text-align:center; font-size:14px; }
.ip-loading, .ip-error{ position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); color:#fff; font-weight:800; font-size:15px; letter-spacing:.5px; text-shadow:0 2px 6px rgba(0,0,0,.35); }

/* 瀹㈡湇澶村儚锛氫笌鍙充笂瑙?SupportButton 淇濇寔涓€鑷磋瑙夛紙绮夊簳 + 鑽у厜缁挎弿杈癸級 */
.cs-support-avatar{ display:inline-grid; place-items:center; border-radius:50%; background: var(--brand-pink, #f17384);
  box-shadow: 0 0 0 2px var(--brand-pink-deep, #ea6f82), 0 0 0 6px var(--brand-ring, #b6ff3f); color:#fff; }
.cs-support-avatar svg{ width: 70%; height: 70%; display:block; }
.cs-support-avatar.cs-sm{ width:28px; height:28px; }
.cs-support-avatar.cs-md{ width:38px; height:38px; }

/* 图片版客服头像，尺寸与上方保持一致 */
.cs-support-photo{ display:inline-block; border-radius:50%; object-fit:cover; box-shadow: 0 0 0 2px var(--brand-pink-deep, #ea6f82), 0 0 0 6px var(--brand-ring, #b6ff3f); }
.cs-support-photo.cs-sm{ width:28px; height:28px; }
.cs-support-photo.cs-md{ width:38px; height:38px; }

/* 鎼滅储闈㈡澘鏍峰紡 */
.tab-bar .tab--search{ flex:0 0 18.75%; }
.tab-bar .tab.active{ flex:1 1 auto; }
/* 椤堕儴鍐呭祵鎼滅储妗嗭紙椋庢牸杩戜技瀵艰埅锛?*/
.navlike-search{ position:relative; display:flex; align-items:center; height:34px; }
.navlike-search input{ width:100%; height:34px; border:1px solid #e5e7eb; border-radius:999px; padding:0 40px 0 12px; background:#fff; color:#333; font-weight:600; font-size:13px; }
.navlike-search input::placeholder{ color:#bfbfbf; }
.navlike-search .go{ position:absolute; right:4px; top:50%; transform:translateY(-50%); width:28px; height:28px; border-radius:50%; border:0; background:#fff; color:#999; display:grid; place-items:center; box-shadow:0 1px 2px rgba(0,0,0,.06); }

/* 鏂板竷灞€锛氫晶鏍?+ 鑱婂ぉ鍖猴紙宸﹀垪瀹藉害涓轰箣鍓嶇殑 3/4 鈮?18.75%锛?*/
.content-grid{ display:grid; grid-template-columns: 18.75% 1fr; gap:0; padding:0; height:100%; min-height:0; }
.side-col{ min-height:0; overflow:auto; padding:12px; }
.chat-col{ min-height:0; border-left:1px solid #e5e7eb; }

/* 鍒楄〃鏍峰紡娌跨敤 */
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
/* 绀肩墿鍗＄墖鏍峰紡锛堝脊绐楀唴澶嶇敤锛?*/
.g-card{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:10px; display:flex; flex-direction:column; gap:10px; box-shadow:0 4px 14px rgba(0,0,0,.06); }
.g-thumb{ display:grid; place-items:center; height:110px; background:linear-gradient(135deg,#fff5f7,#fef3c7); border-radius:12px; overflow:hidden; }
.g-thumb img{ width:74px; height:74px; object-fit:contain; }
.g-meta{ display:flex; align-items:center; justify-content:space-between; font-weight:800; }
.g-name{ color:#111827; font-size:14px; }
.g-price{ color: var(--brand-main, #e67a88); font-size:14px; }
.g-send{ height:34px; border-radius:10px; background: var(--brand-main, #e67a88); color:#fff; font-weight:800; }
.g-send:hover{ filter:brightness(1.06); }

/* 閫変腑鏂囨湰缈昏瘧鎮诞 UI */
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

/* 绀肩墿姘旀场闈㈡澘锛堥敋瀹氭寜閽級 */
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

/* 鍗曟潯娑堟伅缈昏瘧鑿滃崟 */
.msgtr-menu{ background:#fff; border:1px solid #e5e7eb; border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.14); padding:8px; width:200px; }
.msgtr-menu .msgtr-head{ font-size:12px; color:#64748b; font-weight:800; padding:4px 8px 6px; }
.msgtr-menu .msgtr-list{ display:flex; flex-direction:column; gap:6px; }
.msgtr-menu .msgtr-item{ text-align:left; padding:8px 10px; border-radius:8px; border:0; background:#fff; font-weight:800; }
.msgtr-menu .msgtr-item:hover{ background:#f9fafb; }

/* 快捷内容浮动面板 */
.quickbox{ width:220px; font-size:13px; }
.quickbox .qb-toggle{ width:100%; padding:8px 12px; border-radius:14px; background:#fff; border:1px solid #e5e7eb; font-weight:800; box-shadow:0 4px 16px rgba(0,0,0,.08); display:flex; align-items:center; justify-content:space-between; }
.quickbox .qb-toggle:hover{ background:#f9fafb; }
.quickbox .qb-count{ background: var(--brand-main,#e67a88); color:#fff; padding:0 8px; border-radius:999px; font-size:11px; font-weight:900; line-height:20px; }
.quickbox .qb-panel{ margin-top:8px; background:#fff; border:1px solid #e5e7eb; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,.14); overflow:hidden; display:flex; flex-direction:column; }
.quickbox .qb-head{ display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #f1f5f9; }
.quickbox .qb-title{ font-weight:900; color:#111827; }
.quickbox .qb-actions{ display:flex; gap:6px; }
.quickbox .qb-btn{ width:28px; height:28px; border-radius:8px; border:0; background:#f8fafc; font-size:15px; display:grid; place-items:center; }
.quickbox .qb-btn:hover{ background:#eef2f7; }
.quickbox .qb-body{ padding:10px; max-height:240px; overflow:auto; display:flex; flex-wrap:wrap; gap:6px; }
.quickbox .qb-chip{ padding:6px 10px; background:#fff; border:1px solid #e5e7eb; border-radius:10px; font-weight:700; cursor:pointer; max-width:100%; word-break:break-word; }
.quickbox .qb-chip:hover{ background:#f9fafb; }
.quickbox .qb-empty{ padding:20px 12px; text-align:center; color:#64748b; font-weight:600; }
.quickbox .qb-edit{ padding:10px 10px 12px; display:flex; flex-direction:column; gap:8px; }
.quickbox .qb-textarea{ width:100%; border:1px solid #e5e7eb; border-radius:12px; padding:8px 10px; resize:vertical; font-size:13px; line-height:1.4; font-weight:600; }
.quickbox .qb-textarea:focus{ outline:none; border-color:#d4d4d8; box-shadow:0 0 0 2px rgba(230,122,136,.25); }
.quickbox .qb-foot{ display:flex; gap:10px; }
.quickbox .qb-save{ flex:1; border:0; background: var(--brand-main,#e67a88); color:#fff; font-weight:800; padding:8px 0; border-radius:12px; }
.quickbox .qb-save:hover{ filter:brightness(1.06); }
.quickbox .qb-cancel{ flex:1; border:0; background:#f8fafc; color:#111; font-weight:800; padding:8px 0; border-radius:12px; }
.quickbox .qb-cancel:hover{ background:#eef2f7; }
.quickbox .qb-error{ color:#dc2626; font-size:12px; font-weight:700; }
@media (max-width:640px){
  .quickbox{ width:170px; right:8px; }
  .quickbox .qb-panel{ font-size:12px; }
  .quickbox .qb-body{ max-height:180px; }
}
</style>

<style>
/* 鑳屾櫙瀹屽叏鐢卞悗绔繑鍥炵殑 URL 鎺у埗锛屼笉鍐嶄粠鍓嶇鍐欐 */
/* 鍏ㄥ眬锛歟moji 閫夋嫨鍣ㄥ瑙傞€傞厤锛堟渶灏忓寲鏍峰紡锛岄伩鍏嶇洿鎺ヤ緷璧栧寘鍐?CSS 璺緞锛?*/
.emoji-picker{ box-shadow: 0 10px 30px rgba(0,0,0,.15); border-radius:12px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); background:#fff; border:1px solid rgba(17,24,39,0.06); }
.emoji-picker .emoji-picker__search-container{ padding:8px; border-bottom:1px solid rgba(17,24,39,0.06); }
.emoji-picker .emoji-picker__search{ width:100%; height:32px; border:1px solid #e5e7eb; border-radius:8px; padding:0 10px; }
.emoji-picker .emoji-picker__category-buttons{ display:flex; gap:6px; padding:6px; border-bottom:1px solid rgba(17,24,39,0.06); }
.emoji-picker .emoji-picker__emojis{ max-height:260px; overflow:auto; padding:6px; display:grid; grid-template-columns: repeat(8, 1fr); gap:6px; }
.emoji-picker .emoji-picker__emoji{ display:grid; place-items:center; width:32px; height:32px; border-radius:6px; cursor:pointer; }
.emoji-picker .emoji-picker__emoji:hover{ background:#f3f4f6; }
</style>





