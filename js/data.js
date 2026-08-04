/**
 * State and Data Management
 */

window.AppStore = {
    articles: [],
    
    // Add new articles to the store, sorting them by date
    addArticles(newArticles) {
        // Filter out duplicates based on ID
        const existingIds = new Set(this.articles.map(a => a.id));
        const uniqueNew = newArticles.filter(a => !existingIds.has(a.id));
        
        this.articles = [...this.articles, ...uniqueNew];
        
        // Sort descending by date
        this.articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Trigger event
        window.dispatchEvent(new CustomEvent('articlesUpdated'));
    },
    
    getLatestArticle() {
        return this.articles.length > 0 ? this.articles[0] : null;
    },
    
    getArticlesByCode(codeType, codeValue) {
        return this.articles.filter(a => {
            return a.metadata[codeType] && a.metadata[codeType].includes(codeValue);
        });
    },
    
    getArticlesByRoute(route) {
        switch(route) {
            case 'dashboard':
                return this.articles.slice(0, 10); // Just top 10 for dashboard
            case 'sa-news':
                // ALLSAF (South Africa) or ASAPRO (Product)
                return this.articles.filter(a => 
                    a.metadata.geography.includes('ALLSAF') || 
                    a.metadata.products.includes('ASAPRO')
                );
            case 'markets':
                // ALLMRP (Stocks), ALLBON, ALLFRX, ALLCOM
                return this.articles.filter(a => 
                    a.metadata.markets.some(m => ['ALLMRP', 'ALLBON', 'ALLFRX', 'ALLCOM'].includes(m))
                );
            case 'global':
                // Not SA
                return this.articles.filter(a => 
                    !a.metadata.geography.includes('ALLSAF') &&
                    a.metadata.geography.length > 0
                );
            case 'calendar':
                // ALLCAL
                return this.articles.filter(a => a.metadata.contentTypes.includes('ALLCAL'));
            case 'companies':
                // Has tickers
                return this.articles.filter(a => a.metadata.tickers.length > 0);
            case 'tier-1':
                return this.articles.filter(a => this.matchesAnyCode(a, window.Taxonomy.Tiers.tier1.map(t=>t.code)));
            case 'tier-2':
                return this.articles.filter(a => this.matchesAnyCode(a, window.Taxonomy.Tiers.tier2.map(t=>t.code)));
            case 'tier-3':
                return this.articles.filter(a => this.matchesAnyCode(a, window.Taxonomy.Tiers.tier3.map(t=>t.code)));
            case 'watchlist':
                return this.articles.filter(a => {
                    return a.metadata.tickers.some(t => {
                        const baseTicker = t.replace('=ABOUT', '');
                        return window.Taxonomy.Watchlist.includes(baseTicker);
                    });
                });
            default:
                return this.articles;
        }
    },
    
    matchesAnyCode(article, codes) {
        const allItemCodes = [
            ...article.metadata.products,
            ...article.metadata.contentTypes,
            ...article.metadata.tickers,
            ...article.metadata.markets,
            ...article.metadata.geography,
            ...article.metadata.fixtures,
            ...article.metadata.significance
        ];
        // The API puts industry codes under 'industries', but we might just have them in raw meta right now.
        // For robustness, check if any of the article's codes match the requested codes.
        return codes.some(code => allItemCodes.includes(code));
    }
};

// Taxonomy Mapping based on Alliance News Code Structure
window.Taxonomy = {
    Watchlist: [
        'ASA.ABG', // Absa
        'ASA.SUI', // Sun International Limited
        'ASA.DIB', // Dipula Income Fund Limited B
        'ASA.MTM', // Momentum Metropolitan Holdings
        'ASA.EXX', // Exxaro Resources Limited
        'ASA.MTN', // MTN Group Limited
        'ASA.DCP', // Dis-Chem Pharmacies Limited
        'ASA.BOX', // Boxer Retail Limited
        'ASA.CMH', // Combined Motor Holdings Limited
        'ASA.OUT', // OUTsurance Holdings Limited
        'ASA.REM'  // Remgro Limited
    ],
    Tiers: {
        tier1: [
            { code: 'ALLTOP', name: 'Top News', why: 'Biggest stories of the day' },
            { code: 'ALLSIG', name: 'Significant', why: 'Material company news' },
            { code: 'ALLERN', name: 'Earnings', why: 'Results' },
            { code: 'ALLPRE', name: 'Earnings Preview', why: 'Expectations before results' },
            { code: 'ALLOUT', name: 'Company Outlook', why: 'Guidance changes' },
            { code: 'ALLMNA', name: 'M&A', why: 'Acquisitions and disposals' },
            { code: 'ALLDIV', name: 'Dividends & Buybacks', why: 'Capital allocation' },
            { code: 'ALLFIN', name: 'Financing', why: 'Debt and equity raises' },
            { code: 'ALLEXX', name: 'Executive Changes', why: 'CEO/CFO appointments' },
            { code: 'ALLCON', name: 'Contracts', why: 'New business wins' },
            { code: 'ALLSUE', name: 'Litigation', why: 'Legal risk' },
            { code: 'ALLRAT', name: 'Broker Ratings', why: 'Upgrades/downgrades' },
            { code: 'ALLMOV', name: 'Winners & Losers', why: 'Large price moves' }
        ],
        tier2: [
            { code: 'ALLMRP', name: 'Stock market commentary' },
            { code: 'ALLKNO', name: 'In The Know' },
            { code: 'ALLBRF', name: 'Briefings' },
            { code: 'ALLSUM', name: 'News summaries' },
            { code: 'ALLDEP', name: 'In-depth analysis' },
            { code: 'ALLXTR', name: 'Extra reporting' }
        ],
        tier3: [
            { code: 'ALLCBK', name: 'Central banks' },
            { code: 'ALLDTA', name: 'Economic indicators' },
            { code: 'ALLGOV', name: 'Government policy' },
            { code: 'ALLSOV', name: 'Sovereign debt' }
        ],
        tier4: [
            { code: 'ALLUSA', name: 'US' },
            { code: 'ALLEUR', name: 'Europe' },
            { code: 'ALLUK', name: 'UK' },
            { code: 'ALLCHI', name: 'China' },
            { code: 'ALLIND', name: 'India' },
            { code: 'ALLJPA', name: 'Japan' },
            { code: 'ALLSAF', name: 'South Africa' }
        ],
        tier5: [
            { code: 'ALL8350', name: 'Banks' },
            { code: 'ALL8570', name: 'Life Insurance' },
            { code: 'ALL8770', name: 'Financial Services' },
            { code: 'ALL1750', name: 'Industrial Metals & Mining' },
            { code: 'ALL1770', name: 'Precious Metals & Mining' },
            { code: 'ALL9530', name: 'Software' },
            { code: 'ALL9570', name: 'Technology Hardware' },
            { code: 'ALL4570', name: 'Pharmaceuticals' },
            { code: 'ALL5530', name: 'Beverages' },
            { code: 'ALL3750', name: 'Travel & Leisure' }
        ],
        tier6: [
            { code: 'DOW30', name: 'Dow Jones' },
            { code: 'NDQ100', name: 'Nasdaq 100' },
            { code: 'STX150', name: 'Stoxx Global 150' },
            { code: 'EURSTX', name: 'EuroStoxx' },
            { code: 'ALL100', name: 'FTSE 100' },
            { code: 'ASA40', name: 'JSE Top 40' },
            { code: 'ASAASI', name: 'JSE All Share' }
        ]
    },
    significance: {
        'ALLTOP': 'Top News',
        'ALLSIG': 'Significant',
        'ALLPOS': 'Positive',
        'ALLNEG': 'Negative'
    },
    contentType: {
        'ALLBRF': 'Briefing',
        'ALLFLS': 'Flash',
        'ALLDEP': 'In Depth',
        'ALLEXL': 'Exclusive',
        'ALLCAL': 'Calendar',
        'ALLXTR': 'Extra',
        'ALLMED': 'Media Pickup',
        'ALLSUM': 'Summary'
    },
    markets: {
        'ALLMRP': 'Equities',
        'ALLBON': 'Bonds',
        'ALLFRX': 'Forex',
        'ALLCOM': 'Commodities'
    },
    geography: {
        'ALLSAF': 'South Africa',
        'ALLUSA': 'US',
        'ALLEUR': 'Europe',
        'ALLAFR': 'Sub-Saharan Africa',
        'ALLAME': 'Americas',
        'ALLAPA': 'Asia Pacific',
        'ALLUK':  'UK'
    },
    
    getLabel(type, code) {
        if (this[type] && this[type][code]) {
            return this[type][code];
        }
        // If it's a ticker (e.g., ASA.AGL=ABOUT)
        if (type === 'ticker') {
            return code.replace('=ABOUT', '');
        }
        return code;
    },
    
    getSentimentClass(article) {
        if (article.metadata.significance.includes('ALLPOS')) return 'text-positive';
        if (article.metadata.significance.includes('ALLNEG')) return 'text-negative';
        return '';
    }
};
