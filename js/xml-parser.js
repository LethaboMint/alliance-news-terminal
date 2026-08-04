/**
 * Parser for Alliance News NITF XML format
 */
class AllianceNewsParser {
    
    /**
     * Parse raw XML string into structured article objects
     * @param {string} xmlString 
     * @returns {Array} List of article/section objects
     */
    static parse(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        
        // Check for parsing errors
        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            console.error("XML Parsing Error", parseError[0].textContent);
            return [];
        }

        const articles = [];
        
        // A single XML file might contain one <nitf> or multiple wrapped in a custom root
        const nitfNodes = xmlDoc.getElementsByTagName("nitf");
        
        for (let i = 0; i < nitfNodes.length; i++) {
            const article = this._parseNitfNode(nitfNodes[i]);
            if (article) {
                // If it's a briefing with sections (like SA Morning Briefing), 
                // we might want to split it into sub-articles, but let's keep it 
                // as one rich object first.
                articles.push(article);
            }
        }
        
        return articles;
    }

    static _parseNitfNode(nitfNode) {
        const head = nitfNode.getElementsByTagName("head")[0];
        const body = nitfNode.getElementsByTagName("body")[0];
        
        if (!head || !body) return null;

        const article = {
            id: "",
            headline: "",
            date: "",
            metadata: {
                products: [],
                contentTypes: [],
                tickers: [],
                markets: [],
                geography: [],
                fixtures: [],
                significance: []
            },
            rawContent: "",
            sections: [] // For parsed sub-sections like "MARKETS", "SA NEWS"
        };

        // Parse Metadata
        const metaTags = head.getElementsByTagName("meta");
        for (let j = 0; j < metaTags.length; j++) {
            const name = metaTags[j].getAttribute("name");
            const content = metaTags[j].getAttribute("content");
            
            if (!name || !content) continue;
            
            // Content can be space-separated e.g. "ASAPRO ALLALL"
            const tokens = content.split(" ").map(t => t.trim()).filter(t => t);
            
            switch (name) {
                case "product": article.metadata.products.push(...tokens); break;
                case "content-type": article.metadata.contentTypes.push(...tokens); break;
                case "ticker": article.metadata.tickers.push(...tokens); break;
                case "markets": article.metadata.markets.push(...tokens); break;
                case "geography": article.metadata.geography.push(...tokens); break;
                case "fixture": article.metadata.fixtures.push(...tokens); break;
                case "significance": article.metadata.significance.push(...tokens); break;
            }
        }

        // Parse ID
        const docId = head.getElementsByTagName("doc-id")[0];
        if (docId) {
            article.id = docId.getAttribute("id-string");
        }

        // Parse Headline
        const hl1 = body.getElementsByTagName("hl1")[0];
        if (hl1) {
            article.headline = hl1.textContent.trim();
        }

        // Parse Date
        const dateNode = body.getElementsByTagName("story.date")[0];
        if (dateNode) {
            article.date = dateNode.textContent.trim(); // ISO format usually
        }

        // Parse Content
        const bodyContent = body.getElementsByTagName("body.content")[0];
        if (bodyContent) {
            const block = bodyContent.getElementsByTagName("block")[0];
            if (block) {
                article.rawContent = this._extractParagraphs(block);
                article.sections = this._parseSections(article.rawContent);
            }
        }

        return article;
    }

    static _extractParagraphs(blockNode) {
        const pTags = blockNode.getElementsByTagName("p");
        const paragraphs = [];
        for (let i = 0; i < pTags.length; i++) {
            const text = pTags[i].textContent.trim();
            if (text) {
                paragraphs.push(text);
            } else if (pTags[i].innerHTML === "") {
                paragraphs.push(""); // Keep empty paragraphs as spacing
            }
        }
        return paragraphs;
    }

    /**
     * Parses the array of paragraphs into logical sections
     * by detecting the "----------" dividers.
     */
    static _parseSections(paragraphs) {
        const sections = [];
        let currentSection = { title: "Main", content: [] };
        
        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            
            // Check if this is a divider
            if (p.includes("----------")) {
                // The next non-empty paragraph is usually the section title
                let title = "Section";
                let j = i + 1;
                while (j < paragraphs.length && !paragraphs[j]) {
                    j++;
                }
                
                if (j < paragraphs.length && !paragraphs[j].includes("----------")) {
                    // Check if it looks like a title (short, all caps, or specific known titles)
                    if (paragraphs[j].length < 50) {
                        title = paragraphs[j];
                        // If it's a title, the next line should be another divider
                        let k = j + 1;
                        while (k < paragraphs.length && !paragraphs[k]) k++;
                        if (k < paragraphs.length && paragraphs[k].includes("----------")) {
                            // Valid section header block
                            if (currentSection.content.length > 0 || currentSection.title !== "Main") {
                                sections.push(currentSection);
                            }
                            currentSection = { title: title, content: [] };
                            i = k; // skip past the bottom divider
                            continue;
                        }
                    }
                }
            }
            
            if (p) {
                currentSection.content.push(p);
            }
        }
        
        if (currentSection.content.length > 0) {
            sections.push(currentSection);
        }
        
        return sections;
    }
}
