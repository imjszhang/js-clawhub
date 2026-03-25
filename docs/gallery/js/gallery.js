/**
 * JS ClawHub Gallery - Client-side rendering logic
 * Neo-Brutalism style with i18n, tag filtering, search, and sort.
 */

const Gallery = {
    config: {
        dataFile: './data/index.json',
    },

    state: {
        allItems: [],
        activeTags: new Set(),
        searchQuery: '',
        sortOrder: 'newest',
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
        const t = I18nManager.t('gallery.tags.' + tag);
        return t !== 'gallery.tags.' + tag ? t : tag;
    },

    async loadItems() {
        const container = document.getElementById('gallery-container');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const errorState = document.getElementById('error-state');

        try {
            const response = await fetch(this.config.dataFile);
            if (!response.ok) throw new Error('Failed to fetch gallery index');

            const items = await response.json();
            if (loadingState) loadingState.remove();

            if (!items || items.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            this.state.allItems = items;
            this.readURL();
            this.renderTagFilters();
            this.bindEvents();
            this.syncToolbarUI();
            this.filterAndRender();

            document.getElementById('filter-toolbar')?.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading gallery:', error);
            if (loadingState) loadingState.remove();
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    readURL() {
        const params = new URLSearchParams(window.location.search);
        const tags = params.get('tag');
        if (tags) {
            this.state.activeTags = new Set(tags.split(',').filter(Boolean));
        }
        this.state.searchQuery = params.get('q') || '';
        this.state.sortOrder = params.get('sort') || 'newest';
    },

    syncURL() {
        const params = new URLSearchParams();
        if (this.state.activeTags.size > 0) {
            params.set('tag', [...this.state.activeTags].join(','));
        }
        if (this.state.searchQuery) params.set('q', this.state.searchQuery);
        if (this.state.sortOrder !== 'newest') params.set('sort', this.state.sortOrder);

        const qs = params.toString();
        const url = qs ? `?${qs}` : window.location.pathname;
        history.replaceState(null, '', url);
    },

    renderTagFilters() {
        const container = document.getElementById('tag-filters');
        if (!container) return;

        const allTags = new Set();
        for (const item of this.state.allItems) {
            (item.tags || []).forEach(t => allTags.add(t));
        }

        const allLabel = this._t('gallery.allTags', '全部');
        let html = `<button class="brutal-tag-filter${this.state.activeTags.size === 0 ? ' active' : ''}" data-tag="">${this.escapeHtml(allLabel)}</button>`;

        for (const tag of allTags) {
            const isActive = this.state.activeTags.has(tag);
            html += `<button class="brutal-tag-filter${isActive ? ' active' : ''}" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(this._tag(tag))}</button>`;
        }
        container.innerHTML = html;
    },

    syncToolbarUI() {
        const searchInput = document.getElementById('gallery-search');
        if (searchInput && searchInput.value !== this.state.searchQuery) {
            searchInput.value = this.state.searchQuery;
        }
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) sortSelect.value = this.state.sortOrder;
    },

    _bound: false,
    bindEvents() {
        if (this._bound) return;
        this._bound = true;

        let debounceTimer;
        document.getElementById('gallery-search')?.addEventListener('input', (e) => {
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

        window.addEventListener('popstate', () => {
            this.readURL();
            this.renderTagFilters();
            this.syncToolbarUI();
            this.filterAndRender();
        });
    },

    filterAndRender() {
        let items = [...this.state.allItems];

        if (this.state.activeTags.size > 0) {
            items = items.filter(item =>
                (item.tags || []).some(t => this.state.activeTags.has(t))
            );
        }

        if (this.state.searchQuery) {
            const q = this.state.searchQuery.toLowerCase();
            items = items.filter(item => {
                const title = (item.title?.['zh-CN'] || '') + ' ' + (item.title?.['en-US'] || '');
                const desc = (item.description?.['zh-CN'] || '') + ' ' + (item.description?.['en-US'] || '');
                const prompt = item.creation?.prompt || '';
                const model = item.creation?.model || '';
                const tags = (item.tags || []).join(' ');
                return (title + ' ' + desc + ' ' + prompt + ' ' + model + ' ' + tags).toLowerCase().includes(q);
            });
        }

        if (this.state.sortOrder === 'oldest') {
            items.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        } else {
            items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        }

        this.renderItems(items);
        this.updateResultsCount(items.length, this.state.allItems.length);
        this.syncURL();
    },

    renderItems(items) {
        const container = document.getElementById('gallery-container');
        const emptyState = document.getElementById('empty-state');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        if (emptyState) emptyState.classList.add('hidden');

        container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
        container.innerHTML = items.map(item => this.renderCard(item)).join('');
    },

    renderCard(item) {
        const title = this._l(item, 'title');
        const imageSrc = item.thumbnail || item.image;
        const model = item.creation?.model || '';
        const workflow = item.creation?.workflowDisplay || '';

        const tagsHTML = (item.tags || [])
            .map(tag => `<span class="brutal-tag">${this.escapeHtml(this._tag(tag))}</span>`)
            .join('');

        const metaBadges = [model, workflow].filter(Boolean)
            .map(v => `<span class="text-[10px] font-mono bg-black/10 px-1.5 py-0.5">${this.escapeHtml(v)}</span>`)
            .join('');

        return `
            <a href="./detail.html?id=${encodeURIComponent(item.id)}" class="brutal-card flex flex-col no-underline text-black group overflow-hidden">
                <div class="relative w-full aspect-square overflow-hidden border-b-3 border-black bg-black/5">
                    <img src="${this.escapeHtml(imageSrc)}" alt="${this.escapeHtml(title)}"
                         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                         loading="lazy"
                         onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full font-mono text-black/30 text-sm\\'>NO IMAGE</div>'">
                </div>
                <div class="flex flex-col p-4 flex-grow">
                    ${tagsHTML ? `<div class="flex flex-wrap gap-1 mb-2">${tagsHTML}</div>` : ''}
                    <h3 class="text-sm font-bold uppercase mb-2 group-hover:bg-black group-hover:text-brand-yellow group-hover:px-1 transition-all leading-tight">
                        ${this.escapeHtml(title)}
                    </h3>
                    ${metaBadges ? `<div class="flex flex-wrap gap-1 mt-auto pt-2">${metaBadges}</div>` : ''}
                    <time class="font-mono text-[10px] text-black/50 mt-2" datetime="${item.createdAt}">
                        ${this.formatDate(item.createdAt)}
                    </time>
                </div>
            </a>
        `;
    },

    updateResultsCount(shown, total) {
        const el = document.getElementById('results-count');
        if (!el) return;
        if (shown === total) {
            el.textContent = `${total} ${this._t('gallery.itemsUnit', 'works')}`;
        } else {
            const tpl = this._t('gallery.resultsCount', '{n} / {total}');
            el.textContent = tpl.replace('{n}', shown).replace('{total}', total);
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

window.Gallery = Gallery;
