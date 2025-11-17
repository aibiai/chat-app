<template>
  <div class="relative min-h-screen">
    <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" style="background-image:url('/bg-sakura.jpg'), url('https://source.unsplash.com/1600x900/?nature'), url('https://picsum.photos/1600/900?blur=3');"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/25 to-black/40"></div>

    <div class="relative z-10 container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-5">
      <!-- 左侧：菜单 -->
      <aside class="md:col-span-3">
        <div class="panel p-0">
          <ul class="side">
            <li class="side-item">
              <span class="ico" aria-hidden="true">
                <!-- 徽章/会员中心 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2l3 6 6 .9-4.5 4.1L18 20l-6-3.2L6 20l1.5-7L3 8.9 9 8l3-6z"/></svg>
              </span>
              <span>{{ t('settings.menu.vipCenter') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='visitors'}" @click="rightTab='visitors'">
              <span class="ico" aria-hidden="true">
                <!-- 访客/眼睛 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/></svg>
              </span>
              <span>{{ t('settings.menu.visitors') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='likes' && likesTab==='likedMe'}" @click="openLikes('likedMe')">
              <span class="ico" aria-hidden="true">
                <!-- 喜欢我的：爱心 + 加号 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 21s-6.7-4.6-9.2-9.2C1.3 8.2 3.5 5 6.8 5c1.9 0 3.4 1.1 4.2 2.6C11.8 6.1 13.3 5 15.2 5c3.3 0 5.5 3.2 6 6.8C18.7 16.4 12 21 12 21z"/>
                  <rect x="15.5" y="6.5" width="6" height="1.8" rx="0.9"/>
                  <rect x="18.1" y="4" width="1.8" height="6" rx="0.9"/>
                </svg>
              </span>
              <span>{{ t('settings.menu.likedMe') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='likes' && likesTab==='myLikes'}" @click="openLikes('myLikes')">
              <span class="ico" aria-hidden="true">
                <!-- 我喜欢的：爱心 + 勾 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M12 21s-6.7-4.6-9.2-9.2C1.3 8.2 3.5 5 6.8 5c1.9 0 3.4 1.1 4.2 2.6C11.8 6.1 13.3 5 15.2 5c3.3 0 5.5 3.2 6 6.8C18.7 16.4 12 21 12 21z"/>
                  <path d="M16.2 9.8l-3 3-1.4-1.4-1.2 1.2 2.6 2.6 4.2-4.2z"/>
                </svg>
              </span>
              <span>{{ t('settings.menu.myLikes') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='conversations'}" @click="rightTab='conversations'">
              <span class="ico" aria-hidden="true">
                <!-- 会话列表：气泡对话 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M4 4h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-5 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
              </span>
              <span>{{ t('chat.recent.title') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='gift'}" @click="rightTab='gift'">
              <span class="ico" aria-hidden="true">
                <!-- 礼物盒子：与导航一致的盒子图标 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <rect x="4" y="9" width="16" height="11" rx="2"/>
                  <rect x="3" y="7" width="18" height="2" rx="1"/>
                  <rect x="11" y="9" width="2" height="11"/>
                  <rect x="5.2" y="2.2" width="5.2" height="3.6" rx="1.8"/>
                  <rect x="13.6" y="2.2" width="5.2" height="3.6" rx="1.8"/>
                  <rect x="10.4" y="4" width="3.2" height="2.8" rx="1.4"/>
                </svg>
              </span>
              <span>{{ t('nav.giftBox') }}</span>
            </li>
            <li class="side-item" @click="openVip">
              <span class="ico" aria-hidden="true">
                <!-- 升级 VIP：皇冠 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 7l4 4 5-7 5 7 4-4v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"/></svg>
              </span>
              <span>{{ t('nav.upgrade') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='verify'}" @click="rightTab='verify'">
              <span class="ico" aria-hidden="true">
                <!-- 认证：盾牌对勾 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2l8 3v6c0 5.25-3.5 9.75-8 11-4.5-1.25-8-5.75-8-11V5l8-3z"/><path d="M10.2 12.6l-2-2 1.4-1.4 1.2 1.2 3.6-3.6 1.4 1.4-5.6 5.6z"/></svg>
              </span>
              <span>{{ t('settings.menu.verify') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='profile'}" @click="rightTab='profile'">
              <span class="ico" aria-hidden="true">
                <!-- 编辑资料：铅笔 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34a1.25 1.25 0 0 0 0-1.77l-2.98-2.98a1.25 1.25 0 0 0-1.77 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              </span>
              <span>{{ t('settings.menu.editProfile') }}</span>
            </li>
            <li class="side-item" :class="{active: rightTab==='settings'}" @click="rightTab='settings'">
              <span class="ico" aria-hidden="true">
                <!-- 设置：齿轮 -->
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.41l-.36 2.54c-.58.22-1.12.52-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.72 7.97a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.42 1.05.72 1.63.94l.36 2.54c.05.24.25.41.49.41h3.8c.24 0 .44-.17.49-.41l.36-2.54c.58-.22 1.12-.52 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>
              </span>
              <span>{{ t('settings.menu.settings') }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <!-- 右侧：内容 -->
  <section class="md:col-span-9 space-y-5">
        <!-- 头部卡片：头像、昵称、会员、余额 -->
        <div class="panel flex items-center justify-between">
          <div class="flex items-center gap-4">
            <AvatarImg :src="me?.avatarUrl || ''" :gender="(me?.gender as any)" :size="70" />
            <div>
              <div class="flex items-center gap-2">
                <h2 class="name">{{ me?.nickname || t('common.unnamed') }}</h2>
                <span class="badge">{{ currentVipText }}</span>
              </div>
              <div class="muted text-sm"><button class="link" @click="rightTab='profile'">{{ t('settings.actions.editProfile') }}</button></div>
            </div>
          </div>
          <div class="text-right">
            <div class="muted text-xs">{{ t('settings.balance.title') }}</div>
            <div class="amount">{{ balanceText }} <span class="unit">{{ t('settings.balance.unit') }}</span> <span class="status">{{ t('chat.support.online') }}</span></div>
          </div>
        </div>

  <!-- 右侧内容：我的设置 / 基本资料 / 会话列表 / 我的认证 -->
        <div v-if="rightTab==='settings'" class="panel">
          <h3 class="title-row">{{ t('settings.page.title') }}</h3>
          <div class="setting-row">
            <div class="left">
              <div class="row-title">{{ t('settings.page.profileTitle') }}</div>
              <div class="row-desc">{{ t('settings.page.profileDesc') }}</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="privateProfile" @change="savePrivate" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <div class="left">
              <div class="row-title">{{ t('settings.password.title') }}</div>
              <div class="row-desc">{{ t('settings.password.desc') }}</div>
            </div>
            <button class="btn primary" @click="pwdOpen=true">{{ t('settings.password.changeBtn') }}</button>
          </div>
        </div>
        
        <!-- 访客中心 -->
        <div v-else-if="rightTab==='visitors'" class="panel">
          <div class="visit-head">
            <h3 class="gift-title">{{ t('settings.visitors.title') }}</h3>
            <div class="visit-tabs">
              <button class="v-tab" :class="{active: subTab==='whoSeeMe'}" @click="subTab='whoSeeMe'">{{ t('settings.visitors.whoSeeMe') }}</button>
              <button class="v-tab" :class="{active: subTab==='meSeeWho'}" @click="subTab='meSeeWho'">{{ t('settings.visitors.meSeeWho') }}</button>
            </div>
          </div>
          <div class="divider"></div>
          <!-- 访客列表：仅 VIP 可查看；非 VIP 显示开通提示 -->
          <div v-if="isVip && visitList.length" class="likes-grid">
            <div v-for="it in visitList" :key="it.user.id + '-' + it.createdAt" class="likes-card">
              <AvatarImg :src="it.user.avatarUrl || ''" :gender="(it.user.gender as any)" :size="54" />
              <div class="lc-meta">
                <div class="lc-name">{{ it.user.nickname }}</div>
                <div class="lc-sub">{{ formatRelative(it.createdAt) }}</div>
              </div>
              <div class="lc-actions">
                <button class="btn small primary" @click="sayHi(it.user.id)">{{ t('settings.visitors.sayHi') }}</button>
              </div>
            </div>
          </div>
          <div v-else class="visit-empty">
            <div class="icon" v-if="isVip">📝</div>
            <div class="text" v-if="isVip">{{ t('common.noData') }}</div>
            <!-- 非 VIP：统一显示升级提示，不展示占位数据 -->
            <template v-if="!isVip">
              <div class="icon">🔒</div>
              <div class="text">{{ t('settings.visitors.openVipHint') }}</div>
              <button class="visit-btn" type="button" @click="openVip">{{ t('settings.visitors.openVipHint') }}</button>
            </template>
          </div>
          <div class="pager" v-if="isVip && (visitTotalPages>1 || visitPage>1)">
            <button class="pg btn" :disabled="visitPage<=1" @click="setVisitPage(visitPage-1)" :aria-label="t('common.pagination.prev')">‹</button>
            <button class="pg cur">{{ visitPage }}</button>
            <button class="pg btn" :disabled="visitPage>=visitTotalPages" @click="setVisitPage(visitPage+1)" :aria-label="t('common.pagination.next')">›</button>
          </div>
        </div>
        
  <!-- 基本资料表单 -->
        <div v-else-if="rightTab==='profile'" class="panel">
          <h3 class="title-row">{{ t('onboarding.tabs.basic') }}</h3>
          <form @submit.prevent="onSubmitProfile" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- 头像与上传 -->
            <div class="md:col-span-2">
              <div class="flex items-center gap-4">
                <!-- 使用统一 AvatarImg 组件：src 为空时按性别兜底 (/avatars/IMG_0820.PNG 男 /avatars/IMG_0819.PNG 女) -->
                <div
                  class="relative group cursor-pointer select-none"
                  @click="triggerAvatarPick"
                  @keydown.enter.prevent="triggerAvatarPick"
                  @keydown.space.prevent="triggerAvatarPick"
                  tabindex="0"
                  role="button"
                  :aria-label="t('avatar.choose')"
                >
                  <AvatarImg :src="avatarPreview || me?.avatarUrl || ''" :gender="(pf.gender as any)" :size="64" />
                  <div class="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition" aria-hidden="true"></div>
                </div>
                <span v-if="avatarPreview || me?.avatarUrl" class="inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">{{ t('avatar.status.approved') }}</span>
                <FileUpload ref="avatarUploadRef" accept="image/*" :showPreview="false" @change="onAvatarChangeFile" />
              </div>
            </div>
            <FormField :label="t('onboarding.nickname')">
              <BaseInput v-model="pf.nickname" :placeholder="t('form.placeholder.nickname')" :floatLabel="true" />
            </FormField>
            <FormField :label="t('onboarding.gender')">
              <FloatingSelect v-model="pf.gender" :floatLabel="false" disabled>
                <option value="male">{{ t('auth.gender.male') }}</option>
                <option value="female">{{ t('auth.gender.female') }}</option>
                <option value="other">{{ t('auth.gender.other') }}</option>
              </FloatingSelect>
            </FormField>
            <FormField :label="t('onboarding.birthday')">
              <div class="grid grid-cols-3 gap-2">
                <FloatingSelect v-model="birthYear" :floatLabel="false"><option v-for="y in years" :key="y" :value="String(y)">{{ y }}</option></FloatingSelect>
                <FloatingSelect v-model="birthMonth" :floatLabel="false"><option v-for="m in months" :key="m" :value="String(m)">{{ m }}</option></FloatingSelect>
                <FloatingSelect v-model="birthDay" :floatLabel="false"><option v-for="d in days" :key="d" :value="String(d)">{{ d }}</option></FloatingSelect>
              </div>
            </FormField>
            <FormField :label="t('onboarding.zodiac')">
              <FloatingSelect v-model="pf.zodiac" :floatLabel="false">
                <option :value="''" disabled>{{ t('form.placeholder.selectZodiac') }}</option>
                <option v-for="code in zodiacCodes" :key="code" :value="code">{{ zodiacLabel(code) }}</option>
              </FloatingSelect>
            </FormField>
            <FormField :label="t('onboarding.height')">
              <FloatingSelect v-model="heightSelect" :floatLabel="false">
                <option :value="''" disabled>{{ t('form.placeholder.selectHeight') }}</option>
                <option v-for="h in heightOptions" :key="h" :value="String(h)">{{ h }} cm</option>
              </FloatingSelect>
            </FormField>
            <FormField :label="t('onboarding.weight')">
              <FloatingSelect v-model="weightSelect" :floatLabel="false">
                <option :value="''" disabled>{{ t('form.placeholder.selectWeight') }}</option>
                <option v-for="opt in weightOptions" :key="opt.value" :value="String(opt.value)">{{ opt.label }}</option>
              </FloatingSelect>
            </FormField>
            <FormField :label="t('onboarding.education')">
              <FloatingSelect v-model="pf.education" :floatLabel="false">
                <option :value="''" disabled>{{ t('form.placeholder.selectEducation') }}</option>
                <option v-for="code in educationCodes" :key="code" :value="code">{{ educationLabel(code) }}</option>
              </FloatingSelect>
            </FormField>
            <FormField :label="t('onboarding.marital')">
              <FloatingSelect v-model="pf.marital" :floatLabel="false">
                <option :value="''" disabled>{{ t('form.placeholder.selectMarital') }}</option>
                <option v-for="code in maritalCodes" :key="code" :value="code">{{ maritalLabel(code) }}</option>
              </FloatingSelect>
            </FormField>
            <div class="md:col-span-2 flex gap-3">
              <button type="button" class="btn" @click="rightTab='settings'">{{ t('common.back') }}</button>
              <button type="submit" class="btn primary" :disabled="saving">{{ t('common.save') }}</button>
            </div>
          </form>
        </div>

        <!-- 会话列表（消息中心） -->
        <div v-else-if="rightTab==='conversations'" class="panel">
          <h3 class="title-row">{{ t('settings.conversations.title') }}</h3>
          <div class="divider"></div>
          <div v-if="convList.length" class="conv-list">
            <div v-for="c in convList" :key="c.peerId" class="conv-item" @click="openConversation(c)">
              <div class="conv-avatar">
                <AvatarImg :src="c.peer.avatarUrl || ''" :gender="(c.peer.gender as any)" :size="44" />
                <span v-if="c.unread>0" class="badge-unread">{{ c.unread > 99 ? '99+' : c.unread }}</span>
              </div>
              <div class="conv-meta">
                <div class="conv-top">
                  <span class="conv-name">{{ c.peer.nickname }}</span>
                  <span class="conv-time">{{ formatRelative(c.lastAt) }}</span>
                </div>
                <div class="conv-msg" :title="c.lastContent">{{ c.lastContent }}</div>
              </div>
            </div>
          </div>
          <div v-else class="conv-empty">
            <div class="icon">🗒️</div>
            <div class="text">{{ t('common.noData') }}</div>
          </div>
        </div>

        <!-- 喜欢：根据左侧入口仅保留单一子标签（喜欢我的 或 我喜欢的） -->
        <div v-else-if="rightTab==='likes'" class="panel">
          <div class="likes-head">
            <span v-if="likesScope==='likedMe'" class="likes-tab active">{{ t('settings.likes.likedMe') }}</span>
            <span v-else class="likes-tab active">{{ t('settings.likes.myLikes') }}</span>
          </div>
          <!-- 顶部提示条：仅“我喜欢的”显示提示 -->
          <div class="likes-tip" v-if="likesTab==='myLikes'">{{ t('settings.likes.tipMyLikes') }}</div>
          <div class="divider"></div>
          <!-- 喜欢我的：真实列表 + 空态 + 分页 -->
          <div v-if="likesTab==='likedMe'">
            <div v-if="likesList.length" class="likes-grid">
              <div v-for="it in likesList" :key="it.user.id + '-' + it.createdAt" class="likes-card">
                <AvatarImg :src="it.user.avatarUrl || ''" :gender="(it.user.gender as any)" :size="54" />
                <div class="lc-meta">
                  <div class="lc-name">{{ it.user.nickname }}</div>
                  <div class="lc-sub">{{ formatRelative(it.createdAt) }}</div>
                </div>
                <div class="lc-actions">
                  <button class="btn small primary" @click="sayHi(it.user.id)">{{ t('settings.likes.sayHi') }}</button>
                  <button class="btn small" @click="unlike(it.user.id)">{{ t('settings.likes.unlike') }}</button>
                </div>
              </div>
            </div>
            <div v-else class="likes-empty">
              <div class="icon">📝</div>
              <div class="text">{{ t('common.noData') }}</div>
              <button v-if="!isVip" class="likes-btn" type="button" @click="openVip">{{ t('settings.likes.openVipHint') }}</button>
            </div>
            <div class="pager" v-if="likesTotalPages>1 || likesPage>1">
              <button class="pg btn" :disabled="likesPage<=1" @click="setLikesPage(likesPage-1)" :aria-label="t('common.pagination.prev')">‹</button>
              <button class="pg cur">{{ likesPage }}</button>
              <button class="pg btn" :disabled="likesPage>=likesTotalPages" @click="setLikesPage(likesPage+1)" :aria-label="t('common.pagination.next')">›</button>
            </div>
          </div>
          <!-- 我喜欢的：真实列表 + 空态 + 分页 -->
          <div v-else-if="likesTab==='myLikes'">
            <div v-if="likesList.length" class="likes-grid">
              <div v-for="it in likesList" :key="it.user.id + '-' + it.createdAt" class="likes-card">
                <AvatarImg :src="it.user.avatarUrl || ''" :gender="(it.user.gender as any)" :size="54" />
                <div class="lc-meta">
                  <div class="lc-name">{{ it.user.nickname }}</div>
                  <div class="lc-sub">{{ formatRelative(it.createdAt) }}</div>
                </div>
                <div class="lc-actions">
                  <button class="btn small primary" @click="sayHi(it.user.id)">{{ t('settings.likes.sayHi') }}</button>
                  <button class="btn small" @click="unlike(it.user.id)">{{ t('settings.likes.unlike') }}</button>
                </div>
              </div>
            </div>
            <div v-else class="likes-empty">
              <div class="icon">📝</div>
              <div class="text">{{ t('common.noData') }}</div>
              <button v-if="!isVip" class="likes-btn" type="button" @click="openVip">{{ t('settings.likes.openVipHint') }}</button>
            </div>
            <div class="pager" v-if="likesTotalPages>1 || likesPage>1">
              <button class="pg btn" :disabled="likesPage<=1" @click="setLikesPage(likesPage-1)" :aria-label="t('common.pagination.prev')">‹</button>
              <button class="pg cur">{{ likesPage }}</button>
              <button class="pg btn" :disabled="likesPage>=likesTotalPages" @click="setLikesPage(likesPage+1)" :aria-label="t('common.pagination.next')">›</button>
            </div>
          </div>
          
        </div>

        <!-- 礼物盒子（只保留主列表；移除右侧红框内容） -->
        <div v-else-if="rightTab==='gift'" class="grid grid-cols-1">
          <div class="panel">
            <div class="gift-head">
              <h3 class="gift-title">{{ t('settings.gift.title') }}</h3>
              <div class="gift-tabs">
                <button type="button" class="g-tab" :class="{active: giftTab==='received'}" @click="switchGiftTab('received')">{{ t('settings.gift.received') }}</button>
                <button type="button" class="g-tab" :class="{active: giftTab==='sent'}" @click="switchGiftTab('sent')">{{ t('settings.gift.sent') }}</button>
              </div>
            </div>
            <div class="divider"></div>
            <!-- 列表 -->
            <div v-if="giftList.length" class="gift-list">
              <div v-for="rec in giftList" :key="rec.id" class="gift-item">
                <img class="g-img" :src="rec.giftImg" :alt="rec.giftName" />
                <div class="g-meta">
                  <div class="g-title">
                    <span class="g-name">{{ rec.giftName }}</span>
                    <span class="g-price">¥{{ rec.price }}</span>
                  </div>
                  <div class="g-sub">
                    <template v-if="giftTab==='received'">{{ t('settings.gift.from', { name: peerName(rec.fromUserId) }) }}</template>
                    <template v-else>{{ t('settings.gift.to', { name: peerName(rec.toUserId) }) }}</template>
                    · <span class="g-time">{{ formatTime(rec.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 空态 -->
            <div v-else class="empty gift-empty">
              <div class="icon">🎁</div>
              <div class="text">{{ giftTab==='received' ? t('settings.gift.emptyReceived') : t('settings.gift.emptySent') }}</div>
            </div>
            <!-- 分页 -->
            <div class="pager" v-if="totalPages > 1 || page > 1">
              <button class="pg btn" :disabled="page<=1" @click="goPage(page-1)" :aria-label="t('common.pagination.prev')">‹</button>
              <button class="pg cur" aria-current="page">{{ page }}</button>
              <button class="pg btn" :disabled="page>=totalPages" @click="goPage(page+1)" :aria-label="t('common.pagination.next')">›</button>
            </div>
          </div>
        </div>

        <!-- 我的认证 -->
        <div v-else class="panel">
          <h3 class="title-row">{{ t('settings.verify.title') }}</h3>
          <form class="grid grid-cols-1 gap-4" @submit.prevent="onSubmitIdentity">
            <!-- 审核状态提示 -->
            <div v-if="identityStatus !== 'none'">
              <span class="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full"
                :class="{
                  'bg-yellow-50 text-yellow-700 border border-yellow-200': identityStatus==='pending',
                  'bg-green-50 text-green-700 border border-green-200': identityStatus==='approved',
                  'bg-red-50 text-red-700 border border-red-200': identityStatus==='rejected',
                }">
                <span v-if="identityStatus==='pending'">{{ t('onboarding.status.pending') }}</span>
                <span v-else-if="identityStatus==='approved'">{{ t('onboarding.status.approved') }}</span>
                <span v-else>{{ t('onboarding.status.rejected') }}</span>
              </span>
              <p v-if="identityStatus==='rejected' && identityReason" class="text-xs text-red-500 mt-1">{{ t('common.reason') }}{{ identityReason }}</p>
            </div>

            <FormField :label="t('onboarding.realName')">
              <BaseInput v-model="realName" :placeholder="t('form.placeholder.realName')" :floatLabel="false" :disabled="identityDisabled" />
            </FormField>

            <FormField :label="t('settings.verify.upload')">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="block text-sm mb-1">{{ t('onboarding.idFront') }}</label>
                  <FileUpload accept="image/*" v-model="idFiles.front" :showPreview="true" :previewSize="52" :disabled="identityDisabled" />
                </div>
                <div>
                  <label class="block text-sm mb-1">{{ t('onboarding.idBack') }}</label>
                  <FileUpload accept="image/*" v-model="idFiles.back" :showPreview="true" :previewSize="52" :disabled="identityDisabled" />
                </div>
                <div>
                  <label class="block text-sm mb-1">{{ t('onboarding.selfie') }}</label>
                  <FileUpload accept="image/*" v-model="idFiles.selfie" :showPreview="true" :previewSize="52" :disabled="identityDisabled" />
                </div>
              </div>
            </FormField>

            <div class="flex gap-3">
              <button type="button" class="btn" @click="rightTab='settings'">{{ t('common.back') }}</button>
              <button type="submit" class="btn primary" :disabled="idLoading || identityStatus==='pending' || identityStatus==='approved'">
                {{ idLoading
                  ? t('common.submitting')
                  : identityStatus==='pending'
                    ? t('onboarding.status.pending')
                    : identityStatus==='approved'
                      ? t('onboarding.status.approved')
                      : identityStatus==='rejected'
                        ? t('settings.verify.resubmit')
                        : t('settings.verify.submit')
                }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>

    <!-- 升级 VIP 弹窗 -->
    <VipModal v-model="vipOpen" :current-level="currentVipText" :diamond-icon="'/vip/diamond.png'" :crown-icon="'/vip/crown.webp'" @confirm="onVipConfirm" />

    <!-- 修改密码弹窗 -->
    <div v-if="pwdOpen" class="modal-overlay" @click.self="pwdOpen=false">
      <div class="modal">
        <div class="modal-head"><h3>{{ t('settings.password.title') }}</h3><button class="close" @click="pwdOpen=false">×</button></div>
        <form @submit.prevent="submitPwd">
          <div class="form-row">
            <label>{{ t('settings.password.old') }}</label>
            <div class="input-wrap">
              <input v-model.trim="pwd.old" :type="show.old ? 'text' : 'password'" required />
              <button type="button" class="eye" @click="show.old = !show.old" :aria-pressed="show.old" :aria-label="t('settings.password.toggleOld')">
                <svg v-if="!show.old" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
                <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 4.27 3.28 3l18.5 18.5L20.5 23l-2.7-2.7A13.3 13.3 0 0 1 12 19c-7 0-11-7-11-7a20.4 20.4 0 0 1 5.07-5.57L2 4.27ZM12 7a5 5 0 0 1 5 5 5 5 0 0 1-.62 2.4L9.6 7.62A5 5 0 0 1 12 7Zm0 10c1.5 0 2.87-.37 4.06-.94l-2.27-2.27c-.51 .13-1.04 .21-1.79 .21a5 5 0 0 1-5-5c0-.75 .08-1.28 .21-1.79L4.94 7.94C4.37 9.13 4 10.5 4 12c0 0 4 5 8 5Z"/></svg>
              </button>
            </div>
          </div>
          <div class="form-row">
            <label>{{ t('settings.password.new') }}</label>
            <div class="input-wrap">
              <input v-model.trim="pwd.next" :type="show.next ? 'text' : 'password'" required minlength="8" @input="recalcStrength" />
              <button type="button" class="eye" @click="show.next = !show.next" :aria-pressed="show.next" :aria-label="t('settings.password.toggleNew')">
                <svg v-if="!show.next" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
                <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 4.27 3.28 3l18.5 18.5L20.5 23l-2.7-2.7A13.3 13.3 0 0 1 12 19c-7 0-11-7-11-7a20.4 20.4 0 0 1 5.07-5.57L2 4.27ZM12 7a5 5 0 0 1 5 5 5 5 0 0 1-.62 2.4L9.6 7.62A5 5 0 0 1 12 7Zm0 10c1.5 0 2.87-.37 4.06-.94l-2.27-2.27c-.51 .13-1.04 .21-1.79 .21a5 5 0 0 1-5-5c0-.75 .08-1.28 .21-1.79L4.94 7.94C4.37 9.13 4 10.5 4 12c0 0 4 5 8 5Z"/></svg>
              </button>
            </div>
            <!-- 强度提示 -->
            <div class="strength">
              <div class="bar">
                <span :class="{ on: strength.score >= 1, weak: true }"></span>
                <span :class="{ on: strength.score >= 2, medium: true }"></span>
                <span :class="{ on: strength.score >= 3, strong: true }"></span>
              </div>
              <div class="strength-text">{{ t('settings.password.strength') }}<b :class="strength.class">{{ strength.label }}</b></div>
              <ul class="checklist">
                <li :class="{ ok: checks.len8 }">{{ t('settings.password.ruleLen8') }}</li>
                <li :class="{ ok: checks.alnum }">{{ t('settings.password.ruleAlnum') }}</li>
              </ul>
            </div>
          </div>
          <div class="form-row">
            <label>{{ t('settings.password.confirm') }}</label>
            <div class="input-wrap">
              <input v-model.trim="pwd.confirm" :type="show.confirm ? 'text' : 'password'" required minlength="8" />
              <button type="button" class="eye" @click="show.confirm = !show.confirm" :aria-pressed="show.confirm" :aria-label="t('settings.password.toggleConfirm')">
                <svg v-if="!show.confirm" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>
                <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2 4.27 3.28 3l18.5 18.5L20.5 23l-2.7-2.7A13.3 13.3 0 0 1 12 19c-7 0-11-7-11-7a20.4 20.4 0 0 1 5.07-5.57L2 4.27ZM12 7a5 5 0 0 1 5 5 5 5 0 0 1-.62 2.4L9.6 7.62A5 5 0 0 1 12 7Zm0 10c1.5 0 2.87-.37 4.06-.94l-2.27-2.27c-.51 .13-1.04 .21-1.79 .21a5 5 0 0 1-5-5c0-.75 .08-1.28 .21-1.79L4.94 7.94C4.37 9.13 4 10.5 4 12c0 0 4 5 8 5Z"/></svg>
              </button>
            </div>
          </div>
          <p v-if="pwdError" class="err">{{ pwdError }}</p>
          <div class="actions">
            <button type="button" class="btn" @click="pwdOpen=false">{{ t('common.cancel') }}</button>
            <button type="submit" class="btn primary" :disabled="pwdLoading">{{ pwdLoading? t('common.submitting') : t('common.submit') }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watchEffect, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AvatarImg from '../components/AvatarImg.vue'
import VipModal from '../components/VipModal.vue'
import api from '../api'
import BaseInput from '../components/BaseInput.vue'
import FloatingSelect from '../components/FloatingSelect.vue'
import FormField from '../components/FormField.vue'
import FileUpload from '../components/FileUpload.vue'
import { useAuth } from '../stores'

const router = useRouter()
const auth = useAuth()
function go(path: string){ router.push(path) }
const { t } = useI18n()

type Gender = 'male'|'female'|'other'
type ProfileDraft = Partial<{ nickname: string; birthday: string; zodiac: string; education: string; maritalStatus: 'single'|'married'; height: number; weight: number; weightRange: [number, number] }>
interface Me { id: string; email?: string; nickname?: string; gender?: Gender; avatarUrl?: string; membershipLevel?: 'purple'|'crown'|'none'; membershipUntil?: number; privateProfile?: boolean; balance?: number; birthday?: string; zodiac?: string; education?: string; maritalStatus?: 'single'|'married'; height?: number; weightRange?: [number, number]; profileDraft?: ProfileDraft }
const me = ref<Me | null>(null)
async function fetchMe(){
  try{ const { data } = await api.get('/api/users/me'); me.value = data } catch {}
}
onMounted(fetchMe)

const currentVipText = computed(() => {
  const lvl = me.value?.membershipLevel || 'none'
  const key = lvl === 'purple' ? 'vip.tier.purple' : (lvl === 'crown' ? 'vip.tier.crown' : 'vip.tier.none')
  return t(key)
})

const activeTab = ref<'center'|'visitors'>('center')
const subTab = ref<'whoSeeMe'|'meSeeWho'>('whoSeeMe')

const vipOpen = ref(false)
function openVip(){ vipOpen.value = true }
// 是否有效 VIP（等级非 none 且未过期）
const isVip = computed(() => {
  const lvl = me.value?.membershipLevel || 'none'
  const until = me.value?.membershipUntil || 0
  return lvl !== 'none' && until > Date.now()
})
// 开通/续费 VIP：与后端打通
async function onVipConfirm(payload: any){
  try{
    const nickname = String(payload?.giftNickname || '').trim()
    const tier = payload?.tier === 'crown' ? 'crown' : 'purple'
    let months = Number(payload?.months)
    if (!Number.isFinite(months) || months <= 0){
      const days = Number(payload?.days)
      if (Number.isFinite(days) && days > 0){
        months = Math.max(1, Math.floor(days / 30))
      }else{
        months = 1
      }
    }else{
      months = Math.max(1, Math.floor(months))
    }
    const rawAmount = Number(payload?.usd ?? payload?.amount)
    const amount = Math.max(1, Math.floor(Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : months * 60))
    // 默认在线支付；若余额充足弹窗确认，取消则不下单
    let method: 'online' | 'balance' = 'online'
    const myBalance = Number(me.value?.balance || 0)
    if (myBalance >= amount) {
      const ok = window.confirm(t('settings.upgrade.useBalanceConfirm', { balance: myBalance.toFixed(2), amount: amount }))
      if (!ok) return
      method = 'balance'
    }
    const body: any = { tier, months, amount, method }
    if (nickname) body.giftNickname = nickname
  await api.post('/api/orders/upgrade', body)
  await fetchMe()
  // 通知其它页面（如幸运星）刷新会员等级
  window.dispatchEvent(new CustomEvent('vip-updated'))
    vipOpen.value = false
    if (nickname){
      alert(t('vip.alerts.giftSuccess', { name: nickname }))
      return
    }
    alert(t('vip.alerts.activated'))
    if (rightTab.value === 'likes') fetchLikes()
  }catch(err: any){
    const msg = err?.response?.data?.error
    alert(msg ? String(msg) : t('settings.alerts.vipFailed'))
  }
}
// 设置：私密资料开关与修改密码
const privateProfile = ref(false)
watchEffect(() => { privateProfile.value = !!me.value?.privateProfile })
async function savePrivate(){
  try{
    await api.put('/api/users/me', { privateProfile: privateProfile.value })
    if (me.value) me.value.privateProfile = privateProfile.value
  }catch{
    alert(t('settings.alerts.saveFailed'))
  }
}
// 余额文案
const balanceText = computed(() => ((me.value?.balance ?? 0).toFixed(2)))

// 右侧视图 tab：我的设置 / 基本资料
const rightTab = ref<'settings'|'profile'|'conversations'|'gift'|'likes'|'verify'|'visitors'>('settings')
// likes 区域仅显示一个子范围：likedMe 或 myLikes，用 likesScope 控制头部显示
const likesScope = ref<'likedMe'|'myLikes'>('myLikes')
const likesTab = ref<'likedMe'|'myLikes'>('myLikes')
function openLikes(tab: 'likedMe'|'myLikes'){
  rightTab.value='likes'
  likesScope.value = tab
  if (likesTab.value !== tab){ likesTab.value = tab }
  // 打开时重置分页并拉取
  likesPage.value = 1
  fetchLikes()
}
// 喜欢列表数据
type LikeUser = { user: { id: string; nickname: string; gender: string; avatarUrl?: string }; createdAt: number }
const likesList = ref<LikeUser[]>([])
const likesPage = ref(1)
const likesPageSize = ref(12)
const likesTotal = ref(0)
const likesTotalPages = computed(()=> Math.max(1, Math.ceil(likesTotal.value / likesPageSize.value)))
async function fetchLikes(){
  try{
    const type = likesTab.value === 'likedMe' ? 'likedMe' : 'myLikes'
    const { data } = await api.get('/api/likes/list', { params: { type, page: likesPage.value, pageSize: likesPageSize.value } })
    likesList.value = data?.list || []
    likesTotal.value = data?.total || 0
  }catch{}
}
function setLikesPage(p:number){ if (p>=1 && p<=likesTotalPages.value){ likesPage.value=p; fetchLikes() } }
watchEffect(()=>{ if (rightTab.value==='likes' && (likesTab.value==='likedMe' || likesTab.value==='myLikes')) fetchLikes() })
// 切换 likes 子标签时重置分页并拉取
watch(() => likesTab.value, (nv)=>{
  likesPage.value = 1
  if (rightTab.value==='likes' && (nv==='likedMe' || nv==='myLikes')) fetchLikes()
})

// 监听全局 like/unlike 事件，保证其它页面触发后这里能刷新
function onLikeChanged(){ if (rightTab.value==='likes') fetchLikes() }
onMounted(()=>{ window.addEventListener('like-changed', onLikeChanged) })
onUnmounted(()=>{ window.removeEventListener('like-changed', onLikeChanged) })
async function sayHi(toId: string){ router.push({ name: 'chat', params: { id: toId } }) }
async function unlike(toId: string){ try{ await api.delete(`/api/likes/${toId}`); fetchLikes() }catch{} }
const giftTab = ref<'received'|'sent'>('received')
// 礼物数据
type GiftRecord = { id: string; fromUserId: string; toUserId: string; giftId: string; giftName: string; giftImg: string; price: number; createdAt: number }
const giftList = ref<GiftRecord[]>([])
const peers = ref<Record<string, { id: string; nickname: string; gender: string }>>({})
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = computed(()=> Math.max(1, Math.ceil(total.value / pageSize.value)))
function peerName(uid: string){ return peers.value[uid]?.nickname || t('common.unknownUser') }
function formatTime(ts: number){ const d=new Date(ts); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}` }
async function fetchGifts(){
  try{
    const { data } = await api.get('/api/gifts/records', { params: { type: giftTab.value, page: page.value, pageSize: pageSize.value } })
    giftList.value = data?.list || []
    peers.value = data?.peers || {}
    total.value = data?.total || 0
  }catch{}
}
function switchGiftTab(tab: 'received'|'sent'){ if (giftTab.value!==tab){ giftTab.value=tab; page.value=1; fetchGifts() } }
function goPage(p:number){ if (p>=1 && p<=totalPages.value){ page.value=p; fetchGifts() } }
watchEffect(()=>{ if (rightTab.value==='gift') fetchGifts() })

// 会话列表：最近聊天的用户
type RecentConv = { peerId: string; lastAt: number; lastContent: string; unread: number; peer: { id: string; nickname: string; gender: string; avatarUrl?: string } }
const convList = ref<RecentConv[]>([])
async function fetchRecentConversations(){
  try{ const { data } = await api.get('/api/messages/recent'); convList.value = data?.list || [] }catch{}
}
function openConversation(c: RecentConv){
  // 标记已读，然后跳转
  api.post('/api/messages/read', { peerId: c.peerId }).catch(()=>{})
  router.push({ name: 'chat', params: { id: c.peerId } })
}
function isToday(ts:number){ const d=new Date(ts); const n=new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate() }
function isYesterday(ts:number){ const n=new Date(); const y=new Date(n.getFullYear(), n.getMonth(), n.getDate()-1); const d=new Date(ts); return d.getFullYear()===y.getFullYear() && d.getMonth()===y.getMonth() && d.getDate()===y.getDate() }
function formatRelative(ts:number){ if(isToday(ts)) return t('chat.time.today'); if(isYesterday(ts)) return t('chat.time.yesterday'); return formatTime(ts) }
watchEffect(()=>{ if (rightTab.value==='conversations') fetchRecentConversations() })
// 监听聊天页发出的已读事件，便于返回后自动刷新未读数
function onConvEvent(){ if (rightTab.value==='conversations') fetchRecentConversations() }
onMounted(()=>{ window.addEventListener('conv-read', onConvEvent) })
onUnmounted(()=>{ window.removeEventListener('conv-read', onConvEvent) })

// 访客中心：谁看过我 / 我看过谁
type VisitItem = { user: { id: string; nickname: string; gender: string; avatarUrl?: string }; createdAt: number }
const visitList = ref<VisitItem[]>([])
const visitPage = ref(1)
const visitPageSize = ref(12)
const visitTotal = ref(0)
const visitTotalPages = computed(()=> Math.max(1, Math.ceil(visitTotal.value / visitPageSize.value)))
async function fetchVisits(){
  // 非 VIP 不请求，保持列表为空；当用户升级后 watcher 会触发重新拉取
  if (!isVip.value) { visitList.value = []; visitTotal.value = 0; return }
  try{
    const type = subTab.value === 'meSeeWho' ? 'meSeeWho' : 'whoSeeMe'
    const { data } = await api.get('/api/visits/list', { params: { type, page: visitPage.value, pageSize: visitPageSize.value } })
    visitList.value = data?.list || []
    visitTotal.value = data?.total || 0
  }catch{}
}
function setVisitPage(p:number){ if (p>=1 && p<=visitTotalPages.value){ visitPage.value=p; fetchVisits() } }
watchEffect(()=>{ if (rightTab.value==='visitors') fetchVisits() })
// VIP 状态变化：升级后自动加载访客数据
watch(() => isVip.value, (nv) => { if (nv && rightTab.value==='visitors') fetchVisits() })
watch(() => subTab.value, () => { visitPage.value = 1; if (rightTab.value==='visitors') fetchVisits() })

// 基本资料表单状态
// 移除单一默认头像，改由 AvatarImg 根据性别自动选择默认图片
const pf = ref<{ nickname: string; gender: 'male'|'female'|'other'; zodiac: string; education: string; marital: string }>({ nickname: '', gender: 'male', zodiac: '', education: '', marital: '' })
const avatarPreview = ref('')
function onAvatarChangeFile(file: File | null){
  if (!file) { avatarPreview.value=''; return }
  const r = new FileReader(); r.onload = () => avatarPreview.value = String(r.result||''); r.readAsDataURL(file)
}
// 头像上传组件引用 & 触发函数（点击现有头像打开文件选择框）
const avatarUploadRef = ref<any|null>(null)
function triggerAvatarPick(){ avatarUploadRef.value?.open?.() }
// 生日相关
const now = new Date(); const currentYear = now.getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const birthYear = ref(''); const birthMonth = ref(''); const birthDay = ref('')
const daysInMonth = (y:number,m:number)=> new Date(y,m,0).getDate()
const maxDays = computed(()=>{ const y=Number(birthYear.value); const m=Number(birthMonth.value); if(!y||!m) return 31; return daysInMonth(y,m) })
const days = computed(()=> Array.from({ length: maxDays.value }, (_, i) => i + 1))
watchEffect(()=>{ const d = Number(birthDay.value); if (d && d > maxDays.value) birthDay.value = String(maxDays.value) })
const pad2 = (n:number)=> String(n).padStart(2,'0')
const birthdayAssembled = computed(()=> birthYear.value && birthMonth.value && birthDay.value ? `${birthYear.value}-${pad2(Number(birthMonth.value))}-${pad2(Number(birthDay.value))}` : '')

// 选项
const heightOptions = Array.from({ length: Math.floor((200 - 150) / 5) + 1 }, (_, i) => 150 + i * 5)
const weightRanges = [ {min:40,max:50},{min:50,max:60},{min:60,max:70},{min:70,max:80},{min:80,max:90} ]
const weightOptions = computed(()=> weightRanges.map(r=>({ label: `${r.min}-${r.max} kg`, value: `${r.min},${r.max}` })))
const heightSelect = ref('')
const weightSelect = ref('')
const zodiacCodes = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'] as const
const educationCodes = ['highschool','associate','bachelor','master','doctor','other'] as const
const maritalCodes = ['single','married'] as const
function zodiacLabel(code:string){ return t(`onboarding.zodiacOptions.${code}`) }
function educationLabel(code:string){ return t(`onboarding.educationOptions.${code}`) }
function maritalLabel(code:string){ return code === 'single' ? t('onboarding.maritalOptions.single') : t('onboarding.maritalOptions.married') }

// 进入“编辑资料”时根据 me 预填
// 预填时优先使用草稿中的值
function pick<K extends keyof NonNullable<Me['profileDraft']> & keyof Me>(k: K){
  const u: any = me.value
  if (u && u.profileDraft && u.profileDraft[k] != null) return u.profileDraft[k]
  return u ? u[k] : undefined
}

watchEffect(()=>{
  if (rightTab.value !== 'profile' || !me.value) return
  pf.value.nickname = (pick('nickname') as string) || (me.value.nickname || '')
  pf.value.gender = (me.value.gender as any) || 'male'
  pf.value.zodiac = (pick('zodiac') as string) || ''
  pf.value.education = (pick('education') as string) || ''
  pf.value.marital = ((pick('maritalStatus') as any) || (me.value as any).maritalStatus || (me.value as any).marital || '')
  const b = (pick('birthday') as string) || ((me.value as any).birthday as string | undefined)
  if (b) {
    const m = String(b).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (m) { birthYear.value=m[1]; birthMonth.value=String(Number(m[2])); birthDay.value=String(Number(m[3])) }
  } else { birthYear.value=''; birthMonth.value=''; birthDay.value='' }
  const h = (pick('height') as number | undefined) ?? ((me.value as any).height)
  const wr = (pick('weightRange') as [number, number] | undefined) ?? ((me.value as any).weightRange)
  heightSelect.value = typeof h==='number' ? String(h) : ''
  if (Array.isArray(wr) && wr.length===2) weightSelect.value = `${wr[0]},${wr[1]}`
  else weightSelect.value = ''
  avatarPreview.value = ''
})

const saving = ref(false)
async function onSubmitProfile(){
  if (!pf.value.nickname) { alert(t('form.error.required')); return }
  const heightToSend = heightSelect.value ? Number(heightSelect.value) : undefined
  const weightRangeToSend = weightSelect.value ? (weightSelect.value.split(',').map(n=>Number(n)) as [number,number]) : undefined
  try{
    saving.value = true
    await api.post('/api/review/profile', {
      nickname: pf.value.nickname,
      birthday: birthdayAssembled.value || undefined,
      height: heightToSend,
      weightRange: weightRangeToSend,
      zodiac: pf.value.zodiac || undefined,
      education: pf.value.education || undefined,
      maritalStatus: pf.value.marital || undefined,
    })
    if (avatarPreview.value) {
      try { await api.post('/api/review/avatar', { filePath: avatarPreview.value }) } catch {}
    }
    alert(t('onboarding.submittedNotice'))
    rightTab.value = 'settings'
  } finally { saving.value = false }
}

// 我的认证
type IdentityStatus = 'none'|'pending'|'approved'|'rejected'
const identityStatus = ref<IdentityStatus>('none')
const identityReason = ref('')
const realName = ref('')
const idFiles = reactive<{ front: File | null; back: File | null; selfie: File | null }>({ front: null, back: null, selfie: null })
const idLoading = ref(false)
let idStatusTimer: number | null = null
const identityDisabled = computed(() => identityStatus.value==='pending' || identityStatus.value==='approved')

async function loadIdentityStatus(){
  try{
    const { data } = await api.get('/api/review/status', { params: { type: 'identity' } })
    const st = (data?.status || 'none') as IdentityStatus
    // 若无记录但用户已认证，通过 me 兜底
    const verified = (me.value as any)?.identityVerified
    identityStatus.value = (st === 'none' && verified) ? 'approved' : st
    identityReason.value = data?.reason || ''
  }catch{}
}

watchEffect(() => { if (rightTab.value === 'verify') loadIdentityStatus() })

// 若停留在认证页且处于待审核状态，开启轻量轮询，自动刷新“已审核”状态
watch([rightTab, identityStatus], ([tab, st]) => {
  if (tab === 'verify' && st === 'pending') {
    if (!idStatusTimer) {
      idStatusTimer = window.setInterval(loadIdentityStatus, 15000) as unknown as number
    }
  } else {
    if (idStatusTimer) { clearInterval(idStatusTimer); idStatusTimer = null }
  }
})
// 被驳回后清空上次预览，便于重新选择
watch(identityStatus, (st) => {
  if (st === 'rejected') {
    idFiles.front = null; idFiles.back = null; idFiles.selfie = null
  }
})
onUnmounted(() => { if (idStatusTimer) { clearInterval(idStatusTimer); idStatusTimer = null } })

function toB64(f: File){ return new Promise<string>(resolve => { const r = new FileReader(); r.onload=()=>resolve(String(r.result||'')); r.readAsDataURL(f) }) }
async function onSubmitIdentity(){
  if (!realName.value.trim()) { alert(t('form.error.required')); return }
  if (!idFiles.front || !idFiles.back || !idFiles.selfie) { alert(t('settings.verify.need3Photos')) ; return }
  try{
    idLoading.value = true
    const [idFrontPath, idBackPath, selfiePath] = await Promise.all([toB64(idFiles.front), toB64(idFiles.back), toB64(idFiles.selfie)])
    await api.post('/api/review/identity', { idFrontPath, idBackPath, selfiePath, realName: realName.value.trim() })
    identityStatus.value = 'pending'
    alert(t('settings.verify.submitted'))
    // 提交后留在本页，按钮文案切换为“待审核”；由轮询或再次进入页面自动更新为“已审核”
  } catch(e:any){
    const msg = e?.response?.data?.error || t('common.submitFailed')
    alert(String(msg))
  } finally { idLoading.value = false }
}

// 修改密码弹窗与表单
const pwdOpen = ref(false)
const pwd = ref({ old: '', next: '', confirm: '' })
const pwdLoading = ref(false)
const pwdError = ref('')
const show = ref({ old: false, next: false, confirm: false })

const checks = ref({ len8: false, alnum: false })
const strength = ref({ score: 0, label: t('settings.password.levelWeak'), class: 'weak' })
function recalcStrength(){
  const v = pwd.value.next || ''
  const nextChecks = {
    len8: v.length >= 8,
    alnum: /[A-Za-z]/.test(v) && /\d/.test(v)
  }
  checks.value = nextChecks
  let s = 0
  if (nextChecks.len8) s++
  if (nextChecks.alnum) s++
  // 三档：0/1/2
  const label = s === 0 ? t('settings.password.levelWeak') : s === 1 ? t('settings.password.levelMedium') : t('settings.password.levelStrong')
  const cls = s === 0 ? 'weak' : s === 1 ? 'medium' : 'strong'
  strength.value = { score: s, label, class: cls }
}
watchEffect(recalcStrength)
async function submitPwd(){
  pwdError.value = ''
  if (!pwd.value.old || !pwd.value.next || !pwd.value.confirm) { pwdError.value = t('settings.password.fillAll'); return }
  if (pwd.value.next.length < 8) { pwdError.value = t('settings.password.ruleCombined'); return }
  if (!(/[A-Za-z]/.test(pwd.value.next) && /\d/.test(pwd.value.next))) { pwdError.value = t('settings.password.ruleCombined'); return }
  if (pwd.value.next !== pwd.value.confirm) { pwdError.value = t('form.error.passwordMismatch'); return }
  try{
    pwdLoading.value = true
    await api.post('/api/auth/change-password', { oldPassword: pwd.value.old, newPassword: pwd.value.next })
    pwdLoading.value = false
    pwdOpen.value = false
    pwd.value = { old: '', next: '', confirm: '' }
    alert(t('settings.password.changed'))
    // 将当前邮箱写入本地，便于登录页自动填充
    if (me.value?.email) {
      try { localStorage.setItem('lastLoginEmail', me.value.email) } catch {}
    }
    auth.logout()
    router.push('/login')
  }catch(e:any){
    pwdLoading.value = false
    if (e?.response?.status === 401) { auth.logout(); router.push('/login'); return }
    pwdError.value = e?.response?.data?.error || t('settings.alerts.saveFailed')
  }
}
</script>

<style scoped>
.panel{ background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px; box-shadow:0 8px 22px rgba(0,0,0,.08); }
.side{ list-style:none; margin:0; padding:8px; display:flex; flex-direction:column; gap:4px; }
.side-item{ padding:10px 12px; border-radius:10px; cursor:pointer; font-weight:800; color:#444; display:flex; align-items:center; gap:10px; }
.side-item:hover{ background:#f9fafb; }
.side-item.active{ background:#fff; border:1px solid #f0f2f5; }
.side-item .ico{ width:18px; height:18px; color:#9ca3af; display:inline-flex; align-items:center; justify-content:center; }
.side-item .ico svg{ display:block; width:18px; height:18px; }
.side-item:hover .ico, .side-item.active .ico{ color:#f17384; }
.name{ font-size:18px; font-weight:900; }
.badge{ background:#eef2ff; color:#4f46e5; border-radius:999px; padding:2px 8px; font-size:12px; font-weight:900; }
.muted{ color:#6b7280; font-weight:700; }
.link{ color:#2563eb; font-weight:800; }
.amount{ font-size:18px; font-weight:900; color:#111; }
.amount .unit{ font-size:13px; color:#6b7280; margin-left:4px; }
.amount .status{ font-size:12px; color:#10b981; margin-left:6px; }
.card-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.card-head h3{ font-size:16px; font-weight:900; display:flex; align-items:center; gap:8px; }
.tabs{ display:flex; align-items:center; gap:8px; }
.tab{ height:30px; padding:0 10px; border-radius:999px; background:#f3f4f6; border:1px solid #e5e7eb; font-weight:800; color:#444; }
.tab.active{ background:#fff; color:#f17384; border-color:#f17384; }
.empty{ display:grid; place-items:center; gap:10px; padding:30px 0; color:#6b7280; }
.empty .icon{ font-size:28px; }
.vipbtn{ height:36px; padding:0 16px; border-radius:8px; border:0; background:#fbbf24; color:#111; font-weight:900; }

/* 我的设置 */
.title-row{ font-size:16px; font-weight:900; margin-bottom:8px; }
.setting-row{ display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-top:1px dashed #f0f2f5; }
.setting-row:first-of-type{ border-top:0; }
.row-title{ font-weight:900; color:#333; }
.row-desc{ color:#6b7280; font-weight:700; font-size:13px; }
.btn.primary{ background:#f17384; color:#fff; border:0; }

/* Switch */
.switch{ position:relative; display:inline-block; width:46px; height:26px; }
.switch input{ display:none; }
.slider{ position:absolute; cursor:pointer; inset:0; background:#e5e7eb; border-radius:999px; transition:.2s; }
.slider::before{ content:""; position:absolute; height:20px; width:20px; left:3px; top:3px; background:#fff; border-radius:50%; transition:.2s; box-shadow:0 1px 2px rgba(0,0,0,.2); }
.switch input:checked + .slider{ background:#34d399; }
.switch input:checked + .slider::before{ transform:translateX(20px); }

/* 简单的弹窗样式 */
.modal-overlay{ position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:50; }
.modal{ width:min(520px, 92vw); background:#fff; border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,.18); border:1px solid #e5e7eb; padding:16px; }
.modal-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.modal-head h3{ font-size:16px; font-weight:900; }
.close{ border:0; background:transparent; font-size:20px; cursor:pointer; }
.form-row{ display:flex; flex-direction:column; gap:6px; margin:10px 0; }
.form-row label{ font-weight:800; color:#444; }
.form-row input{ height:38px; border-radius:8px; border:1px solid #e5e7eb; padding:0 38px 0 10px; font-weight:700; }
.input-wrap{ position:relative; }
.input-wrap .eye{ position:absolute; right:8px; top:50%; transform:translateY(-50%); border:0; background:transparent; padding:6px; cursor:pointer; color:#6b7280; }
.actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:8px; }
.btn{ height:36px; padding:0 14px; border-radius:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:800; }
.btn.primary{ background:#f17384; color:#fff; border-color:#f17384; }
.err{ color:#d33; font-weight:800; margin-top:4px; }

/* 强度提示样式 */
.strength{ margin-top:8px; }
.strength .bar{ display:flex; gap:6px; margin-bottom:6px; }
.strength .bar span{ flex:1; height:6px; border-radius:4px; background:#e5e7eb; opacity:.7; }
.strength .bar span.on.weak{ background:#ef4444; opacity:1; }
.strength .bar span.on.medium{ background:#f59e0b; opacity:1; }
.strength .bar span.on.strong{ background:#10b981; opacity:1; }
.strength-text{ font-size:12px; color:#6b7280; font-weight:800; margin-bottom:4px; }
.strength-text b.weak{ color:#ef4444; }
.strength-text b.medium{ color:#f59e0b; }
.strength-text b.strong{ color:#10b981; }
.checklist{ display:flex; flex-wrap:wrap; gap:8px 14px; font-size:12px; color:#6b7280; font-weight:800; }
.checklist li{ position:relative; padding-left:18px; }
.checklist li::before{ content:"×"; position:absolute; left:0; top:-1px; color:#ef4444; font-weight:900; }
.checklist li.ok{ color:#10b981; }
.checklist li.ok::before{ content:"✓"; color:#10b981; }

/* 礼物盒子样式 */
.gift-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
.gift-title{ position:relative; padding-left:10px; font-size:16px; font-weight:900; color:#111; }
.gift-title::before{ content:""; position:absolute; left:0; top:50%; transform:translateY(-50%); width:4px; height:16px; border-radius:999px; background:#f17384; }
.gift-tabs{ display:flex; align-items:center; gap:8px; }
.gift-tabs .g-tab{ height:32px; padding:0 12px; border-radius:8px; background:#f9fafb; border:1px solid #e5e7eb; font-weight:800; color:#444; transition:.15s; }
.gift-tabs .g-tab:hover{ background:#fff; }
.gift-tabs .g-tab.active{ background:#fff; color:#f17384; border-color:#f17384; }
.divider{ height:1px; background:linear-gradient(90deg, rgba(0,0,0,.04), rgba(0,0,0,.08), rgba(0,0,0,.04)); margin:12px 0; }
.gift-empty{ padding:40px 0; color:#6b7280; text-align:center; }
.gift-empty .icon{ font-size:28px; margin-bottom:6px; }
.gift-empty .text{ font-weight:800; }
.pager{ display:flex; align-items:center; justify-content:center; gap:8px; padding-top:8px; }
.pager .pg{ min-width:32px; height:32px; border-radius:8px; border:1px solid #e5e7eb; background:#fff; color:#444; font-weight:800; padding:0 10px; }
.pager .pg.btn[disabled]{ opacity:.5; cursor:not-allowed; }
.pager .pg.cur{ background:#f17384; color:#fff; border-color:#f17384; }
.card-title{ font-size:15px; font-weight:900; margin-bottom:8px; color:#111; }
/* 本页使用到的品牌主色快速类（仅本组件作用域） */
.bg-main{ background:#f17384; }

/* 列表项 */
.gift-list{ display:flex; flex-direction:column; gap:10px; }
.gift-item{ display:flex; gap:12px; align-items:center; border:1px solid #f1f5f9; border-radius:10px; padding:10px; background:#fff; }
.gift-item .g-img{ width:44px; height:44px; border-radius:8px; object-fit:contain; background:linear-gradient(135deg,#fff5f7,#fef3c7); padding:6px; border:1px solid #f1f5f9; }
.gift-item .g-meta{ flex:1; min-width:0; }
.g-title{ display:flex; align-items:center; gap:8px; font-weight:900; color:#111; }
.g-price{ color:#f17384; font-weight:900; }
.g-sub{ color:#6b7280; font-size:13px; font-weight:700; }
.g-time{ color:#94a3b8; }

/* 会话列表 */
.conv-list{ display:flex; flex-direction:column; gap:8px; }
.conv-item{ display:flex; gap:12px; align-items:center; border:1px solid #eef2f7; border-radius:12px; padding:10px; background:#fff; cursor:pointer; }
.conv-item:hover{ background:#f9fafb; }
.conv-avatar{ position:relative; display:inline-block; }
.badge-unread{ position:absolute; right:-2px; top:-2px; min-width:18px; height:18px; padding:0 4px; border-radius:999px; background:#ef4444; color:#fff; font-size:11px; line-height:18px; text-align:center; font-weight:900; box-shadow:0 0 0 2px #fff; }
.conv-meta{ flex:1; min-width:0; }
.conv-top{ display:flex; align-items:center; justify-content:space-between; font-weight:900; color:#111; }
.conv-name{ font-weight:900; }
.conv-time{ font-size:12px; color:#94a3b8; font-weight:800; }
.conv-msg{ color:#6b7280; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:700; }
.conv-empty{ display:grid; place-items:center; gap:10px; padding:60px 0; color:#9ca3af; }
.conv-empty .icon{ font-size:38px; }

/* 喜欢：仅“我喜欢的”布局 */
.likes-head{ display:flex; gap:8px; background:#f9fafb; border:1px solid #eef2f7; padding:6px 8px; border-radius:10px; }
.likes-tab{ height:32px; padding:0 14px; border-radius:999px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:800; color:#6b7280; }
.likes-tab.active{ background:#f17384; color:#fff; border-color:#f17384; }
.likes-tip{ margin:10px 0; background:#f9fafb; border:1px solid #eef2f7; color:#6b7280; padding:8px 12px; border-radius:8px; font-weight:700; }
.likes-empty{ display:grid; place-items:center; gap:10px; padding:60px 0; color:#9ca3af; }
.likes-empty .icon{ font-size:38px; }
.likes-btn{ height:36px; padding:0 16px; border-radius:8px; background:#fbbf24; color:#111; font-weight:900; border:0; }
.likes-grid{ display:grid; grid-template-columns: 1fr; gap:12px; }
.likes-card{ display:grid; grid-template-columns: auto 1fr auto; align-items:center; column-gap:10px; border:1px solid #eef2f7; background:#fff; border-radius:12px; padding:10px; width:100%; }
.likes-card .lc-meta{ min-width:0; }
.lc-name{ font-weight:900; color:#111; }
.lc-sub{ font-size:12px; color:#94a3b8; font-weight:800; }
.lc-actions{ display:flex; gap:6px; justify-content:flex-end; }
.btn.small{ height:30px; padding:0 10px; border-radius:8px; border:1px solid #e5e7eb; background:#f9fafb; font-weight:800; }
.btn.small.primary{ background:#f17384; color:#fff; border-color:#f17384; }

/* 访客中心样式 */
.visit-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
.visit-tabs{ display:flex; align-items:center; gap:8px; }
.v-tab{ height:32px; padding:0 12px; border-radius:8px; background:#f9fafb; border:1px solid #e5e7eb; font-weight:800; color:#444; }
.v-tab.active{ background:#fff; color:#f17384; border-color:#f17384; }
.visit-empty{ padding:60px 0; text-align:center; color:#9ca3af; display:grid; place-items:center; gap:10px; }
.visit-empty .icon{ font-size:38px; }
.visit-empty .text{ font-weight:800; }
.visit-btn{ height:36px; padding:0 16px; border-radius:8px; background:#fbbf24; color:#111; font-weight:900; border:0; }
</style>
