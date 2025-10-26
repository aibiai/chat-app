import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
export const SUPPORTED_LOCALES = [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'zh-TW', label: '繁體中文' },
    { code: 'en', label: 'English' },
    { code: 'ko', label: '한국어' },
    { code: 'ja', label: '日本語' },
];
function getInitialLocale() {
    const saved = localStorage.getItem('locale');
    if (saved && SUPPORTED_LOCALES.some(l => l.code === saved))
        return saved;
    const nav = navigator.language;
    if (SUPPORTED_LOCALES.some(l => l.code === nav))
        return nav;
    if (nav.startsWith('zh'))
        return 'zh-CN';
    return 'en';
}
export const i18n = createI18n({
    legacy: false,
    locale: getInitialLocale(),
    fallbackLocale: 'en',
    messages: {
        'zh-CN': zhCN,
        'zh-TW': zhTW,
        en,
        ko,
        ja,
    },
});
export function setLocale(code) {
    if (!SUPPORTED_LOCALES.some(l => l.code === code))
        return;
    i18n.global.locale.value = code;
    localStorage.setItem('locale', code);
}
