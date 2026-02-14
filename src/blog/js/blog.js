/**
 * JS ClawHub Blog - Client-side rendering logic
 * Adapted from deepseek-cowork blog system, restyled for Neo-Brutalism
 * With i18n support via I18nManager
 */

const Blog = {
    config: {
        postsDir: './posts/',
        indexFile: './posts/index.json',
    },

    _l(obj, field) {
        if (typeof I18nManager !== 'undefined') return I18nManager.getLocalizedField(obj, field);
        const val = obj[field];
        return typeof val === 'string' ? val : (val && val['zh-CN']) || '';
    },

    /**
     * Load and render post list
     */
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

            // Sort by date (newest first)
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));

            // Render post cards
            container.innerHTML = posts.map(post => this.renderPostCard(post)).join('');

        } catch (error) {
            console.error('Error loading posts:', error);
            if (loadingState) loadingState.remove();
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    /**
     * Render single post card - Neo-Brutalism style
     */
    renderPostCard(post) {
        const title = this._l(post, 'title');
        const summary = this._l(post, 'summary');

        const tagsHTML = post.tags && post.tags.length > 0
            ? post.tags.map(tag => `<span class="brutal-tag">${this.escapeHtml(tag)}</span>`).join('')
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

    /**
     * Load and render single post
     */
    async loadPost(slug) {
        const headerEl = document.getElementById('post-header');
        const contentEl = document.getElementById('post-content');
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');

        try {
            // 1. Fetch post metadata
            const indexResponse = await fetch(this.config.indexFile);
            if (!indexResponse.ok) throw new Error('Failed to fetch posts index');

            const posts = await indexResponse.json();
            const postMeta = posts.find(p => p.slug === slug);

            if (!postMeta) throw new Error('Post not found');

            // 2. Fetch Markdown content (try locale-specific first)
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

            // 3. Remove YAML frontmatter
            markdown = this.removeFrontmatter(markdown);

            // 4. Render post header
            this.renderPostHeader(headerEl, postMeta);

            // 5. Update page meta
            this.updatePageMeta(postMeta);

            // 6. Render Markdown
            const html = this.renderMarkdown(markdown);
            contentEl.innerHTML = html;

            // 7. Apply code highlighting
            this.highlightCode();

            // 8. Hide loading
            if (loadingState) loadingState.remove();

        } catch (error) {
            console.error('Error loading post:', error);
            if (loadingState) loadingState.remove();
            if (headerEl) headerEl.innerHTML = '';
            if (contentEl) contentEl.innerHTML = '';
            if (errorState) errorState.classList.remove('hidden');
        }
    },

    /**
     * Render post header - Neo-Brutalism style
     */
    renderPostHeader(container, post) {
        const title = this._l(post, 'title');

        const tagsHTML = post.tags && post.tags.length > 0
            ? post.tags.map(tag => `<span class="brutal-tag">${this.escapeHtml(tag)}</span>`).join('')
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

    /**
     * Update page meta information
     */
    updatePageMeta(post) {
        const title = this._l(post, 'title');
        const summary = this._l(post, 'summary');

        document.title = `${title} - JS ClawHub Blog`;

        const metaDesc = document.getElementById('meta-description');
        if (metaDesc && summary) metaDesc.setAttribute('content', summary);

        const ogTitle = document.getElementById('og-title');
        if (ogTitle) ogTitle.setAttribute('content', title);

        const ogDesc = document.getElementById('og-description');
        if (ogDesc && summary) ogDesc.setAttribute('content', summary);
    },

    /**
     * Remove YAML frontmatter and first H1
     */
    removeFrontmatter(markdown) {
        let content = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
        content = content.replace(/^\s*#\s+[^\n]+\n+/, '');
        return content;
    },

    /**
     * Render Markdown to HTML
     */
    renderMarkdown(markdown) {
        if (typeof marked !== 'undefined') {
            marked.setOptions({ breaks: true, gfm: true });
            return marked.parse(markdown);
        }
        return `<pre>${this.escapeHtml(markdown)}</pre>`;
    },

    /**
     * Apply code highlighting
     */
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
