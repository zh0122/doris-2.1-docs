// @ts-check
const {themes} = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'Apache Doris 2.1 中文文档',
    tagline: 'Apache Doris 2.1 中文文档归档',
    url: 'https://zh0122.github.io',
    baseUrl: '/doris-2.1-docs/',
    trailingSlash: true,
    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'throw',
    onBrokenAnchors: 'throw',
    i18n: {
        defaultLocale: 'zh-CN',
        locales: ['zh-CN'],
    },
    markdown: {
        format: 'detect',
    },
    presets: [
        [
            'classic',
            {
                docs: {
                    path: 'docs',
                    routeBasePath: 'docs',
                    sidebarPath: require.resolve('./sidebars.js'),
                    showLastUpdateTime: false,
                },
                blog: false,
            },
        ],
    ],
    themes: [
        [
            require.resolve('@yang1666204/docusaurus-search-local'),
            {
                hashed: true,
                language: ['zh'],
                indexDocs: true,
                docsRouteBasePath: ['docs'],
                indexBlog: false,
                highlightSearchTermsOnTargetPage: true,
                explicitSearchResultPath: true,
                searchBarShortcut: true,
                searchBarShortcutHint: true,
                searchResultLimits: 100,
            },
        ],
    ],
    themeConfig: {
        navbar: {
            title: 'Apache Doris 2.1 中文文档',
            items: [
                {
                    type: 'search',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            copyright: `Copyright © ${new Date().getFullYear()} Apache Doris. 非官方 2.1 中文文档归档。`,
        },
        docs: {
            sidebar: {
                autoCollapseCategories: true,
            },
        },
        prism: {
            theme: themes.oneLight,
            additionalLanguages: ['java', 'bash', 'sql', 'python', 'json', 'yaml'],
        },
    },
    future: {
        experimental_faster: false,
    },
};

module.exports = config;