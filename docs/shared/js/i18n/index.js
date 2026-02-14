/**
 * JS ClawHub - Internationalization (i18n) Manager
 * Provides multi-language support with Chinese as default
 * 
 * Referenced from Deepseek-Cowork I18nManager, adapted for static site.
 * This module is loaded as a global script (not ES module).
 */

// Language packs registry (populated by locale scripts)
const I18nLocales = {};

const I18nManager = {
    STORAGE_KEY: 'clawhub-locale',
    DEFAULT_LOCALE: 'zh-CN',
    SUPPORTED_LOCALES: ['zh-CN', 'en-US'],

    // Current locale
    currentLocale: 'zh-CN',

    // Language packs registry
    locales: I18nLocales,

    /**
     * Initialize the i18n manager
     * Priority: localStorage > browser language > default
     */
    init() {
        // Try saved preference
        const saved = localStorage.getItem(this.STORAGE_KEY);

        if (saved && this.SUPPORTED_LOCALES.includes(saved)) {
            this.currentLocale = saved;
        } else {
            // Detect from browser language
            const browserLang = navigator.language || navigator.userLanguage || '';
            if (browserLang.startsWith('zh')) {
                this.currentLocale = 'zh-CN';
            } else {
                this.currentLocale = 'en-US';
            }
        }

        // Apply to DOM
        this.updateDOM();

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLocale;

        // Update language toggle if exists
        this._updateToggleUI();
    },

    /**
     * Set the current locale
     * @param {string} locale - 'zh-CN' or 'en-US'
     */
    setLocale(locale) {
        if (!this.SUPPORTED_LOCALES.includes(locale)) {
            console.warn('[I18n] Unsupported locale:', locale);
            return;
        }

        if (this.currentLocale === locale) return;

        this.currentLocale = locale;
        localStorage.setItem(this.STORAGE_KEY, locale);

        // Update DOM
        this.updateDOM();

        // Update HTML lang attribute
        document.documentElement.lang = locale;

        // Update toggle UI
        this._updateToggleUI();

        // Dispatch event for dynamic content re-rendering
        window.dispatchEvent(new CustomEvent('localechange', {
            detail: { locale: locale }
        }));
    },

    /**
     * Get the current locale
     * @returns {string}
     */
    getLocale() {
        return this.currentLocale;
    },

    /**
     * Get translation for a dot-notation key
     * @param {string} key - e.g. 'nav.projects'
     * @param {Object} params - interpolation params e.g. { count: 5 }
     * @returns {string}
     */
    t(key, params = {}) {
        const pack = this.locales[this.currentLocale] || this.locales[this.DEFAULT_LOCALE];
        if (!pack) return key;

        // Navigate nested object
        const keys = key.split('.');
        let value = pack;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Try fallback to default locale
                if (this.currentLocale !== this.DEFAULT_LOCALE) {
                    return this._getFallback(key, params);
                }
                return key;
            }
        }

        if (typeof value !== 'string') return key;

        return this._interpolate(value, params);
    },

    /**
     * Get a localized field value from a bilingual JSON object.
     * Handles both plain strings and { "zh-CN": "...", "en-US": "..." } objects.
     * @param {Object} obj - The data object
     * @param {string} field - The field name
     * @returns {string}
     */
    getLocalizedField(obj, field) {
        if (!obj || !(field in obj)) return '';
        const val = obj[field];

        if (typeof val === 'string') return val;

        if (val && typeof val === 'object') {
            return val[this.currentLocale] || val[this.DEFAULT_LOCALE] || val['zh-CN'] || val['en-US'] || '';
        }

        return String(val);
    },

    /**
     * Update all DOM elements with data-i18n* attributes
     */
    updateDOM() {
        // textContent
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = this.t(key);
        });

        // innerHTML (for rich text with <span> etc.)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (key) el.innerHTML = this.t(key);
        });

        // title attribute
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) el.title = this.t(key);
        });

        // placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = this.t(key);
        });

        // aria-label attribute
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            if (key) el.setAttribute('aria-label', this.t(key));
        });
    },

    /**
     * Check if a translation key exists
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        const pack = this.locales[this.currentLocale];
        if (!pack) return false;

        const keys = key.split('.');
        let value = pack;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return false;
            }
        }

        return typeof value === 'string';
    },

    /**
     * Format a date according to current locale
     * @param {string} dateStr
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string}
     */
    formatDate(dateStr, options) {
        const opts = options || { year: 'numeric', month: 'long', day: 'numeric' };
        try {
            return new Date(dateStr).toLocaleDateString(this.currentLocale, opts);
        } catch {
            return dateStr;
        }
    },

    // ============ Private methods ============

    _getFallback(key, params) {
        const pack = this.locales[this.DEFAULT_LOCALE];
        if (!pack) return key;

        const keys = key.split('.');
        let value = pack;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value !== 'string') return key;

        return this._interpolate(value, params);
    },

    _interpolate(str, params) {
        if (!params || Object.keys(params).length === 0) return str;
        return str.replace(/\{(\w+)\}/g, (match, k) => {
            return k in params ? params[k] : match;
        });
    },

    _updateToggleUI() {
        const toggle = document.getElementById('lang-toggle');
        if (toggle) {
            toggle.textContent = this.currentLocale === 'zh-CN' ? 'EN' : '中';
        }
    }
};

// Make available globally
window.I18nManager = I18nManager;
window.I18nLocales = I18nLocales;
