/**
 * JS ClawHub - Global Search Filter
 * Client-side search that filters cards by name/description/tags
 */

const Search = {
    /**
     * Initialize search on input element
     * @param {string} inputId - Search input element ID
     * @param {string} containerSelector - CSS selector for the cards container
     * @param {string} cardSelector - CSS selector for individual cards
     */
    init(inputId, containerSelector, cardSelector) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll(cardSelector);

            cards.forEach(card => {
                if (!query) {
                    card.style.display = '';
                    return;
                }

                const text = card.textContent.toLowerCase();
                const tags = card.dataset.tags ? card.dataset.tags.toLowerCase() : '';
                const match = text.includes(query) || tags.includes(query);
                card.style.display = match ? '' : 'none';
            });

            // Update empty state
            this.updateEmptyState(containerSelector, cardSelector);
        });
    },

    /**
     * Show/hide empty state message when no results
     */
    updateEmptyState(containerSelector, cardSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const visibleCards = container.querySelectorAll(`${cardSelector}:not([style*="display: none"])`);
        let emptyMsg = container.querySelector('.search-empty-state');

        if (visibleCards.length === 0) {
            if (!emptyMsg) {
                emptyMsg = document.createElement('div');
                emptyMsg.className = 'search-empty-state col-span-full text-center py-12 font-mono font-bold text-xl';
                emptyMsg.textContent = '// NO RESULTS FOUND';
                container.appendChild(emptyMsg);
            }
            emptyMsg.style.display = '';
        } else if (emptyMsg) {
            emptyMsg.style.display = 'none';
        }
    }
};
