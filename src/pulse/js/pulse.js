/**
 * JS ClawHub Pulse - Client-side rendering logic
 * Renders OpenClaw ecosystem X highlights as a timeline
 * With i18n support via I18nManager
 */

const Pulse = {
    config: {
        dataFile: './data/items.json',
    },

    _t(key) {
        return typeof I18nManager !== 'undefined' ? I18nManager.t(key) : key;
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
            const response = await fetch(this.config.dataFile);
            if (!response.ok) throw new Error('Failed to fetch pulse data');

            const items = await response.json();

            if (loadingState) loadingState.remove();

            if (!items || items.length === 0) {
                if (emptyState) emptyState.classList.remove('hidden');
                return;
            }

            // Group by date
            const grouped = this.groupByDate(items);

            // Render timeline
            container.innerHTML = this.renderTimeline(grouped);

        } catch (error) {
            console.error('Error loading pulse:', error);
            if (loadingState) loadingState.remove();
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    groupByDate(items) {
        const groups = {};
        for (const item of items) {
            const date = item.date || 'unknown';
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        }
        return Object.entries(groups)
            .sort(([a], [b]) => b.localeCompare(a));
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

        const engagementHTML = this.renderEngagement(item.engagement);
        const scoreBar = this.renderScoreBar(item.score);
        const typeTag = this.renderTypeTag(item.comment_type);

        return `
            <a href="${this.escapeAttr(item.tweet_url)}" target="_blank" rel="noopener noreferrer"
               class="brutal-card flex flex-col sm:flex-row gap-4 p-5 no-underline text-black group">
                <div class="flex-shrink-0">
                    <img src="${avatarUrl}" alt="${this.escapeHtml(item.author)}"
                         class="w-12 h-12 rounded-full border-3 border-black"
                         onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(authorHandle || 'X')}&background=FCD228&color=000&bold=true&size=48'">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                        <span class="font-mono font-bold text-sm">${this.escapeHtml(item.author)}</span>
                        ${typeTag}
                    </div>
                    <h3 class="font-bold text-base mb-2 group-hover:bg-black group-hover:text-brand-yellow group-hover:px-1 transition-all leading-snug">
                        ${this.escapeHtml(item.title)}
                    </h3>
                    <p class="text-sm text-black/70 mb-3 leading-relaxed">
                        ${this.escapeHtml(item.summary)}
                    </p>
                    <div class="flex items-center gap-4 flex-wrap">
                        ${engagementHTML}
                        ${scoreBar}
                    </div>
                </div>
                <div class="flex-shrink-0 self-center hidden sm:block">
                    <svg class="w-5 h-5 text-black/30 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                        <path stroke-linecap="square" d="M9 5l7 7-7 7"/>
                    </svg>
                </div>
            </a>
        `;
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
