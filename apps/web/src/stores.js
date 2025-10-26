import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useAuth = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token') || '');
    const uid = ref(localStorage.getItem('uid') || '');
    function setAuth(t, u) {
        token.value = t;
        uid.value = u;
        localStorage.setItem('token', t);
        localStorage.setItem('uid', u);
    }
    function logout() {
        token.value = '';
        uid.value = '';
        localStorage.removeItem('token');
        localStorage.removeItem('uid');
    }
    return { token, uid, setAuth, logout };
});
