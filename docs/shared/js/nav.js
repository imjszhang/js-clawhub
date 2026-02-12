/**
 * JS ClawHub - Shared Navigation Component
 * Renders the top navigation bar with JS brand logo
 */

const Nav = {
    // Navigation items
    items: [
        { label: 'PROJECTS', href: '/' },
        { label: 'SKILLS', href: '/skills/' },
        { label: 'BLOG', href: '/blog/' },
        { label: 'GUIDE', href: '/guide/' },
    ],

    /**
     * Get base path for relative URLs based on current page depth
     */
    getBasePath() {
        const path = window.location.pathname;
        // If we're in a subdirectory (skills/, blog/, guide/), go up one level
        if (path.includes('/skills/') || path.includes('/blog/') || path.includes('/guide/')) {
            return '../';
        }
        return './';
    },

    /**
     * Render navigation bar into target element
     */
    render(targetId) {
        const target = document.getElementById(targetId || 'nav-container');
        if (!target) return;

        const basePath = this.getBasePath();
        const currentPath = window.location.pathname;

        const navItemsHTML = this.items.map(item => {
            // Determine if this nav item is active
            const isActive = this.isActive(currentPath, item.href);
            const resolvedHref = this.resolveHref(basePath, item.href);
            const activeClass = isActive ? 'underline decoration-2 underline-offset-4' : '';
            return `<a href="${resolvedHref}" class="hover:underline decoration-2 underline-offset-4 ${activeClass}">${item.label}</a>`;
        }).join('');

        target.innerHTML = `
            <nav class="fixed top-0 left-0 right-0 z-50 p-4">
                <div class="max-w-7xl mx-auto bg-white border-3 border-black shadow-brutal flex justify-between items-center px-6 py-4">
                    <a href="${basePath}" class="flex items-center gap-3 no-underline">
                        <div class="w-10 h-10 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
                            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" preserveAspectRatio="xMidYMid meet" class="w-full h-full">
                                <circle cx="54" cy="54" r="52" fill="#FCD228" stroke="#000000" stroke-width="4" />
                                <g fill="#37342F" stroke="none">
                                    <path d="M 45.763 0.981 C 27.887 4.187, 13.665 14.723, 5.927 30.493 C -11.392 65.790, 14.481 106.880, 54.090 106.985 C 61.680 107.005, 74.001 103.711, 80.853 99.831 C 93.209 92.832, 103.726 78.474, 106.157 65.285 C 106.743 62.103, 107.623 58.719, 108.112 57.764 C 109.254 55.531, 109.274 47.712, 108.136 48.416 C 107.661 48.709, 106.999 46.598, 106.664 43.725 C 105.243 31.533, 93.432 14.801, 81.259 7.738 C 71.437 2.038, 56.122 -0.877, 45.763 0.981 M 42.773 6.555 C 34.268 8.617, 27.297 12.549, 20.392 19.179 C -7.384 45.851, 4.871 90.657, 42.631 100.492 C 61.601 105.433, 83.515 96.983, 94.449 80.511 C 107.269 61.196, 105.090 37.335, 88.973 20.550 C 76.641 7.708, 59.472 2.507, 42.773 6.555 M 60 32.070 C 56.350 33.557, 54.048 37.007, 54.022 41.027 C 53.992 45.852, 56.305 48.784, 60.779 49.592 C 65.891 50.514, 68 51.753, 68 53.835 C 68 57.937, 62.926 59.456, 60.768 56 C 60.009 54.785, 58.436 54, 56.759 54 C 53.172 54, 53.027 57.117, 56.455 60.545 C 58.400 62.491, 59.936 63, 63.866 63 C 68.173 63, 69.161 62.597, 71.411 59.923 C 76.183 54.252, 74.086 46.915, 67.275 45.456 C 62.252 44.380, 60 43.069, 60 41.221 C 60 37.069, 65.056 35.516, 67.232 39 C 68.730 41.399, 74 41.801, 74 39.516 C 74 37.025, 68.681 32.024, 65.500 31.523 C 63.850 31.263, 61.375 31.510, 60 32.070 M 43.780 44.668 C 43.572 54.057, 43.159 57.450, 42.184 57.774 C 41.459 58.014, 40.621 57.265, 40.317 56.105 C 39.918 54.579, 38.974 54, 36.883 54 C 33.338 54, 33.022 56.486, 36.073 60.365 C 38.717 63.727, 44.942 64.058, 48 61 C 49.802 59.198, 50 57.667, 50 45.500 L 50 32 47.030 32 L 44.060 32 43.780 44.668 M 24.250 70.662 C 19.659 72.515, 29.385 84.096, 39.278 88.558 C 44.436 90.884, 46.868 91.362, 53.500 91.356 C 64.547 91.344, 71.304 88.609, 79.078 81.003 C 85.137 75.074, 86.041 73.108, 83.627 71.105 C 81.788 69.579, 79.575 70.557, 77.937 73.617 C 76.377 76.533, 69.058 82.028, 64 84.080 C 62.075 84.861, 57.350 85.500, 53.500 85.500 C 44.366 85.500, 36.766 81.953, 30.839 74.924 C 28.555 72.216, 26.420 70.036, 26.093 70.079 C 25.767 70.122, 24.938 70.385, 24.250 70.662" stroke="none" fill="#37342F" fill-rule="evenodd"/>
                                </g>
                            </svg>
                        </div>
                        <span class="text-2xl font-bold tracking-tight uppercase text-black">ClawHub</span>
                    </a>
                    <div class="hidden md:flex items-center gap-8 font-mono font-bold">
                        ${navItemsHTML}
                    </div>
                    <a href="https://github.com/imjszhang/js-clawhub/issues" target="_blank" class="brutal-btn-primary px-6 py-2 text-sm no-underline hidden sm:inline-block">
                        Submit
                    </a>
                    <!-- Mobile menu button -->
                    <button id="mobile-menu-btn" class="md:hidden border-3 border-black p-2 bg-white" onclick="Nav.toggleMobile()">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                            <path stroke-linecap="square" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </div>
                <!-- Mobile menu -->
                <div id="mobile-menu" class="hidden max-w-7xl mx-auto bg-white border-3 border-t-0 border-black shadow-brutal mt-0">
                    <div class="flex flex-col font-mono font-bold">
                        ${this.items.map(item => {
                            const resolvedHref = this.resolveHref(basePath, item.href);
                            return `<a href="${resolvedHref}" class="px-6 py-3 border-b border-black/10 hover:bg-brand-yellow">${item.label}</a>`;
                        }).join('')}
                        <a href="https://github.com/imjszhang/js-clawhub/issues" target="_blank" class="px-6 py-3 bg-black text-brand-yellow text-center">SUBMIT PROJECT</a>
                    </div>
                </div>
            </nav>
        `;
    },

    /**
     * Toggle mobile menu
     */
    toggleMobile() {
        const menu = document.getElementById('mobile-menu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    },

    /**
     * Check if nav item is active
     */
    isActive(currentPath, itemHref) {
        if (itemHref === '/') {
            return currentPath.endsWith('/') && !currentPath.includes('/skills/') && 
                   !currentPath.includes('/blog/') && !currentPath.includes('/guide/');
        }
        return currentPath.includes(itemHref);
    },

    /**
     * Resolve href relative to base path
     */
    resolveHref(basePath, href) {
        if (href === '/') return basePath;
        // Remove leading slash and append to base
        return basePath + href.replace(/^\//, '');
    }
};

// Auto-render on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    Nav.render('nav-container');
});
