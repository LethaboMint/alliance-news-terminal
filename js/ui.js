/**
 * UI Rendering Functions
 */

window.UI = {
    formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    },

    renderBadges(article) {
        let badgesHtml = '';
        
        // Tickers
        article.metadata.tickers.forEach(ticker => {
            const label = window.Taxonomy.getLabel('ticker', ticker);
            const isAbout = ticker.includes('=ABOUT');
            badgesHtml += `<span class="badge ${isAbout ? 'badge-gold' : 'badge-outline'}">${label}</span> `;
        });

        // Content Type
        article.metadata.contentTypes.forEach(type => {
            const label = window.Taxonomy.getLabel('contentType', type);
            if (label !== type) {
                badgesHtml += `<span class="badge badge-blue">${label}</span> `;
            }
        });

        // Significance
        article.metadata.significance.forEach(sig => {
            const label = window.Taxonomy.getLabel('significance', sig);
            if (label !== sig) {
                const colorClass = sig === 'ALLPOS' ? 'text-positive' : (sig === 'ALLNEG' ? 'text-negative' : '');
                badgesHtml += `<span class="badge badge-outline ${colorClass}">${label}</span> `;
            }
        });

        return badgesHtml;
    },

    renderNewsList(articles, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (articles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                    <p>No articles found for this section.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="news-list">';
        
        articles.forEach(article => {
            const sentimentClass = window.Taxonomy.getSentimentClass(article);
            html += `
                <div class="news-item" onclick="window.UI.openArticleModal('${article.id}')">
                    <div class="news-meta">
                        <span class="news-time">${this.formatTime(article.date)}</span>
                        <span>•</span>
                        <span>${this.formatDate(article.date)}</span>
                    </div>
                    <div class="news-headline ${sentimentClass}">
                        ${article.headline}
                    </div>
                    <div class="news-badges">
                        ${this.renderBadges(article)}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    renderHeroArticle(article, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !article) return;

        // Try to get a snippet from the content
        let snippet = "";
        if (article.rawContent && article.rawContent.length > 0) {
            snippet = article.rawContent[0];
            if (snippet.length > 150) snippet = snippet.substring(0, 150) + "...";
        }

        container.innerHTML = `
            <div class="hero-article" onclick="window.UI.openArticleModal('${article.id}')" style="cursor: pointer;">
                <div class="news-meta mb-2">
                    <span class="badge badge-gold">LATEST BRIEFING</span>
                    <span class="news-time ms-3">${this.formatTime(article.date)}</span>
                </div>
                <h2 class="hero-headline">${article.headline}</h2>
                <p class="hero-snippet">${snippet}</p>
                <div>${this.renderBadges(article)}</div>
            </div>
        `;
    },

    createModalShell() {
        if (document.getElementById('article-modal')) return;
        
        const modalHtml = `
            <div class="modal-overlay" id="article-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <div class="news-meta" id="modal-meta"></div>
                            <h2 class="modal-title" id="modal-title"></h2>
                            <div id="modal-badges"></div>
                        </div>
                        <button class="close-btn" onclick="window.UI.closeModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="modal-body" id="modal-body"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Close on overlay click
        document.getElementById('article-modal').addEventListener('click', (e) => {
            if (e.target.id === 'article-modal') this.closeModal();
        });
    },

    openArticleModal(id) {
        const article = window.AppStore.articles.find(a => a.id === id);
        if (!article) return;

        this.createModalShell();
        
        document.getElementById('modal-meta').innerHTML = `
            <span class="news-time">${this.formatTime(article.date)}</span>
            <span>•</span>
            <span>${this.formatDate(article.date)}</span>
        `;
        document.getElementById('modal-title').textContent = article.headline;
        document.getElementById('modal-title').className = `modal-title ${window.Taxonomy.getSentimentClass(article)}`;
        document.getElementById('modal-badges').innerHTML = this.renderBadges(article);
        
        // Render body
        let bodyHtml = '';
        if (article.sections && article.sections.length > 0) {
            article.sections.forEach(section => {
                if (section.title !== 'Main') {
                    bodyHtml += `<div class="article-divider">---------- ${section.title} ----------</div>`;
                }
                section.content.forEach(p => {
                    bodyHtml += `<p>${p}</p>`;
                });
            });
        } else {
            article.rawContent.forEach(p => {
                bodyHtml += `<p>${p}</p>`;
            });
        }
        
        document.getElementById('modal-body').innerHTML = bodyHtml;
        
        const modal = document.getElementById('article-modal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        const modal = document.getElementById('article-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
};
