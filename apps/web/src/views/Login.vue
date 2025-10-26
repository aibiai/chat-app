<template>
  <div class="relative min-h-screen">
    <!-- 背景图 + 渐变遮罩 -->
  <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" style="background-image:url('/bg-sakura.jpg'), url('https://source.unsplash.com/1920x1080/?couple,date,night,city,neon'), url('https://picsum.photos/1920/1080?random=8');"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50"></div>

    <!-- 页面内容 -->
    <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <!-- 左侧品牌与宣传（覆盖在背景上，白字） -->
      <div class="hidden md:flex items-center justify-center p-10 text-white">
        <div class="max-w-md">
          <div class="text-3xl font-bold mb-3">{{ t('login.heroTitle') }}</div>
          <p class="opacity-90">{{ t('login.heroSubtitle') }}</p>
        </div>
      </div>

      <!-- 右侧登录卡片 -->
      <div class="flex items-center justify-center p-6">
        <div class="w-full max-w-md rounded-xl shadow-sm border p-6 bg-white/70 backdrop-blur-md">
        <div class="text-center mb-6">
          <div class="text-[22px] leading-7 font-semibold tracking-tighter">{{ t('login.cardTitle') }}</div>
          <div class="text-gray-500 text-[13px] leading-5 mt-1">{{ t('login.cardSubtitle') }}</div>
        </div>


        <form class="space-y-3" @submit.prevent="onSubmit">
          <FormField :label="t('auth.email')" :error="emailError">
              <BaseInput v-model.trim="identifier" :placeholder="t('form.placeholder.email')" :leftIcon="true" :floatLabel="true">
                <template #leftIcon>
                  <span>@</span>
                </template>
              </BaseInput>
            </FormField>
          <FormField :label="t('auth.password')" :error="passwordError">
            <BaseInput :type="showPwd ? 'text':'password'" v-model.trim="password" :placeholder="t('form.placeholder.password')" :leftIcon="true" :rightIcon="true" :floatLabel="true">
              <template #leftIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17a2 2 0 002-2v-2a2 2 0 10-4 0v2a2 2 0 002 2zm6-6a6 6 0 10-12 0v2H5v9h14v-9h-1V11z"/></svg>
              </template>
              <template #rightIcon>
                <button class="text-gray-500" type="button" @click="showPwd=!showPwd" :aria-pressed="showPwd" aria-label="toggle password">
                  <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.77 21.77 0 015.06-5.94"/><path d="M1 1l22 22"/></svg>
                </button>
              </template>
            </BaseInput>
          </FormField>

          <!-- 错误提示 -->
          <p v-if="error" class="text-red-600 text-sm transition-opacity duration-250">{{ error }}</p>

          <BaseButton class="w-full" variant="gradient" rounded="pill" :loading="loading" :disabled="!canSubmit || loading" type="submit">
            <span>{{ t('auth.login') }}</span>
          </BaseButton>
        </form>

          <div class="text-center text-sm text-gray-500 mt-4">
            {{ t('auth.noAccount') }} <router-link to="/register" class="text-main">{{ t('auth.register') }}</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { useAuth } from '../stores';
import { emailSchema, passwordSchema } from '../validation';
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import FormField from '../components/FormField.vue';
const auth = useAuth();
const { t } = useI18n();

const identifier = ref(localStorage.getItem('lastLoginEmail') || '');
const password = ref('');
const showPwd = ref(false);
const loading = ref(false);
const error = ref('');
const emailError = ref('');
const passwordError = ref('');

// canSubmit 直接基于当前输入有效性，避免旧错误残留导致按钮禁用
const canSubmit = computed(() => {
  const id = (identifier.value || '').trim();
  const isEmail = id.includes('@');
  const idOk = isEmail ? emailSchema.safeParse(id).success : id.length > 0;
  const pwdOk = (password.value || '').length > 0; // 登录不强制复杂度，由后端验密
  return idOk && pwdOk;
});

// 修正即清错：当输入变为合法值时，自动清理错误
watch(identifier, (v) => {
  const id = (v || '').trim();
  const isEmail = id.includes('@');
  if (emailError.value) {
    if ((isEmail && emailSchema.safeParse(id).success) || (!isEmail && id.length > 0)) {
      emailError.value = ''
    }
  }
})
watch(password, (v) => {
  if (passwordError.value && (v || '').length > 0) passwordError.value = ''
})

async function onSubmit() {
  error.value = '';
  emailError.value = '';
  passwordError.value = '';
  const id = (identifier.value || '').trim();
  const isEmail = id.includes('@');
  if (isEmail) {
    const e = emailSchema.safeParse(id);
    if (!e.success) emailError.value = t('form.error.email');
  } else if (!id) {
    emailError.value = t('form.error.required');
  }
  if (!password.value) passwordError.value = t('form.error.required');
  if (emailError.value || passwordError.value) return;
  try {
    loading.value = true;
    const body = isEmail ? { email: id, password: password.value } : { nickname: id, password: password.value };
    const { data } = await api.post('/api/auth/login', body);
    auth.setAuth(data.token, data.user.id);
    try { if (data.user?.email) localStorage.setItem('lastLoginEmail', data.user.email) } catch {}
    const url = new URL(location.href)
    const redirect = url.hash.includes('?') ? new URLSearchParams(url.hash.split('?')[1]).get('redirect') : null
    if (redirect) {
      location.hash = `#${redirect}`
    } else {
      location.hash = '#/'
    }
  } catch (e: any) {
    const status = e?.response?.status
    const msg = e?.response?.data?.error
    if (status === 401 || msg === 'Invalid credentials') {
      error.value = t('form.error.invalidCredentials')
    } else if (status === 400 || msg === 'Missing fields') {
      error.value = t('form.error.required')
    } else {
      error.value = t('form.error.loginFail')
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
</style>
