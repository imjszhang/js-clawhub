/**
 * JS ClawHub Gallery Detail - Single artwork view with creation info sharing
 */

const GalleryDetail = {
    config: {
        dataFile: './data/index.json',
    },

    currentItem: null,

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

    async load(id) {
        const loadingState = document.getElementById('loading-state');
        const detailContent = document.getElementById('detail-content');
        const errorState = document.getElementById('error-state');

        try {
            const response = await fetch(this.config.dataFile);
            if (!response.ok) throw new Error('Failed to fetch gallery data');

            const items = await response.json();
            const item = items.find(i => i.id === id);
            if (!item) throw new Error('Item not found');

            this.currentItem = item;

            if (loadingState) loadingState.remove();
            this.renderDetail(item);
            this.updatePageMeta(item);
            if (detailContent) detailContent.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading gallery item:', error);
            if (loadingState) loadingState.remove();
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    renderDetail(item) {
        const title = this._l(item, 'title');
        const description = this._l(item, 'description');
        const creation = item.creation || {};

        // Image
        const img = document.getElementById('detail-image');
        if (img) {
            img.src = item.image;
            img.alt = title;
        }
        const fsImg = document.getElementById('fullscreen-image');
        if (fsImg) {
            fsImg.src = item.image;
            fsImg.alt = title;
        }

        // Title & meta
        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.textContent = title;

        const descEl = document.getElementById('detail-description');
        if (descEl) descEl.textContent = description || '';

        const dateEl = document.getElementById('detail-date');
        if (dateEl) {
            dateEl.setAttribute('datetime', item.createdAt);
            dateEl.textContent = this.formatDate(item.createdAt);
        }

        // Tags
        const tagsEl = document.getElementById('detail-tags');
        if (tagsEl && item.tags?.length) {
            tagsEl.innerHTML = item.tags
                .map(tag => `<span class="brutal-tag">${this.escapeHtml(this._tag(tag))}</span>`)
                .join('');
        }

        // Prompt
        if (creation.prompt) {
            const section = document.getElementById('prompt-section');
            const el = document.getElementById('detail-prompt');
            if (section) section.classList.remove('hidden');
            if (el) el.textContent = creation.prompt;
        }

        // Negative Prompt
        if (creation.negativePrompt) {
            const section = document.getElementById('neg-prompt-section');
            const el = document.getElementById('detail-neg-prompt');
            if (section) section.classList.remove('hidden');
            if (el) el.textContent = creation.negativePrompt;
        }

        // Parameters grid
        const paramsGrid = document.getElementById('params-grid');
        if (paramsGrid) {
            const params = [
                { key: 'gallery.workflow', value: creation.workflowDisplay || creation.workflow },
                { key: 'gallery.model', value: creation.model },
                { key: 'gallery.sampler', value: creation.sampler },
                { key: 'gallery.steps', value: creation.steps },
                { key: 'gallery.cfgScale', value: creation.cfgScale },
                { key: 'gallery.seed', value: creation.seed },
                { key: 'gallery.resolution', value: creation.resolution },
            ].filter(p => p.value != null && p.value !== '');

            paramsGrid.innerHTML = params.map(p => `
                <div class="bg-black/5 p-2">
                    <div class="font-mono text-[10px] font-bold text-black/50 uppercase">${this.escapeHtml(this._t(p.key, p.key.split('.').pop()))}</div>
                    <div class="font-mono text-xs font-bold mt-0.5 break-all">${this.escapeHtml(String(p.value))}</div>
                </div>
            `).join('');
        }
    },

    updatePageMeta(item) {
        const title = this._l(item, 'title');
        const description = this._l(item, 'description');
        document.title = title + (this._t('gallery.detailTitleSuffix', ' - JS ClawHub Gallery'));

        const metaDesc = document.getElementById('meta-description');
        if (metaDesc && description) metaDesc.setAttribute('content', description);

        const ogTitle = document.getElementById('og-title');
        if (ogTitle) ogTitle.setAttribute('content', title);

        const ogDesc = document.getElementById('og-description');
        if (ogDesc && description) ogDesc.setAttribute('content', description);

        const ogImage = document.getElementById('og-image');
        if (ogImage && item.image) {
            const imageUrl = new URL(item.image, window.location.href).href;
            ogImage.setAttribute('content', imageUrl);
        }
    },

    toggleFullscreen() {
        const overlay = document.getElementById('fullscreen-overlay');
        if (!overlay) return;
        if (overlay.classList.contains('hidden')) {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            document.body.style.overflow = 'hidden';
        } else {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
            document.body.style.overflow = '';
        }
    },

    copyText(type) {
        if (!this.currentItem?.creation) return;
        const creation = this.currentItem.creation;
        let text = '';

        if (type === 'prompt') {
            text = creation.prompt || '';
        } else if (type === 'negativePrompt') {
            text = creation.negativePrompt || '';
        }

        this._copyToClipboard(text);
    },

    copyAllParams() {
        if (!this.currentItem?.creation) return;
        const creation = this.currentItem.creation;
        const title = this._l(this.currentItem, 'title');

        const data = {
            title,
            prompt: creation.prompt,
            negativePrompt: creation.negativePrompt,
            workflow: creation.workflowDisplay || creation.workflow,
            model: creation.model,
            sampler: creation.sampler,
            steps: creation.steps,
            cfgScale: creation.cfgScale,
            seed: creation.seed,
            resolution: creation.resolution,
        };

        Object.keys(data).forEach(k => {
            if (data[k] == null || data[k] === '') delete data[k];
        });

        this._copyToClipboard(JSON.stringify(data, null, 2));
    },

    shareLink() {
        this._copyToClipboard(window.location.href);
    },

    _copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this._showToast();
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this._showToast();
        });
    },

    _toastTimer: null,
    _showToast() {
        const toast = document.getElementById('copy-toast');
        if (!toast) return;
        clearTimeout(this._toastTimer);
        toast.classList.remove('hidden');
        this._toastTimer = setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
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

window.GalleryDetail = GalleryDetail;
