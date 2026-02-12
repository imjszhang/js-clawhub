/**
 * JS ClawHub - Shared Footer Component
 * Renders the bottom footer with JS brand
 */

const Footer = {
    /**
     * Render footer into target element
     */
    render(targetId) {
        const target = document.getElementById(targetId || 'footer-container');
        if (!target) return;

        const basePath = (typeof Nav !== 'undefined') ? Nav.getBasePath() : './';

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
                        Curated by JS // OpenClaw 生态项目导航 // ${new Date().getFullYear()}
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
