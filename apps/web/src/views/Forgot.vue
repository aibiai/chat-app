<template>
  <div class="max-w-md mx-auto">
    <BaseCard>
      <div class="text-2xl font-semibold text-center mb-4">{{ t('auth.reset') }}</div>
      <p class="text-sm text-gray-500 mb-4">{{ t('auth.sendReset') }}</p>
      <form class="space-y-3" @submit.prevent="onSubmit">
        <FormField :label="t('auth.email')" :error="emailError">
          <BaseInput v-model.trim="email" type="email" :placeholder="t('form.placeholder.email')" />
        </FormField>
        <p v-if="token" class="text-sm">Token: <code class="text-main">{{ token }}</code></p>
        <p v-if="msg" class="text-green-600 text-sm">{{ msg }}</p>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
        <BaseButton class="w-full" type="submit">{{ t('auth.sendReset') }}</BaseButton>
      </form>
      <div class="text-center text-sm text-gray-500 mt-4">
        {{ t('auth.haveAccount') }} <router-link to="/login" class="text-main">{{ t('auth.login') }}</router-link>
      </div>
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
import { emailSchema } from '../validation'

const email = ref('');
const token = ref('');
const msg = ref('');
const error = ref('');
const emailError = ref('');
const { t } = useI18n();

async function onSubmit() {
  error.value = '';
  msg.value = '';
  emailError.value = '';
  const valid = emailSchema.safeParse(email.value)
  if (!valid.success) { emailError.value = t('form.error.email'); return; }
  const { data } = await api.post('/api/auth/forgot', { email: email.value });
  token.value = data?.token || '';
  msg.value = 'OK';
}
</script>
