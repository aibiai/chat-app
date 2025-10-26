import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePresence = defineStore('presence', () => {
  const online = ref<Set<string>>(new Set());
  function setOnline(uid: string, isOnline: boolean) {
    const s = new Set(online.value);
    if (isOnline) s.add(uid); else s.delete(uid);
    online.value = s;
  }
  function isOnline(uid: string) { return online.value.has(uid); }
  return { online, setOnline, isOnline };
});
