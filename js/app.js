/**
 * Main Application Logic
 */

const App = {
    currentRoute: 'dashboard',
    
    init() {
        this.setupNavigation();
        this.setupFileDrop();
        
        // Listen for data updates
        window.addEventListener('articlesUpdated', () => {
            this.updateStatus();
            this.renderCurrentRoute();
            this.updateTickerStrip();
        });
        
        // Fetch from Supabase
        this.fetchFromSupabase();
        
        // Initial render
        this.renderCurrentRoute();
    },
    
    async fetchFromSupabase() {
        document.getElementById('data-status-text').textContent = "Fetching from Supabase...";
        try {
            // Direct fetch from the public Supabase bucket to avoid CORS/client issues
            const publicUrl = "https://mfxnghmuccevsxwcetej.supabase.co/storage/v1/object/public/news-data/feed.xml";
            
            const response = await fetch(publicUrl);
            if (response.ok) {
                const xmlString = await response.text();
                const newArticles = window.AllianceNewsParser.parse(xmlString);
                
                if (newArticles.length > 0) {
                    window.AppStore.addArticles(newArticles);
                    document.getElementById('data-status-text').textContent = `${newArticles.length} Articles Loaded`;
                } else {
                    document.getElementById('data-status-text').textContent = "No valid articles found in feed";
                }
            } else {
                document.getElementById('data-status-text').textContent = `Feed error: ${response.status}`;
            }
        } catch (error) {
            console.error("Fetch error:", error);
            document.getElementById('data-status-text').textContent = "Connection Error (Check console)";
        }
    },
    
    setupNavigation() {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                // Change route
                this.currentRoute = e.currentTarget.dataset.route;
                this.renderCurrentRoute();
            });
        });
    },
    
    setupFileDrop() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                this.handleFiles(e.dataTransfer.files);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFiles(e.target.files);
            }
        });
    },
    
    handleFiles(files) {
        document.getElementById('data-status-text').textContent = "Parsing files...";
        
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const xmlString = e.target.result;
                const newArticles = window.AllianceNewsParser.parse(xmlString);
                if (newArticles.length > 0) {
                    window.AppStore.addArticles(newArticles);
                }
            };
            reader.readAsText(file);
        });
    },
    
    updateStatus() {
        const statusInd = document.querySelector('.status-indicator');
        const statusText = document.getElementById('data-status-text');
        
        if (window.AppStore.articles.length > 0) {
            statusInd.classList.add('connected');
            statusText.textContent = `${window.AppStore.articles.length} Articles Loaded`;
        } else {
            statusInd.classList.remove('connected');
            statusText.textContent = "Awaiting Data";
        }
    },
    
    updateTickerStrip() {
        // In a real app, this would be live data. 
        // For now, we just simulate some random fluctuations for the aesthetic.
        const tickers = document.querySelectorAll('.ticker-item');
        tickers.forEach(t => {
            const valSpan = t.querySelector('.ticker-val');
            if (valSpan.textContent === '--') {
                // Initialize with some fake base values if empty
                const label = t.querySelector('.ticker-label').textContent;
                let base = 100;
                if (label.includes('JSE')) base = 75000;
                if (label.includes('ZAR')) base = 18.50;
                if (label.includes('GOLD')) base = 2300;
                
                valSpan.textContent = base.toLocaleString();
            } else {
                // Randomly fluctuate
                const current = parseFloat(valSpan.textContent.replace(/,/g, ''));
                const change = current * (Math.random() * 0.002 - 0.001);
                const newVal = current + change;
                
                valSpan.textContent = newVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                valSpan.style.color = change >= 0 ? 'var(--sentiment-positive)' : 'var(--sentiment-negative)';
                setTimeout(() => valSpan.style.color = '', 1000);
            }
        });
    },
    
    // --- Page Renderers ---
    
    renderCurrentRoute() {
        const container = document.getElementById('page-container');
        const articles = window.AppStore.getArticlesByRoute(this.currentRoute);
        
        // Setup base HTML for the route
        switch (this.currentRoute) {
            case 'dashboard':
                this.renderDashboardLayout(container, articles);
                break;
            case 'sa-news':
                this.renderStandardLayout(container, 'South Africa News', 'Local markets and corporate news', articles);
                break;
            case 'watchlist':
                this.renderStandardLayout(container, 'Priority Watchlist', 'News strictly concerning your tracked companies', articles);
                break;
            case 'markets':
                this.renderStandardLayout(container, 'Markets', 'Equities, Bonds, Forex, and Commodities', articles);
                break;
            case 'global':
                this.renderStandardLayout(container, 'Global News', 'International headlines and macroeconomics', articles);
                break;
            case 'calendar':
                this.renderStandardLayout(container, 'Event Calendar', 'Upcoming corporate and economic events', articles);
                break;
            case 'companies':
                this.renderStandardLayout(container, 'Company Tracker', 'News filtered by specific tickers', articles);
                break;
            case 'tier-1':
                this.renderStandardLayout(container, 'Tier 1: Must Have', 'Market-moving stories and significant corporate news', articles);
                break;
            case 'tier-2':
                this.renderStandardLayout(container, 'Tier 2: Market Intel', 'Context and deep-dives for why markets are moving', articles);
                break;
            case 'tier-3':
                this.renderStandardLayout(container, 'Tier 3: Macro', 'Central banks, economic indicators, and policy', articles);
                break;
        }
    },
    
    renderDashboardLayout(container, articles) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Morning Dashboard</h1>
                <p class="page-subtitle">Your daily overview of the South African markets</p>
            </div>
            
            <div class="dashboard-grid">
                <div class="main-column">
                    <div id="hero-container"></div>
                    <h3 class="mb-4">Latest Headlines</h3>
                    <div id="list-container"></div>
                </div>
                <div class="side-column">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h3 class="card-title">Market Snapshot</h3>
                        </div>
                        <div class="market-snapshot">
                            <div class="market-item">
                                <span class="market-name">JSE Top 40</span>
                                <div class="market-data">
                                    <span class="market-price">75,234.50</span>
                                    <span class="market-change down">-0.4%</span>
                                </div>
                            </div>
                            <div class="market-item">
                                <span class="market-name">USD / ZAR</span>
                                <div class="market-data">
                                    <span class="market-price">18.42</span>
                                    <span class="market-change up">+0.1%</span>
                                </div>
                            </div>
                            <div class="market-item">
                                <span class="market-name">Gold (oz)</span>
                                <div class="market-data">
                                    <span class="market-price">$2,341.20</span>
                                    <span class="market-change up">+1.2%</span>
                                </div>
                            </div>
                            <div class="market-item">
                                <span class="market-name">SA 10Y Bond</span>
                                <div class="market-data">
                                    <span class="market-price">10.45%</span>
                                    <span class="market-change down">-2bps</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Find a briefing or top news for hero
        const heroArticle = articles.find(a => 
            a.metadata.contentTypes.includes('ALLBRF') || 
            a.metadata.significance.includes('ALLTOP')
        ) || window.AppStore.getLatestArticle();
        
        if (heroArticle) {
            window.UI.renderHeroArticle(heroArticle, 'hero-container');
            // Remove hero from list
            const listArticles = articles.filter(a => a.id !== heroArticle.id);
            window.UI.renderNewsList(listArticles, 'list-container');
        } else {
            window.UI.renderNewsList(articles, 'list-container');
        }
    },
    
    renderStandardLayout(container, title, subtitle, articles) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">${title}</h1>
                <p class="page-subtitle">${subtitle}</p>
            </div>
            <div class="two-col-layout">
                <div id="list-container"></div>
                <div class="filters-sidebar">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Filters</h3>
                        </div>
                        <p class="text-muted" style="font-size: 0.85rem;">(Filtering UI placeholder)</p>
                    </div>
                </div>
            </div>
        `;
        window.UI.renderNewsList(articles, 'list-container');
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    
    // Start ticker animation
    setInterval(() => App.updateTickerStrip(), 3000);
});
