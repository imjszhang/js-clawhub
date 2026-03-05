/**
 * JS ClawHub Blog - Client-side rendering logic
 * Neo-Brutalism style with i18n, tag filtering, search, sort, and view toggle.
 */

const Blog = {
    config: {
        postsDir: './posts/',
        indexFile: './posts/index.json',
    },

    state: {
        allPosts: [],
        activeTags: new Set(),
        searchQuery: '',
        sortOrder: 'newest',
        viewMode: 'card',
    },

    _l(obj, field) {
        if (typeof I18nManager !== 'undefined') return I18nManager.getLocalizedField(obj, field);
        const val = obj[field];
        return typeof val === 'string' ? val : (val && val['zh-CN']) || '';
    },

    _t(key, fallback) {
        if (typeof I18nManager !== 'undefined') {
            const v = I18nManager.t(key);
            return v !== key ? v : (fallback || key);
        }
        return fallback || key;
    },

    _tag(tag) {
        if (typeof I18nManager === 'undefined') return tag;
        const t = I18nManager.t('blog.tags.' + tag);
        return t !== 'blog.tags.' + tag ? t : tag;
    },

    // ── Data loading ─────────────────────────────────────────────────

    async loadPostList() {
        const container = document.getElementById('posts-container');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const errorState = document.getElementById('error-state');

        try {
            const response = await fetch(this.config.indexFile);
            if (!response.ok) throw new Error('Failed to fetch posts index');

            const posts = await response.json();
            if (loadingState) loadingState.remove();

            if (!posts || posts.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            this.state.allPosts = posts;
            this.state.viewMode = localStorage.getItem('blog-view') || 'card';
            this.readURL();
            this.renderTagFilters();
            this.bindEvents();
            this.syncToolbarUI();
            this.filterAndRender();

            document.getElementById('filter-toolbar')?.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading posts:', error);
            if (loadingState) loadingState.remove();
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    // ── URL state sync ───────────────────────────────────────────────

    readURL() {
        const params = new URLSearchParams(window.location.search);
        const tags = params.get('tag');
        if (tags) {
            this.state.activeTags = new Set(tags.split(',').filter(Boolean));
        }
        this.state.searchQuery = params.get('q') || '';
        this.state.sortOrder = params.get('sort') || 'newest';
        if (params.get('view')) {
            this.state.viewMode = params.get('view');
        }
    },

    syncURL() {
        const params = new URLSearchParams();
        if (this.state.activeTags.size > 0) {
            params.set('tag', [...this.state.activeTags].join(','));
        }
        if (this.state.searchQuery) params.set('q', this.state.searchQuery);
        if (this.state.sortOrder !== 'newest') params.set('sort', this.state.sortOrder);
        if (this.state.viewMode !== 'card') params.set('view', this.state.viewMode);

        const qs = params.toString();
        const url = qs ? `?${qs}` : window.location.pathname;
        history.replaceState(null, '', url);
    },

    // ── Toolbar rendering & binding ──────────────────────────────────

    renderTagFilters() {
        const container = document.getElementById('tag-filters');
        if (!container) return;

        const allTags = new Set();
        for (const post of this.state.allPosts) {
            (post.tags || []).forEach(t => allTags.add(t));
        }

        const allLabel = this._t('blog.allTags', '全部');
        let html = `<button class="brutal-tag-filter${this.state.activeTags.size === 0 ? ' active' : ''}" data-tag="">${this.escapeHtml(allLabel)}</button>`;

        for (const tag of allTags) {
            const isActive = this.state.activeTags.has(tag);
            html += `<button class="brutal-tag-filter${isActive ? ' active' : ''}" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(this._tag(tag))}</button>`;
        }
        container.innerHTML = html;
    },

    syncToolbarUI() {
        const searchInput = document.getElementById('blog-search');
        if (searchInput && searchInput.value !== this.state.searchQuery) {
            searchInput.value = this.state.searchQuery;
        }

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = this.state.sortOrder;

        document.getElementById('view-card')?.classList.toggle('active', this.state.viewMode === 'card');
        document.getElementById('view-list')?.classList.toggle('active', this.state.viewMode === 'list');
    },

    _bound: false,
    bindEvents() {
        if (this._bound) return;
        this._bound = true;

        let debounceTimer;
        document.getElementById('blog-search')?.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.state.searchQuery = e.target.value.trim();
                this.filterAndRender();
            }, 300);
        });

        document.getElementById('tag-filters')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-tag]');
            if (!btn) return;
            const tag = btn.dataset.tag;
            if (!tag) {
                this.state.activeTags.clear();
            } else if (this.state.activeTags.has(tag)) {
                this.state.activeTags.delete(tag);
            } else {
                this.state.activeTags.add(tag);
            }
            this.renderTagFilters();
            this.filterAndRender();
        });

        document.getElementById('sort-select')?.addEventListener('change', (e) => {
            this.state.sortOrder = e.target.value;
            this.filterAndRender();
        });

        document.getElementById('view-card')?.addEventListener('click', () => {
            this.state.viewMode = 'card';
            localStorage.setItem('blog-view', 'card');
            this.syncToolbarUI();
            this.filterAndRender();
        });

        document.getElementById('view-list')?.addEventListener('click', () => {
            this.state.viewMode = 'list';
            localStorage.setItem('blog-view', 'list');
            this.syncToolbarUI();
            this.filterAndRender();
        });

        window.addEventListener('popstate', () => {
            this.readURL();
            this.renderTagFilters();
            this.syncToolbarUI();
            this.filterAndRender();
        });
    },

    // ── Filter pipeline ──────────────────────────────────────────────

    filterAndRender() {
        let posts = [...this.state.allPosts];

        if (this.state.activeTags.size > 0) {
            posts = posts.filter(p =>
                (p.tags || []).some(t => this.state.activeTags.has(t))
            );
        }

        if (this.state.searchQuery) {
            const q = this.state.searchQuery.toLowerCase();
            posts = posts.filter(p => {
                const title = (p.title?.['zh-CN'] || '') + ' ' + (p.title?.['en-US'] || '');
                const summary = (p.summary?.['zh-CN'] || '') + ' ' + (p.summary?.['en-US'] || '');
                const tags = (p.tags || []).join(' ');
                return (title + ' ' + summary + ' ' + tags).toLowerCase().includes(q);
            });
        }

        if (this.state.sortOrder === 'oldest') {
            posts.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        } else {
            posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        }

        this.renderPosts(posts);
        this.updateResultsCount(posts.length, this.state.allPosts.length);
        this.syncURL();
    },

    renderPosts(posts) {
        const container = document.getElementById('posts-container');
        const emptyState = document.getElementById('empty-state');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        if (this.state.viewMode === 'list') {
            container.className = 'flex flex-col gap-0';
            const { seriesGroups, standalone } = this.groupBySeries(posts);
            let html = '';
            for (const group of seriesGroups) {
                html += this.renderSeriesListSection(group);
            }
            html += standalone.map(p => this.renderListItem(p)).join('');
            container.innerHTML = html;
        } else {
            container.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
            const { seriesGroups, standalone } = this.groupBySeries(posts);
            let html = '';
            for (const group of seriesGroups) {
                html += this.renderSeriesSection(group);
            }
            html += standalone.map(p => this.renderPostCard(p)).join('');
            container.innerHTML = html;
        }
    },

    updateResultsCount(shown, total) {
        const el = document.getElementById('results-count');
        if (!el) return;
        if (shown === total) {
            el.textContent = `${total} ${this._t('blog.postsUnit', 'posts')}`;
        } else {
            const tpl = this._t('blog.resultsCount', '{n} / {total}');
            el.textContent = tpl.replace('{n}', shown).replace('{total}', total);
        }
    },

    // ── Card view renderers ──────────────────────────────────────────

    renderPostCard(post) {
        const title = this._l(post, 'title');
        const summary = this._l(post, 'summary');

        const tagsHTML = post.tags && post.tags.length > 0
            ? post.tags.map(tag => `<span class="brutal-tag">${this.escapeHtml(this._tag(tag))}</span>`).join('')
            : '';

        const authorHTML = post.author ? `
            <div class="flex items-center gap-2">
                <img src="${post.author.avatar}" alt="${this.escapeHtml(post.author.name)}" 
                     class="w-6 h-6 rounded-full border-2 border-black" 
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=FCD228&color=000&bold=true&size=48'">
                <span class="font-mono text-xs font-bold">@${this.escapeHtml(post.author.name)}</span>
            </div>
        ` : '';

        const coverHTML = post.cover ? `
            <div class="relative w-full h-40 mb-4 overflow-hidden border-b-3 border-black">
                <img src="${post.cover}" alt="${this.escapeHtml(title)}" 
                     class="w-full h-full object-cover"
                     onerror="this.parentElement.style.display='none'">
            </div>
        ` : '';

        return `
            <a href="./post.html?slug=${encodeURIComponent(post.slug)}" class="brutal-card flex flex-col h-full no-underline text-black group">
                ${coverHTML}
                <div class="flex flex-col h-full p-5">
                    ${tagsHTML ? `<div class="flex flex-wrap gap-1 mb-3">${tagsHTML}</div>` : ''}
                    <h2 class="text-lg font-bold uppercase mb-2 group-hover:bg-black group-hover:text-brand-yellow group-hover:px-1 transition-all">
                        ${this.escapeHtml(title)}
                    </h2>
                    <p class="text-sm font-medium mb-4 flex-grow line-clamp-2">
                        ${this.escapeHtml(summary)}
                    </p>
                    <div class="flex items-center justify-between pt-3 border-t-2 border-black/10 mt-auto">
                        ${authorHTML}
                        <time class="font-mono text-xs text-black/60" datetime="${post.date}">
                            ${this.formatDate(post.date)}
                        </time>
                    </div>
                </div>
            </a>
        `;
    },

    groupBySeries(posts) {
        const seriesMap = new Map();
        const standalone = [];

        for (const post of posts) {
            if (post.series && post.series.id) {
                if (!seriesMap.has(post.series.id)) {
                    seriesMap.set(post.series.id, { id: post.series.id, posts: [] });
                }
                seriesMap.get(post.series.id).posts.push(post);
            } else {
                standalone.push(post);
            }
        }

        const seriesGroups = [];
        for (const group of seriesMap.values()) {
            group.posts.sort((a, b) => (a.series?.order || 0) - (b.series?.order || 0));
            seriesGroups.push(group);
        }
        return { seriesGroups, standalone };
    },

    renderSeriesSection(group) {
        const first = group.posts[0];
        const seriesTitle = first.series?.title
            ? this._l({ title: first.series.title }, 'title') : '';
        const displayTitle = seriesTitle || group.id;
        const count = group.posts.length;
        const cardsHTML = group.posts.map(post => this.renderPostCard(post)).join('');

        return `
            <div class="col-span-full mb-2">
                <details open>
                    <summary class="cursor-pointer select-none brutal-card p-4 mb-4 flex items-center gap-3 font-black uppercase text-lg">
                        <span class="bg-black text-brand-yellow px-3 py-1 text-sm font-mono font-black border-2 border-black">${this.escapeHtml(displayTitle)}</span>
                        <span class="text-sm font-mono font-normal text-black/60">${count} posts</span>
                    </summary>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        ${cardsHTML}
                    </div>
                </details>
            </div>
        `;
    },

    // ── List view renderers ──────────────────────────────────────────

    renderListItem(post) {
        const title = this._l(post, 'title');
        const tagsHTML = (post.tags || [])
            .map(tag => `<span class="brutal-tag text-[10px]">${this.escapeHtml(this._tag(tag))}</span>`)
            .join('');

        return `
            <a href="./post.html?slug=${encodeURIComponent(post.slug)}" class="brutal-list-item group">
                <time class="font-mono text-xs text-black/50 shrink-0 w-24 hidden sm:block" datetime="${post.date}">
                    ${this.formatDate(post.date)}
                </time>
                <span class="font-bold text-sm uppercase flex-grow group-hover:bg-black group-hover:text-brand-yellow group-hover:px-1 transition-all truncate">
                    ${this.escapeHtml(title)}
                </span>
                <span class="hidden md:flex gap-1 shrink-0">${tagsHTML}</span>
            </a>
        `;
    },

    renderSeriesListSection(group) {
        const first = group.posts[0];
        const seriesTitle = first.series?.title
            ? this._l({ title: first.series.title }, 'title') : '';
        const displayTitle = seriesTitle || group.id;
        const count = group.posts.length;
        const itemsHTML = group.posts.map(p => this.renderListItem(p)).join('');

        return `
            <div class="mb-4">
                <details open>
                    <summary class="cursor-pointer select-none brutal-card p-3 mb-2 flex items-center gap-3 font-black uppercase text-sm">
                        <span class="bg-black text-brand-yellow px-3 py-1 text-xs font-mono font-black">${this.escapeHtml(displayTitle)}</span>
                        <span class="text-xs font-mono font-normal text-black/60">${count} posts</span>
                    </summary>
                    <div class="flex flex-col gap-0 mb-4">
                        ${itemsHTML}
                    </div>
                </details>
            </div>
        `;
    },

    // ── Single post page (unchanged) ─────────────────────────────────

    async loadPost(slug) {
        const headerEl = document.getElementById('post-header');
        const contentEl = document.getElementById('post-content');
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');

        try {
            const indexResponse = await fetch(this.config.indexFile);
            if (!indexResponse.ok) throw new Error('Failed to fetch posts index');

            const posts = await indexResponse.json();
            const postMeta = posts.find(p => p.slug === slug);
            if (!postMeta) throw new Error('Post not found');

            let markdown = null;
            const locale = typeof I18nManager !== 'undefined' ? I18nManager.getLocale() : 'zh-CN';

            if (locale !== 'zh-CN') {
                try {
                    const resp = await fetch(`${this.config.postsDir}${slug}.${locale}.md`);
                    if (resp.ok) markdown = await resp.text();
                } catch {}
            }

            if (!markdown) {
                const mdResponse = await fetch(`${this.config.postsDir}${slug}.md`);
                if (!mdResponse.ok) throw new Error('Failed to fetch post content');
                markdown = await mdResponse.text();
            }

            markdown = this.removeFrontmatter(markdown);
            this.renderPostHeader(headerEl, postMeta);
            this.updatePageMeta(postMeta);

            const html = this.renderMarkdown(markdown);
            contentEl.innerHTML = html;
            this.highlightCode();

            if (postMeta.series && postMeta.series.id) {
                const seriesNav = this.renderSeriesNav(posts, postMeta);
                if (seriesNav) contentEl.insertAdjacentHTML('beforeend', seriesNav);
            }

            if (loadingState) loadingState.remove();

        } catch (error) {
            console.error('Error loading post:', error);
            if (loadingState) loadingState.remove();
            if (headerEl) headerEl.innerHTML = '';
            if (contentEl) contentEl.innerHTML = '';
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    renderPostHeader(container, post) {
        const title = this._l(post, 'title');
        const tagsHTML = post.tags && post.tags.length > 0
            ? post.tags.map(tag => `<span class="brutal-tag">${this.escapeHtml(this._tag(tag))}</span>`).join('')
            : '';

        const authorHTML = post.author ? `
            <a href="${post.author.url || '#'}" target="_blank" class="flex items-center gap-3 no-underline text-black">
                <img src="${post.author.avatar}" alt="${this.escapeHtml(post.author.name)}" 
                     class="w-10 h-10 rounded-full border-2 border-black"
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=FCD228&color=000&bold=true&size=80'">
                <div class="flex flex-col">
                    <span class="font-bold">@${this.escapeHtml(post.author.name)}</span>
                    <span class="font-mono text-xs text-black/60">on X</span>
                </div>
            </a>
        ` : '';

        const coverHTML = post.cover ? `
            <div class="relative w-full aspect-video mb-8 overflow-hidden border-3 border-black shadow-brutal">
                <img src="${post.cover}" alt="${this.escapeHtml(title)}" 
                     class="w-full h-full object-cover"
                     onerror="this.parentElement.style.display='none'">
            </div>
        ` : '';

        container.innerHTML = `
            ${coverHTML}
            <h1 class="text-3xl sm:text-4xl font-black uppercase mb-6 leading-tight">
                ${this.escapeHtml(title)}
            </h1>
            <div class="flex flex-wrap items-center gap-6 text-sm pb-6 border-b-3 border-black">
                ${authorHTML}
                <div class="flex items-center gap-4">
                    <time datetime="${post.date}" class="font-mono font-bold">
                        ${this.formatDate(post.date)}
                    </time>
                    ${tagsHTML ? `<div class="flex flex-wrap gap-1">${tagsHTML}</div>` : ''}
                </div>
            </div>
        `;
    },

    renderSeriesNav(allPosts, currentPost) {
        const seriesId = currentPost.series?.id;
        if (!seriesId) return null;

        const siblings = allPosts
            .filter(p => p.series?.id === seriesId)
            .sort((a, b) => (a.series?.order || 0) - (b.series?.order || 0));

        const idx = siblings.findIndex(p => p.slug === currentPost.slug);
        if (idx < 0) return null;

        const prev = idx > 0 ? siblings[idx - 1] : null;
        const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;
        if (!prev && !next) return null;

        const seriesTitle = currentPost.series?.title
            ? this._l({ title: currentPost.series.title }, 'title') : seriesId;

        const prevHTML = prev ? `
            <a href="./post.html?slug=${encodeURIComponent(prev.slug)}" class="brutal-card p-4 no-underline text-black hover:bg-brand-yellow transition-colors">
                <span class="text-xs font-mono text-black/50">← PREV</span>
                <p class="font-bold text-sm mt-1">${this.escapeHtml(this._l(prev, 'title'))}</p>
            </a>` : '<div></div>';

        const nextHTML = next ? `
            <a href="./post.html?slug=${encodeURIComponent(next.slug)}" class="brutal-card p-4 no-underline text-black text-right hover:bg-brand-yellow transition-colors">
                <span class="text-xs font-mono text-black/50">NEXT →</span>
                <p class="font-bold text-sm mt-1">${this.escapeHtml(this._l(next, 'title'))}</p>
            </a>` : '<div></div>';

        return `
            <div class="mt-12 pt-6 border-t-3 border-black">
                <p class="font-mono text-xs text-black/50 mb-3 uppercase">${this.escapeHtml(seriesTitle)} · ${idx + 1} / ${siblings.length}</p>
                <div class="grid grid-cols-2 gap-4">
                    ${prevHTML}
                    ${nextHTML}
                </div>
            </div>
        `;
    },

    // ── Utilities ─────────────────────────────────────────────────────

    updatePageMeta(post) {
        const title = this._l(post, 'title');
        const summary = this._l(post, 'summary');
        document.title = title + (typeof I18nManager !== 'undefined' ? I18nManager.t('blog.postTitleSuffix') : ' - JS ClawHub Blog');
        const metaDesc = document.getElementById('meta-description');
        if (metaDesc && summary) metaDesc.setAttribute('content', summary);
        const ogTitle = document.getElementById('og-title');
        if (ogTitle) ogTitle.setAttribute('content', title);
        const ogDesc = document.getElementById('og-description');
        if (ogDesc && summary) ogDesc.setAttribute('content', summary);
    },

    removeFrontmatter(markdown) {
        let content = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
        content = content.replace(/^\s*#\s+[^\n]+\n+/, '');
        return content;
    },

    renderMarkdown(markdown) {
        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
            return marked.parse(markdown);
        }
        return `<pre>${this.escapeHtml(markdown)}</pre>`;
    },

    highlightCode() {
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
        }
    },

    formatDate(dateStr) {
        if (typeof I18nManager !== 'undefined') {
            return I18nManager.formatDate(dateStr);
        }
        try {
            return new Date(dateStr).toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch { return dateStr; }
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

window.Blog = Blog;
