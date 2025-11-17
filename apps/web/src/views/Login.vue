<template>
  <div class="relative min-h-screen">
    <!-- Background image stack -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style="background-image:url('/images/register-love.jpg'), url('/bg-sakura.jpg'), url('https://source.unsplash.com/1920x1080/?couple,date,night,city,neon'), url('https://picsum.photos/1920/1080?random=8');"
    ></div>
    <!-- 去除背景遮罩不透明度：删除叠加的渐变遮罩层 -->

    <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <div class="hidden md:flex items-center justify-center p-10 text-white">
        <div class="max-w-md">
          <div class="text-3xl font-bold mb-3">{{ t('login.heroTitle') }}</div>
          <p class="opacity-90">{{ t('login.heroSubtitle') }}</p>
        </div>
      </div>

      <div class="flex items-center justify-center p-6">
        <div class="w-full max-w-md rounded-xl shadow-sm border p-6 bg-white/70 backdrop-blur-md">
          <div class="text-center mb-6">
            <div class="text-[22px] leading-7 font-semibold tracking-tighter">{{ t('login.cardTitle') }}</div>
            <div class="text-gray-500 text-[13px] leading-5 mt-1">{{ t('login.cardSubtitle') }}</div>
          </div>

          <form class="space-y-3" @submit.prevent="onSubmit">
            <FormField :label="t('auth.nickname')" :error="nicknameError">
              <BaseInput
                v-model.trim="nickname"
                :placeholder="t('form.placeholder.nickname')"
                :leftIcon="true"
                :floatLabel="true"
              >
                <template #leftIcon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5Z" />
                  </svg>
                </template>
              </BaseInput>
            </FormField>
            <FormField :label="t('auth.password')" :error="passwordError">
              <BaseInput
                :type="showPwd ? 'text' : 'password'"
                v-model.trim="password"
                :placeholder="t('form.placeholder.password')"
                :leftIcon="true"
                :rightIcon="true"
                :floatLabel="true"
              >
                <template #leftIcon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17a2 2 0 0 0 2-2v-2a2 2 0 1 0-4 0v2a2 2 0 0 0 2 2zm6-6a6 6 0 1 0-12 0v2H5v9h14v-9h-1V11z" />
                  </svg>
                </template>
                <template #rightIcon>
                  <button class="text-gray-500" type="button" @click="showPwd = !showPwd" :aria-pressed="showPwd" aria-label="toggle password">
                    <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94" />
                      <path d="M1 1l22 22" />
                    </svg>
                  </button>
                </template>
              </BaseInput>
            </FormField>

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
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import FormField from '../components/FormField.vue';

const auth = useAuth();
const { t } = useI18n();

const nickname = ref(localStorage.getItem('lastLoginNickname') || '');
const password = ref('');
const showPwd = ref(false);
const loading = ref(false);
const error = ref('');
const nicknameError = ref('');
const passwordError = ref('');

const canSubmit = computed(() => {
  const nameOk = (nickname.value || '').trim().length > 0;
  const pwdOk = (password.value || '').length > 0;
  return nameOk && pwdOk;
});

watch(nickname, (value) => {
  if (nicknameError.value && (value || '').trim().length > 0) nicknameError.value = '';
});

watch(password, (value) => {
  if (passwordError.value && (value || '').length > 0) passwordError.value = '';
});

async function onSubmit() {
  error.value = '';
  nicknameError.value = '';
  passwordError.value = '';

  const name = (nickname.value || '').trim();
  if (!name) nicknameError.value = t('form.error.required');
  if (!password.value) passwordError.value = t('form.error.required');
  if (nicknameError.value || passwordError.value) return;

  try {
    loading.value = true;
    const { data } = await api.post('/api/auth/login', { nickname: name, password: password.value });
    auth.setAuth(data.token, data.user.id);
    try {
      localStorage.setItem('lastLoginNickname', name);
      localStorage.removeItem('lastLoginEmail');
    } catch {}
    const url = new URL(location.href);
    const redirect = url.hash.includes('?') ? new URLSearchParams(url.hash.split('?')[1]).get('redirect') : null;
    if (redirect) {
      location.hash = `#${redirect}`;
    } else {
      location.hash = '#/';
    }
  } catch (e: any) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.error;
    if (status === 401 || msg === 'Invalid credentials') {
      error.value = t('form.error.invalidCredentials');
    } else if (status === 400 || msg === 'Missing fields') {
      error.value = t('form.error.required');
    } else {
      error.value = t('form.error.loginFail');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
</style>
