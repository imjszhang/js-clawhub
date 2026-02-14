/**
 * JS ClawHub - Shared Footer Component
 * Renders the bottom footer with JS brand
 * Supports i18n via I18nManager
 */

const Footer = {
    /**
     * Render footer into target element
     */
    render(targetId) {
        const target = document.getElementById(targetId || 'footer-container');
        if (!target) return;

        const basePath = (typeof Nav !== 'undefined') ? Nav.getBasePath() : './';
        const t = (key) => typeof I18nManager !== 'undefined' ? I18nManager.t(key) : key.split('.').pop();

        target.innerHTML = `
            <footer class="bg-black text-white py-12 border-t-8 border-[#FCD228]">
                <div class="max-w-7xl mx-auto px-6">
                    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div class="font-mono font-bold text-xl tracking-tighter">
                            JS_CLAWHUB <span class="text-[#FCD228]">v1.0</span>
                        </div>
                        <div class="flex gap-6 font-bold uppercase text-sm">
                            <a href="https://openclaw.ai/" target="_blank" class="hover:text-[#FCD228] hover:underline decoration-2">OpenClaw</a>
                            <a href="https://github.com/openclaw/openclaw" target="_blank" class="hover:text-[#FCD228] hover:underline decoration-2">GitHub</a>
                            <a href="https://x.com/imjszhang" target="_blank" class="hover:text-[#FCD228] hover:underline decoration-2">@JS</a>
                        </div>
                    </div>
                    <div class="mt-8 pt-6 border-t border-white/10 text-center text-sm text-white/50 font-mono">
                        <span data-i18n="footer.curatedBy">${t('footer.curatedBy')}</span> // <span data-i18n="footer.tagline">${t('footer.tagline')}</span> // ${new Date().getFullYear()}
                    </div>
                </div>
            </footer>
        `;
    }
};

// Auto-render on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    Footer.render('footer-container');
});

// Re-render on locale change
window.addEventListener('localechange', () => {
    Footer.render('footer-container');
});
