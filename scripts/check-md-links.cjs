const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'docs');

function walk(directory) {
    const files = [];
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) files.push(...walk(file));
        else if (/\.mdx?$/.test(entry.name)) files.push(file);
    }
    return files;
}

function stripCode(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`\n]*`/g, '');
}

const files = walk(root);
const missing = [];

for (const file of files) {
    const text = stripCode(fs.readFileSync(file, 'utf8'));
    const linkPattern = /\]\(\s*<?([^)>\s]+?\.mdx?(?:#[^)>\s]*)?)>?\s*\)/g;
    let match;
    while ((match = linkPattern.exec(text)) !== null) {
        const raw = match[1];
        if (/^(https?:|mailto:|\/)/.test(raw)) continue;
        const withoutAnchor = raw.split('#')[0];
        const target = path.resolve(path.dirname(file), withoutAnchor);
        if (!fs.existsSync(target)) {
            missing.push({file: path.relative(path.resolve(__dirname, '..'), file), target: raw});
        }
    }
}

if (missing.length === 0) {
    console.log('No missing relative Markdown links.');
} else {
    console.log(`Missing relative Markdown links: ${missing.length}`);
    for (const item of missing) console.log(`${item.file} -> ${item.target}`);
}
process.exitCode = missing.length === 0 ? 0 : 1;