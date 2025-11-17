<template>
  <div class="relative min-h-screen">
    <!-- 背景图 + 渐变遮罩 -->
    <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" style="background-image:url('/images/register-love.jpg');filter:brightness(1.2);"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-black/30"></div>

    <!-- 居中卡片 -->
    <div class="relative z-10 flex items-center justify-center px-4 py-10">
  <div class="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 text-white">
        <div class="mb-4">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 rounded bg-pink-400"></span>
            <h1 class="text-lg font-semibold tracking-tight">{{ t('auth.register') }}</h1>
            <span class="ml-2 text-xs opacity-90">{{ t('register.membersJoinedPrefix') }} <span class="font-semibold">200000+</span> {{ t('register.membersJoinedSuffix') }}</span>
          </div>
        </div>
        <form class="space-y-3" @submit.prevent="onSubmit">
          <!-- 性别切换按钮 -->
          <div class="flex gap-2 mb-1" role="tablist" aria-label="gender">
            <button type="button" @click="gender='male'" :aria-pressed="gender==='male'" :class="['px-4 h-9 rounded-full border', gender==='male' ? 'bg-pink-500 text-white border-pink-400 shadow' : 'bg-white/10 border-white/30 hover:bg-white/20']">{{ t('auth.genderTab.male') }}</button>
            <button type="button" @click="gender='female'" :aria-pressed="gender==='female'" :class="['px-4 h-9 rounded-full border', gender==='female' ? 'bg-pink-500 text-white border-pink-400 shadow' : 'bg-white/10 border-white/30 hover:bg-white/20']">{{ t('auth.genderTab.female') }}</button>
          </div>

          <!-- 出生日期：年 / 月 / 日 下拉框 -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-white/80 text-sm">{{ t('register.chooseBirthday') }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="col-span-1">
                <FloatingSelect v-model="birthYear" :placeholder="t('form.placeholder.selectYear')" :floatLabel="false" rounded="lg" size="md" elevated>
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </FloatingSelect>
              </div>
              <div class="col-span-1">
                <FloatingSelect v-model="birthMonth" :placeholder="t('form.placeholder.selectMonth')" :floatLabel="false" rounded="lg" size="md" elevated>
                  <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
                </FloatingSelect>
              </div>
              <div class="col-span-1">
                <FloatingSelect v-model="birthDay" :placeholder="t('form.placeholder.selectDay')" :floatLabel="false" rounded="lg" size="md" elevated>
                  <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
                </FloatingSelect>
              </div>
            </div>
          </div>

          <!-- 昵称（移除上方标签，仅保留占位） -->
          <FormField :error="nicknameError">
            <BaseInput v-model.trim="nickname" :placeholder="t('form.placeholder.nickname')" :leftIcon="true" :floatLabel="true" rounded="pill" elevated>
              <template #leftIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z"/></svg>
              </template>
            </BaseInput>
          </FormField>

          <!-- 邮箱（移除上方标签，仅保留占位） -->
          <FormField :error="emailError">
            <BaseInput v-model.trim="email" type="email" :placeholder="t('form.placeholder.email')" :leftIcon="true" :floatLabel="true" rounded="pill" elevated>
              <template #leftIcon>
                <span>@</span>
              </template>
            </BaseInput>
          </FormField>

          <!-- 密码（移除上方标签，仅保留占位） -->
          <FormField :error="passwordError" :help="t('form.help.password')">
            <BaseInput :type="showPwd ? 'text':'password'" v-model.trim="password" :placeholder="t('form.placeholder.password')" :leftIcon="true" :floatLabel="true" rounded="pill" elevated :rightIcon="true">
              <template #leftIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17a2 2 0 002-2v-2a2 2 0 10-4 0v2a2 2 0 002 2zm6-6a6 6 0 10-12 0v2H5v9h14v-9h-1V11z"/></svg>
              </template>
              <template #rightIcon>
                <button class="text-gray-500" type="button" @click="showPwd=!showPwd" :aria-pressed="showPwd" aria-label="toggle password">
                  <svg v-if="!showPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94"/>
                    <path d="M1 1l22 22"/>
                    <path d="M9.9 4.2A10.44 10.44 0 0 1 12 5c7 0 11 7 11 7a10.93 10.93 0 0 1-4.06 5.94"/>
                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/>
                  </svg>
                </button>
              </template>
            </BaseInput>
          </FormField>

          <!-- 确认密码（移除上方标签，仅保留占位） -->
          <FormField :error="confirmPasswordError">
            <BaseInput :type="showConfirmPwd ? 'text':'password'" v-model.trim="confirmPassword" :placeholder="t('auth.confirmPassword')" :leftIcon="true" :floatLabel="true" rounded="pill" elevated :rightIcon="true">
              <template #leftIcon>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17a2 2 0 002-2v-2a2 2 0 10-4 0v2a2 2 0 002 2zm6-6a6 6 0 10-12 0v2H5v9h14v-9h-1V11z"/></svg>
              </template>
              <template #rightIcon>
                <button class="text-gray-500" type="button" @click="showConfirmPwd=!showConfirmPwd" aria-label="toggle confirm password">
                  <svg v-if="!showConfirmPwd" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-5.94"/>
                    <path d="M1 1l22 22"/>
                    <path d="M9.9 4.2A10.44 10.44 0 0 1 12 5c7 0 11 7 11 7a10.93 10.93 0 0 1-4.06 5.94"/>
                    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"/>
                  </svg>
                </button>
              </template>
            </BaseInput>
          </FormField>

          <p v-if="error" class="text-red-200 text-sm transition-opacity duration-250">{{ error }}</p>
          <BaseButton class="w-full" variant="gradient" rounded="pill" :loading="loading" type="submit">
            <span>{{ t('auth.register') }}</span>
          </BaseButton>
        </form>
        <div class="text-center text-sm text-white/80 mt-4">
          {{ t('auth.haveAccount') }} <router-link to="/login" class="text-pink-300 hover:underline">{{ t('auth.login') }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api';
import { useAuth } from '../stores';
import { emailSchema, passwordSchema, required } from '../validation';
import BaseButton from '../components/BaseButton.vue';
import BaseInput from '../components/BaseInput.vue';
import FormField from '../components/FormField.vue';
import FloatingSelect from '../components/FloatingSelect.vue';
const auth = useAuth();
const { t } = useI18n();

const REGISTER_BG = "/images/register-love.jpg";

const applyAppBackground = (url: string | null) => {
  const appBg = document.getElementById('app-bg');
  if (!appBg) return;
  if (url) {
    appBg.style.backgroundImage = `url('${url}')`;
    appBg.style.backgroundSize = 'cover';
    appBg.style.backgroundPosition = 'center';
    appBg.style.backgroundRepeat = 'no-repeat';
    appBg.style.filter = 'brightness(1.2)';
    appBg.style.zIndex = '-1';
  } else {
    appBg.style.backgroundImage = '';
    appBg.style.backgroundSize = '';
    appBg.style.backgroundPosition = '';
    appBg.style.backgroundRepeat = '';
    appBg.style.filter = '';
    appBg.style.removeProperty('z-index');
  }
};

onMounted(() => applyAppBackground(REGISTER_BG));
onUnmounted(() => applyAppBackground(null));

const email = ref('');
const password = ref('');
const nickname = ref('');
const gender = ref<'male'|'female'|'other'>('male');
const showPwd = ref(false);
const showConfirmPwd = ref(false);
const loading = ref(false);
const error = ref('');
const emailError = ref('');
const passwordError = ref('');
const nicknameError = ref('');
const confirmPassword = ref('');
const confirmPasswordError = ref('');

// 脏标记：仅在用户编辑后才开始提示，避免初始状态噪音
const emailDirty = ref(false);
const passwordDirty = ref(false);
const confirmDirty = ref(false);
const nicknameDirty = ref(false);

// 出生年月日
const birthYear = ref('');
const birthMonth = ref('');
const birthDay = ref('');
// 年份范围：1965 - 2015（降序）
const minYear = 1965;
const maxYear = 2015;
const years = computed(() => Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(maxYear - i)));
const months = computed(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')));
const days = computed(() => {
  const y = Number(birthYear.value);
  const m = Number(birthMonth.value);
  const count = y && m ? new Date(y, m, 0).getDate() : 31;
  return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
});
const birthdayIso = computed(() => {
  if (!birthYear.value || !birthMonth.value || !birthDay.value) return '';
  return `${birthYear.value}-${birthMonth.value}-${birthDay.value}`;
});

// 当年份或月份变化时，如果当前日超过当月最大值则重置
watch([birthYear, birthMonth], () => {
  const y = Number(birthYear.value);
  const m = Number(birthMonth.value);
  if (!y || !m) return;
  const max = new Date(y, m, 0).getDate();
  if (birthDay.value && Number(birthDay.value) > max) birthDay.value = '';
});

// 提交可用判定直接基于当前值有效性，杜绝因残留错误文案导致按钮一直禁用
const canSubmit = computed(() => {
  const emailOk = emailSchema.safeParse(email.value).success
  const pwdOk = passwordSchema.safeParse(password.value).success
  const nicknameOk = required.safeParse(nickname.value).success
  const matchOk = !!confirmPassword.value && password.value === confirmPassword.value
  const genderOk = !!gender.value
  return emailOk && pwdOk && nicknameOk && matchOk && genderOk
});

// 即时校验：弱密码立即提示；修正为合法后自动清错，按钮立刻可用
watch(email, (v) => {
  if (!emailDirty.value) emailDirty.value = true;
  emailError.value = emailDirty.value && !emailSchema.safeParse(v).success ? t('form.error.email') : '';
});

watch(password, (v) => {
  if (!passwordDirty.value) passwordDirty.value = true;
  const valid = passwordSchema.safeParse(v).success;
  passwordError.value = passwordDirty.value && !valid ? t('form.error.passwordWeak') : '';
  // 同步校验确认密码一致性（仅当确认框已编辑）
  if (confirmDirty.value) {
    confirmPasswordError.value = (v && confirmPassword.value && v !== confirmPassword.value) ? t('form.error.passwordMismatch') : '';
  }
});

watch(confirmPassword, (v) => {
  if (!confirmDirty.value) confirmDirty.value = true;
  confirmPasswordError.value = (confirmDirty.value && password.value && v && v !== password.value)
    ? t('form.error.passwordMismatch')
    : '';
});

watch(nickname, (v) => {
  if (!nicknameDirty.value) nicknameDirty.value = true;
  nicknameError.value = nicknameDirty.value && !required.safeParse(v).success ? t('form.error.required') : '';
});

async function onSubmit() {
  if (loading.value) return;
  try {
    loading.value = true;
    error.value = '';
    emailError.value = '';
    passwordError.value = '';
    nicknameError.value = '';
  confirmPasswordError.value = '';
    if (!emailSchema.safeParse(email.value).success) emailError.value = t('form.error.email');
    if (!passwordSchema.safeParse(password.value).success) passwordError.value = t('form.error.passwordWeak');
    if (!required.safeParse(nickname.value).success) nicknameError.value = t('form.error.required');
  if (password.value !== confirmPassword.value) confirmPasswordError.value = t('form.error.passwordMismatch');
  if (emailError.value || passwordError.value || nicknameError.value || confirmPasswordError.value) return;
    const { data } = await api.post('/api/auth/register', {
      email: email.value,
      password: password.value,
      nickname: nickname.value,
      gender: gender.value,
    });
    auth.setAuth(data.token, data.user.id);
    // 若选择了出生日期，立即保存到用户资料，便于 Onboarding 预填
    if (birthdayIso.value) {
      try { await api.put('/api/users/me', { birthday: birthdayIso.value }); } catch {}
    }
    location.hash = '#/onboarding';
  } catch (e: any) {
    const status = e?.response?.status
    const msg = e?.response?.data?.error
    // 针对已存在邮箱的清晰提示
    if (status === 409 || msg === 'Email exists') {
      emailError.value = t('form.error.emailExists')
      if (!emailDirty.value) emailDirty.value = true
      error.value = ''
    } else {
      error.value = t('form.error.registerFail')
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
</style>
