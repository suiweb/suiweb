// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'SuiWeb Reference',
  tagline: 'Tutorial and API Reference for SuiWeb',
  url: 'https://suiweb.github.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  // favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  organizationName: 'suiweb',
  projectName: 'suiweb',
  deploymentBranch: 'gh-pages',
  githubHost: 'github.com',
  githubPort: '22',
  trailingSlash: false,

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          numberPrefixParser: false,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-public',
        entryPoints: ['../suiweb/src/index.ts'],
        entryPointStrategy: 'resolve',
        tsconfig: '../suiweb/tsconfig.json',
        out: './api/public',
        sidebar: {
          categoryLabel: 'Public API',
          position: 10,
          fullNames: true,
        },
        readme: './docs-src/api/public/README.md',
      },
    ],
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api-src',
        entryPoints: ['../suiweb/src'],
        entryPointStrategy: 'expand',
        exclude: '../suiweb/src/index.ts',
        tsconfig: '../suiweb/tsconfig.json',
        out: './api/internal',
        sidebar: {
          categoryLabel: 'Internal API',
          position: 11,
          fullNames: true,
        },
        readme: './docs-src/api/internal/README.md',
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'SuiWeb',
        items: [
          {
            to: 'docs',
            activeBaseRegex: 'docs(\/)?$',
            position: 'left',
            label: 'Overview',
          },
          {
            to: 'docs/tutorial',
            activeBasePath: 'docs/tutorial',
            position: 'left',
            label: 'Tutorial',
          },
          {
            to: 'docs/api',
            activeBasePath: 'docs/api',
            position: 'left',
            label: 'API Documentation',
          },
          {
            href: 'https://github.com/suiweb/suiweb',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Explore',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/getting-started',
              },
              {
                label: 'Demos',
                to: '/docs/demos',
              },
              {
                label: 'Tutorial',
                to: '/docs/tutorial',
              },
            ],
          },
          {
            title: 'API Documentation',
            items: [
              {
                label: 'Public',
                to: '/docs/api/public',
              },
              {
                label: 'Internal',
                to: '/docs/api/internal',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/suiweb/suiweb',
              },
            ],
          },
        ],
        copyright: `${new Date().getFullYear()} Simon Schuhmacher, Timo Siegenthaler – ZHAW School of Engineering.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      colorMode: {
        respectPrefersColorScheme: true,
      }
    }),
};

module.exports = config;
