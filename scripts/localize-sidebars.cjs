const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const translations = JSON.parse(fs.readFileSync(path.join(__dirname, 'version-2.1-translations.json'), 'utf8'));
const sidebars = JSON.parse(fs.readFileSync(path.join(root, 'sidebars.json'), 'utf8'));

const manualLabels = {
    Integrations: '集成',
    BI: 'BI',
    'SQL Clients': 'SQL 客户端',
    More: '更多',
};

const unmapped = new Set();

function localize(node) {
    if (Array.isArray(node)) return node.map(localize);
    if (!node || typeof node !== 'object') return node;

    const result = {...node};
    if (typeof result.label === 'string') {
        const key = `sidebar.docs.category.${result.label}`;
        if (translations[key]) result.label = translations[key].message;
        else if (manualLabels[result.label]) result.label = manualLabels[result.label];
        else unmapped.add(result.label);
    }
    if (Array.isArray(result.items)) result.items = localize(result.items);
    else if (!result.type) {
        for (const [key, value] of Object.entries(result)) {
            if (Array.isArray(value)) result[key] = localize(value);
        }
    }
    return result;
}

const localized = {...sidebars, docs: localize(sidebars.docs)};
fs.writeFileSync(path.join(root, 'sidebars.json'), JSON.stringify(localized, null, 4) + '\n');

console.log(`localized sidebar written; unmapped labels: ${unmapped.size}`);
if (unmapped.size) console.log([...unmapped].join(' | '));