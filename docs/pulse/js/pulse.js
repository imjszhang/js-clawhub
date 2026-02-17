/**
 * JS ClawHub Pulse - Client-side rendering logic
 * Renders OpenClaw ecosystem X highlights as a timeline
 * With i18n support via I18nManager
 *
 * v3: date filtering, bilingual title/summary, JS's Take, views/bookmarks
 */

const Pulse = {
    config: {
        dataFile: './data/items.json',
    },

    _allItems: [],
    _allDates: [],
    _filter: 'all',

    _t(key) {
        return typeof I18nManager !== 'undefined' ? I18nManager.t(key) : key;
    },

    _l(item, field) {
        if (typeof I18nManager !== 'undefined') return I18nManager.getLocalizedField(item, field);
        const val = item[field];
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object') return val['zh-CN'] || val['en-US'] || '';
        return '';
    },

    _todayStr() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    _daysAgoStr(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    _applyFilter(items) {
        const f = this._filter;
        if (f === 'all') return items;

        let cutoff;
        if (f === 'today') cutoff = this._todayStr();
        else if (f === 'yesterday') cutoff = this._daysAgoStr(1);
        else if (f === 'last7') cutoff = this._daysAgoStr(6);
        else if (f === 'last30') cutoff = this._daysAgoStr(29);
        else cutoff = f;

        if (f === 'today') return items.filter(it => it.date === cutoff);
        if (f === 'yesterday') return items.filter(it => it.date === cutoff);
        if (f === 'last7' || f === 'last30') return items.filter(it => it.date >= cutoff);

        return items.filter(it => it.date === f);
    },

    /**
     * Load and render pulse items
     */
    async load() {
        const container = document.getElementById('pulse-container');
        const loadingState = document.getElementById('loading-state');
        const emptyState = document.getElementById('empty-state');
        const errorState = document.getElementById('error-state');

        try {
            if (this._allItems.length === 0) {
                const response = await fetch(this.config.dataFile);
                if (!response.ok) throw new Error('Failed to fetch pulse data');
                this._allItems = await response.json();
                this._allDates = [...new Set(this._allItems.map(it => it.date))].sort((a, b) => b.localeCompare(a));
            }

            if (loadingState) loadingState.remove();

            if (!this._allItems || this._allItems.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            const filtered = this._applyFilter(this._allItems);
            const grouped = this.groupByDate(filtered);

            const filterBar = document.getElementById('pulse-filter-bar');
            if (filterBar) filterBar.innerHTML = this.renderFilterBar();

            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <p class="font-mono font-bold text-xl text-black/40">// ${this.escapeHtml(this._t('pulse.noPulse'))}</p>
                    </div>`;
                return;
            }

            container.innerHTML = this.renderTimeline(grouped);

        } catch (error) {
            console.error('Error loading pulse:', error);
            if (loadingState) loadingState.remove();
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    setFilter(value) {
        this._filter = value;
        this.load();
    },

    renderFilterBar() {
        const presets = [
            { key: 'all',       label: this._t('pulse.filterAll') },
            { key: 'today',     label: this._t('pulse.filterToday') },
            { key: 'yesterday', label: this._t('pulse.filterYesterday') },
            { key: 'last7',     label: this._t('pulse.filterLast7') },
            { key: 'last30',    label: this._t('pulse.filterLast30') },
        ];

        const today = this._todayStr();
        const yesterday = this._daysAgoStr(1);

        const presetHTML = presets.map(({ key, label }) => {
            const active = this._filter === key;
            const cls = active
                ? 'bg-black text-brand-yellow shadow-brutal-hover'
                : 'bg-white text-black hover:bg-black hover:text-brand-yellow';
            return `<button onclick="Pulse.setFilter('${key}')" class="flex-shrink-0 px-3 py-1.5 font-mono text-xs font-bold border-2 border-black transition-all ${cls}">${this.escapeHtml(label)}</button>`;
        }).join('');

        const specificDates = this._allDates
            .filter(d => d !== today && d !== yesterday)
            .slice(0, 14);

        const dateHTML = specificDates.map(d => {
            const active = this._filter === d;
            const cls = active
                ? 'bg-black text-brand-yellow shadow-brutal-hover'
                : 'bg-white text-black/60 hover:bg-black hover:text-brand-yellow';
            return `<button onclick="Pulse.setFilter('${d}')" class="flex-shrink-0 px-3 py-1.5 font-mono text-xs font-bold border-2 border-black/30 transition-all ${cls}">${this.escapeHtml(this.formatDateShort(d))}</button>`;
        }).join('');

        const sep = dateHTML ? '<span class="flex-shrink-0 w-px h-6 bg-black/20"></span>' : '';

        return `<div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">${presetHTML}${sep}${dateHTML}</div>`;
    },

    groupByDate(items) {
        const groups = {};
        for (const item of items) {
            const date = item.date || 'unknown';
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        }
        return Object.entries(groups)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayItems]) => [
                date,
                dayItems.sort((a, b) => (b.id || '').localeCompare(a.id || '')),
            ]);
    },

    renderTimeline(grouped) {
        const itemsLabel = this._t('pulse.items');
        return grouped.map(([date, items]) => `
            <div class="mb-10">
                <div class="flex items-center gap-4 mb-6">
                    <div class="bg-black text-brand-yellow px-4 py-2 font-mono font-bold text-sm shadow-brutal">
                        ${this.formatDate(date)}
                    </div>
                    <div class="flex-1 h-[3px] bg-black"></div>
                    <span class="font-mono text-sm font-bold text-black/50">${items.length} ${itemsLabel}</span>
                </div>
                <div class="space-y-4 pl-2">
                    ${items.map(item => this.renderCard(item)).join('')}
                </div>
            </div>
        `).join('');
    },

    renderCard(item) {
        const authorHandle = (item.author || '').replace(/^@+/, '');
        const avatarUrl = authorHandle
            ? `https://unavatar.io/x/${authorHandle}`
            : `https://ui-avatars.com/api/?name=X&background=FCD228&color=000&bold=true&size=48`;

        const title = this._l(item, 'title');
        const summary = this._l(item, 'summary');
        const engagementHTML = this.renderEngagement(item.engagement);
        const scoreBar = this.renderScoreBar(item.score);
        const typeTag = this.renderTypeTag(item.comment_type);
        const jsTakeHTML = this.renderJsTake(item.js_take, item);
        const idChip = this.renderIdChip(item.id);

        return `
            <div class="brutal-card brutal-card-static flex flex-col sm:flex-row gap-4 p-5 text-black">
                <div class="flex-shrink-0">
                    <img src="${avatarUrl}" alt="${this.escapeHtml(item.author)}"
                         class="w-12 h-12 rounded-full border-3 border-black"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(authorHandle || 'X')}&background=FCD228&color=000&bold=true&size=48'">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="font-mono font-bold text-sm">${this.escapeHtml(item.author)}</span>
                        ${typeTag}
                        ${idChip}
                    </div>
                    <a href="${this.escapeAttr(item.tweet_url)}" target="_blank" rel="noopener noreferrer"
                       class="block no-underline text-black group">
                        <h3 class="font-bold text-base mb-2 group-hover:bg-black group-hover:text-brand-yellow group-hover:px-1 transition-all leading-snug inline">
                            ${this.escapeHtml(title)}
                        </h3>
                        <svg class="w-4 h-4 text-black/30 group-hover:text-black transition-colors inline-block ml-1 align-middle" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                            <path stroke-linecap="square" d="M9 5l7 7-7 7"/>
                        </svg>
                    </a>
                    <p class="text-sm text-black/70 mb-3 mt-2 leading-relaxed">
                        ${this.escapeHtml(summary)}
                    </p>
                    ${jsTakeHTML}
                    <div class="flex items-center gap-4 flex-wrap">
                        ${engagementHTML}
                        ${scoreBar}
                    </div>
                </div>
            </div>
        `;
    },

    renderJsTake(jsTake, item) {
        if (!jsTake) return '';
        const label = this._t('pulse.jsTake');
        const text = (item && typeof jsTake === 'object')
            ? this._l(item, 'js_take')
            : (typeof jsTake === 'string' ? jsTake : '');
        if (!text) return '';
        return `
            <div class="mb-3 pl-3 border-l-4 border-brand-yellow bg-brand-yellow/5 py-2 pr-2 relative group/take">
                <div class="flex items-center justify-between gap-2">
                    <span class="font-mono text-[10px] font-bold text-black/40 uppercase">${this.escapeHtml(label)}</span>
                    <button onclick="Pulse.copyTake(this)" type="button"
                            data-text="${this.escapeAttr(text)}"
                            class="pulse-copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center rounded border border-black/10 text-black/30 hover:text-black hover:border-black/40 active:scale-95 transition-all"
                            title="Copy">
                        <svg class="pulse-copy-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <svg class="pulse-check-icon w-4 h-4 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </button>
                </div>
                <p class="text-sm text-black/60 italic leading-relaxed mt-0.5 select-text">${this.escapeHtml(text)}</p>
            </div>
        `;
    },

    copyTake(btn) {
        const text = btn.getAttribute('data-text') || '';
        navigator.clipboard.writeText(text).then(() => {
            const copyIcon = btn.querySelector('.pulse-copy-icon');
            const checkIcon = btn.querySelector('.pulse-check-icon');
            if (copyIcon) copyIcon.classList.add('hidden');
            if (checkIcon) checkIcon.classList.remove('hidden');
            btn.classList.add('text-green-600', 'border-green-600/40');
            btn.classList.remove('text-black/30', 'border-black/10');
            setTimeout(() => {
                if (copyIcon) copyIcon.classList.remove('hidden');
                if (checkIcon) checkIcon.classList.add('hidden');
                btn.classList.remove('text-green-600', 'border-green-600/40');
                btn.classList.add('text-black/30', 'border-black/10');
            }, 1500);
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    },

    renderEngagement(engagement) {
        if (!engagement || Object.keys(engagement).length === 0) return '';
        const metrics = [];
        if (engagement.likes != null) {
            metrics.push(`<span class="flex items-center gap-1" title="Likes"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>${this.formatNumber(engagement.likes)}</span>`);
        }
        if (engagement.replies != null) {
            metrics.push(`<span class="flex items-center gap-1" title="Replies"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>${this.formatNumber(engagement.replies)}</span>`);
        }
        if (engagement.retweets != null) {
            metrics.push(`<span class="flex items-center gap-1" title="Retweets"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>${this.formatNumber(engagement.retweets)}</span>`);
        }
        if (engagement.views != null) {
            metrics.push(`<span class="flex items-center gap-1" title="${this._t('pulse.views')}"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>${this.formatNumber(engagement.views)}</span>`);
        }
        if (engagement.bookmarks != null) {
            metrics.push(`<span class="flex items-center gap-1" title="${this._t('pulse.bookmarks')}"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>${this.formatNumber(engagement.bookmarks)}</span>`);
        }
        if (metrics.length === 0) return '';
        return `<div class="flex items-center gap-3 font-mono text-xs text-black/50">${metrics.join('')}</div>`;
    },

    renderScoreBar(score) {
        if (!score) return '';
        const pct = Math.round(score * 100);
        const color = score >= 0.9 ? 'bg-brand-yellow' : score >= 0.8 ? 'bg-green-400' : 'bg-gray-300';
        return `
            <div class="flex items-center gap-1.5 font-mono text-xs text-black/50" title="Relevance score: ${pct}%">
                <div class="w-12 h-1.5 bg-black/10 border border-black/20">
                    <div class="${color} h-full" style="width: ${pct}%"></div>
                </div>
                <span>${pct}</span>
            </div>
        `;
    },

    renderTypeTag(type) {
        if (!type) return '';
        const labels = {
            'ask_question': 'Q&A',
            'share_experience': 'EXP',
            'add_insight': 'INSIGHT',
            'recommend_resource': 'RES',
            'agree_and_extend': 'EXTEND',
        };
        const label = labels[type] || type.toUpperCase();
        return `<span class="brutal-tag text-[10px] px-1.5 py-0.5">${label}</span>`;
    },

    renderIdChip(id) {
        if (!id) return '';
        const short = id.length > 8 ? '...' + id.slice(-6) : id;
        return `<button onclick="Pulse.copyId(this)" data-id="${this.escapeAttr(id)}" title="ID: ${this.escapeAttr(id)}" class="pulse-id-chip ml-auto flex items-center gap-1 px-1.5 py-0.5 font-mono text-[10px] text-black/30 border border-black/10 rounded hover:text-black hover:border-black/40 hover:bg-brand-yellow/10 active:scale-95 transition-all cursor-pointer select-none"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="pulse-id-label">${this.escapeHtml(short)}</span></button>`;
    },

    copyId(btn) {
        const id = btn.getAttribute('data-id') || '';
        const label = btn.querySelector('.pulse-id-label');
        const orig = label ? label.textContent : '';
        navigator.clipboard.writeText(id).then(() => {
            if (label) label.textContent = this._t('pulse.copied');
            btn.classList.add('text-green-600', 'border-green-600/40');
            btn.classList.remove('text-black/30', 'border-black/10');
            setTimeout(() => {
                if (label) label.textContent = orig;
                btn.classList.remove('text-green-600', 'border-green-600/40');
                btn.classList.add('text-black/30', 'border-black/10');
            }, 1500);
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = id;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    },

    formatDate(dateStr) {
        if (typeof I18nManager !== 'undefined') {
            try {
                return I18nManager.formatDate(dateStr + 'T00:00:00');
            } catch { return dateStr; }
        }
        try {
            return new Date(dateStr + 'T00:00:00').toLocaleDateString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch { return dateStr; }
    },

    formatDateShort(dateStr) {
        try {
            const locale = (typeof I18nManager !== 'undefined' && I18nManager.currentLocale)
                ? I18nManager.currentLocale : 'zh-CN';
            return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
                month: 'short', day: 'numeric'
            });
        } catch { return dateStr; }
    },

    formatNumber(n) {
        if (n == null) return '0';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n);
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    escapeAttr(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
};

// Auto-load on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    Pulse.load();
});

window.Pulse = Pulse;
