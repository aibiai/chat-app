import { defineStore } from 'pinia';
import { ref } from 'vue';
export const usePresence = defineStore('presence', () => {
    const online = ref(new Set());
    function setOnline(uid, isOnline) {
        const s = new Set(online.value);
        if (isOnline)
            s.add(uid);
        else
            s.delete(uid);
        online.value = s;
    }
    function isOnline(uid) { return online.value.has(uid); }
    return { online, setOnline, isOnline };
});
