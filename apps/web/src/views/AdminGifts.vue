<template>
  <div class="container mx-auto px-3 py-4">
    <div class="bg-white rounded border p-4 mb-4">
      <h1 class="font-extrabold text-xl">{{ t('admin.gifts.title') }}</h1>
      <p class="text-gray-600 text-sm">{{ t('admin.gifts.subtitle') }}</p>
    </div>

    <div class="grid grid-cols-12 gap-4">
      <!-- 左：创建/编辑表单 -->
      <div class="col-span-12 lg:col-span-4">
        <div class="bg-white rounded border p-4 space-y-3">
          <h3 class="font-bold">{{ editing ? t('admin.gifts.editGift') : t('admin.gifts.addGift') }}</h3>

          <label class="block text-sm font-semibold">{{ t('admin.gifts.name') }}</label>
          <input v-model.trim="form.name" class="w-full border rounded px-3 py-2" :placeholder="t('admin.gifts.namePlaceholder')" />

          <label class="block text-sm font-semibold">{{ t('admin.gifts.price') }}</label>
          <input v-model.number="form.price" type="number" min="0" class="w-full border rounded px-3 py-2" :placeholder="t('admin.gifts.pricePlaceholder')" />

          <label class="block text-sm font-semibold">{{ t('admin.gifts.image') }}</label>
          <div class="flex items-center gap-2">
            <input ref="fileEl" type="file" accept="image/*" @change="onPickFile" />
            <button class="px-3 py-1 rounded bg-slate-100 border" type="button" @click="uploadImage" :disabled="!file">{{ t('admin.gifts.upload') }}</button>
          </div>
          <div v-if="form.img" class="mt-2">
            <img :src="form.img" alt="preview" class="w-28 h-28 object-contain bg-slate-50 border rounded" />
            <div class="text-xs text-gray-500 break-all">{{ form.img }}</div>
          </div>

          <div class="pt-2 flex gap-2">
            <button class="px-4 py-2 rounded bg-rose-500 text-white font-bold" @click="save" :disabled="!canSubmit">{{ editing ? t('admin.gifts.saveChanges') : t('admin.gifts.create') }}</button>
            <button v-if="editing" class="px-4 py-2 rounded bg-slate-200" @click="reset">{{ t('common.cancel') }}</button>
          </div>
        </div>

        <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 mt-3 text-sm">
          {{ t('admin.gifts.uploadHint') }} <code>/static/gifts/</code>
        </div>
      </div>

      <!-- 右：列表 -->
      <div class="col-span-12 lg:col-span-8">
        <div class="bg-white rounded border p-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-bold">{{ t('admin.gifts.catalog') }}</h3>
            <button class="px-3 py-1 rounded bg-slate-100 border" @click="load">{{ t('admin.gifts.refresh') }}</button>
          </div>
          <div v-if="loading" class="text-center text-gray-500 py-10">{{ t('common.loading') }}</div>
          <div v-else-if="error" class="text-center text-red-500 py-10">{{ error }}</div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div v-for="g in list" :key="g.id" class="border rounded p-2 flex flex-col gap-2">
              <div class="h-28 grid place-items-center bg-slate-50 rounded">
                <img :src="g.img" :alt="g.name" class="max-w-[80px] max-h-[80px] object-contain" />
              </div>
              <div class="font-bold">{{ g.name }}</div>
              <div class="text-rose-600 font-extrabold">¥ {{ g.price }}</div>
              <div class="flex gap-2">
                <button class="flex-1 px-2 py-1 rounded bg-slate-100 border" @click="startEdit(g)">{{ t('common.edit') }}</button>
                <button class="flex-1 px-2 py-1 rounded bg-red-500 text-white" @click="remove(g)">{{ t('common.delete') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '../api'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

interface Gift { id: string; name: string; price: number; img: string }

const list = ref<Gift[]>([])
const loading = ref(false)
const error = ref('')

const editing = ref(false)
const currentId = ref<string | null>(null)
const form = ref<{ name: string; price: number | null; img: string }>({ name: '', price: null, img: '' })
const fileEl = ref<HTMLInputElement | null>(null)
const file = ref<File | null>(null)

const canSubmit = computed(() => !!form.value.name && typeof form.value.price === 'number' && form.value.price >= 0 && !!form.value.img)

function reset(){ editing.value = false; currentId.value = null; form.value = { name: '', price: null, img: '' }; file.value = null; if(fileEl.value) fileEl.value.value = '' }
function startEdit(g: Gift){ editing.value = true; currentId.value = g.id; form.value = { name: g.name, price: g.price, img: g.img } }

async function load(){
  loading.value = true; error.value = ''
  try{ const { data } = await api.get('/api/gifts/catalog'); list.value = data?.list || [] }
  catch{ error.value = t('common.loadFailed') }
  finally{ loading.value = false }
}

function onPickFile(e: Event){
  const t = e.target as HTMLInputElement; const f = t.files?.[0] || null; file.value = f || null;
}

async function uploadImage(){
  if (!file.value) return
  const fd = new FormData(); fd.append('file', file.value)
  try{ const { data } = await api.post('/api/gifts/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); form.value.img = data?.url || form.value.img }
  catch{ alert(t('common.uploadFailed')); }
}

async function save(){
  if (!canSubmit.value) return
  if (editing.value && currentId.value){
    await api.put(`/api/gifts/catalog/${currentId.value}`, { name: form.value.name, price: form.value.price, img: form.value.img })
  } else {
    await api.post('/api/gifts/catalog', { name: form.value.name, price: form.value.price, img: form.value.img })
  }
  reset(); await load()
}

async function remove(g: Gift){
  if (!confirm(t('admin.gifts.confirmDelete', { name: g.name }))) return
  await api.delete(`/api/gifts/catalog/${g.id}`)
  await load()
}

onMounted(load)
</script>

<style scoped>
code{ background:#fff3; padding:2px 6px; border-radius:6px; }
</style>
