const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = process.env.CRAWL_BASE || 'http://localhost:3025';
const sitemap = fs.readFileSync(path.join(root, 'build/sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
const pages = [...new Set(urls.map(url => new URL(url).pathname + new URL(url).search)
    .filter(url => url.startsWith('/doris-2.1-docs/')))];

const assets = new Set(['/doris-2.1-docs/search-index.json']);
const failures = [];
let pageIndex = 0;

async function pageWorker() {
    while (pageIndex < pages.length) {
        const page = pages[pageIndex++];
        try {
            const response = await fetch(base + page, {redirect: 'follow'});
            if (!response.ok) {
                failures.push(`${response.status} ${page}`);
                continue;
            }
            const html = await response.text();
            for (const match of html.matchAll(/(?:src|href)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g)) {
                const url = (match[1] || match[2] || match[3] || '').split('#')[0];
                if (!url.startsWith('/doris-2.1-docs/')) continue;
                if (!/\.(?:html?|js|css|png|jpe?g|svg|gif|webp|ico|json|txt|xml|woff2?|ttf|sh|zip|pdf)$/.test(url)
                    && !url.endsWith('/')) continue;
                assets.add(url);
            }
        } catch (error) {
            failures.push(`ERR ${page} ${error.message}`);
        }
    }
}

let assetIndex = 0;
let assetList = [];
async function assetWorker() {
    while (assetIndex < assetList.length) {
        const asset = assetList[assetIndex++];
        try {
            const response = await fetch(base + asset, {method: 'GET', redirect: 'follow'});
            if (!response.ok) failures.push(`${response.status} ${asset}`);
            await response.arrayBuffer();
        } catch (error) {
            failures.push(`ERR ${asset} ${error.message}`);
        }
    }
}

(async () => {
    await Promise.all(Array.from({length: 12}, pageWorker));
    assetList = [...assets];
    await Promise.all(Array.from({length: 12}, assetWorker));
    fs.writeFileSync(path.join(root, 'crawl-failures.txt'), failures.join('\n'));
    console.log(`pages: ${pages.length}, assets: ${assetList.length}, failures: ${failures.length}`);
    console.log(failures.slice(0, 40).join('\n'));
    process.exitCode = failures.length === 0 ? 0 : 1;
})();