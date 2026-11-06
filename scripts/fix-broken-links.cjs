const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const docsRoot = path.join(root, 'docs');
const buildLog = fs.readFileSync(path.join(root, 'build.log'), 'utf8');

function walk(directory) {
    const files = [];
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...walk(file));
        else if (/\.mdx?$/.test(entry.name)) files.push(file);
    }
    return files;
}

function routeMap() {
    const map = new Map();
    const metadataDir = path.join(root, '.docusaurus/docusaurus-plugin-content-docs/default');
    if (!fs.existsSync(metadataDir)) return map;
    for (const file of fs.readdirSync(metadataDir)) {
        if (!file.startsWith('site-') || !file.endsWith('.json')) continue;
        const data = JSON.parse(fs.readFileSync(path.join(metadataDir, file), 'utf8'));
        if (!data.permalink || !data.source) continue;
        map.set(data.permalink.replace(/\/$/, ''), path.join(root, data.source.replace(/^@site\//, '')));
    }
    return map;
}

function segmentsOf(url) {
    return url.split('#')[0].replace(/\/$/, '').replace(/\.mdx?$/, '')
        .split('/').filter(segment => segment && segment !== '.' && segment !== '..');
}

const routes = routeMap();
const docRecords = walk(docsRoot).map(file => {
    const rel = path.relative(docsRoot, file).split(path.sep).join('/').replace(/\.mdx?$/, '');
    return {file, rel, relNoIndex: rel.replace(/\/index$/, '')};
});

function findCandidates(sourceFile, targetSegments) {
    const sourceDir = path.dirname(sourceFile);
    const matches = [];
    for (const record of docRecords) {
        for (const candidate of [record.rel, record.relNoIndex]) {
            const candidateSegments = candidate.split('/');
            const compareLength = Math.min(targetSegments.length, candidateSegments.length);
            if (compareLength === 0) continue;
            const targetSuffix = targetSegments.slice(-compareLength).join('/');
            const candidateSuffix = candidateSegments.slice(-compareLength).join('/');
            if (targetSuffix === candidateSuffix) {
                matches.push({
                    file: record.file,
                    rel: record.rel,
                    score: compareLength,
                    sameDir: path.dirname(record.file) === sourceDir ? 1 : 0,
                });
            }
        }
    }
    matches.sort((a, b) => b.sameDir - a.sameDir || b.score - a.score || a.rel.length - b.rel.length);
    return matches;
}

const blocks = buildLog.split(/\n(?=\s*-\s*Broken link on source page path = )/);
const fixes = [];
for (const block of blocks) {
    const sourceMatch = block.match(/^\s*-\s*Broken link on source page path = (\S+):/m);
    if (!sourceMatch) continue;
    const sourceFile = routes.get(sourceMatch[1].replace(/\/$/, ''));
    if (!sourceFile || !fs.existsSync(sourceFile)) continue;
    for (const match of block.matchAll(/-> linking to (.*?) \(resolved as: /g)) {
        fixes.push({sourceFile, target: match[1]});
    }
}

const byFile = new Map();
for (const fix of fixes) {
    if (!byFile.has(fix.sourceFile)) byFile.set(fix.sourceFile, []);
    byFile.get(fix.sourceFile).push(fix);
}

const linkPattern = /\]\(\s*<?([^)>\s]+)>?(?:\s+"[^"]*")?\s*\)|(?:href|src)="([^"]+)"/g;
let fixed = 0;
const unmatched = [];

for (const [sourceFile, fileFixes] of byFile) {
    let text = fs.readFileSync(sourceFile, 'utf8');
    const replacements = new Map();

    for (const fix of fileFixes) {
        const targetSegments = segmentsOf(fix.target);
        if (targetSegments.length === 0) continue;
        const candidates = findCandidates(sourceFile, targetSegments);
        if (candidates.length === 0) {
            unmatched.push({sourceFile, target: fix.target, reason: 'no target file'});
            continue;
        }
        const targetFile = candidates[0].file;
        const targetKey = targetSegments.slice(-Math.min(2, targetSegments.length)).join('/');

        let found = false;
        for (const match of text.matchAll(linkPattern)) {
            const url = match[1] || match[2];
            if (!url || /^(https?:|mailto:|\/|#)/.test(url)) continue;
            const urlSegments = segmentsOf(url);
            if (urlSegments.length === 0) continue;
            const urlKey = urlSegments.slice(-Math.min(2, urlSegments.length)).join('/');
            if (urlKey !== targetKey) continue;

            const anchor = url.includes('#') ? '#' + url.split('#').slice(1).join('#') : '';
            let relative = path.relative(path.dirname(sourceFile), targetFile).split(path.sep).join('/');
            if (!relative.startsWith('.')) relative = './' + relative;
            if (!/.mdx?$/.test(relative)) relative += '.md';
            replacements.set(url, relative + anchor);
            found = true;
        }
        if (!found) unmatched.push({sourceFile, target: fix.target, reason: 'link text not found'});
    }

    for (const [from, to] of replacements) {
        text = text.split(from).join(to);
    }
    if (replacements.size > 0) {
        fs.writeFileSync(sourceFile, text);
        fixed += replacements.size;
        console.log(`FIX ${path.relative(root, sourceFile)}: ${replacements.size} link(s)`);
        for (const [from, to] of replacements) console.log(`  ${from} -> ${to}`);
    }
}

console.log(`\nFixed links: ${fixed}, unmatched entries: ${unmatched.length}`);
for (const item of unmatched) console.log(`UNMATCHED ${path.relative(root, item.sourceFile)} -> ${item.target} (${item.reason})`);