<template>
  <div class="max-w-md mx-auto">
    <BaseCard>
      <div class="text-2xl font-semibold text-center mb-4">{{ t('auth.reset') }}</div>
      <form class="space-y-3" @submit.prevent="onSubmit">
        <FormField :label="t('auth.token')" :error="tokenError">
          <BaseInput v-model.trim="token" :placeholder="t('auth.token')" />
        </FormField>
        <FormField :label="t('auth.newPassword')" :help="t('form.help.password')" :error="passwordError">
          <BaseInput v-model.trim="password" type="password" :placeholder="t('auth.newPassword')" />
        </FormField>
        <p v-if="msg" class="text-green-600 text-sm">{{ msg }}</p>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
        <BaseButton class="w-full" type="submit">{{ t('auth.reset') }}</BaseButton>
      </form>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '../api';
import { useI18n } from 'vue-i18n';
import BaseCard from '../components/BaseCard.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'
import FormField from '../components/FormField.vue'
import { passwordSchema, required } from '../validation'

const token = ref('');
const password = ref('');
const msg = ref('');
const error = ref('');
const tokenError = ref('');
const passwordError = ref('');
const { t } = useI18n();

async function onSubmit() {
  error.value = '';
  msg.value = '';
  tokenError.value = '';
  passwordError.value = '';
  if (!required.safeParse(token.value).success) tokenError.value = t('form.error.required');
  if (!passwordSchema.safeParse(password.value).success) passwordError.value = t('form.error.passwordWeak');
  if (tokenError.value || passwordError.value) return;
  try {
    await api.post('/api/auth/reset', { token: token.value, password: password.value });
    msg.value = t('auth.reset') + ' OK';
  } catch (e: any) {
    error.value = e?.response?.data?.error || t('form.error.required');
  }
}
</script>
