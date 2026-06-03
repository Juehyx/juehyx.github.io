'use strict';

const bannerBackground = [
  'background:linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.5)),url("/images/banner.svg") center center / cover fixed no-repeat !important',
  'background-color:transparent !important'
].join(';');

const siteBackgroundCss = `
<style id="site-banner-bg">
:root {
  --site-bg-image: url("/images/banner.svg");
  --site-surface: rgba(255, 255, 255, 0.78);
  --site-surface-strong: rgba(255, 255, 255, 0.9);
  --site-border: rgba(255, 255, 255, 0.42);
}

html,
body {
  min-height: 100%;
}

html,
body {
  background:
    linear-gradient(rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.18)),
    var(--site-bg-image) center center / cover fixed no-repeat !important;
  background-color: transparent !important;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.36), transparent 32rem),
    linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.48));
}

body,
#body-wrap,
.body-wrap,
#app,
.app,
main,
.main,
.main-container,
.page-main-container,
.main-content-container,
.content-container,
.site-content,
.page-content,
.home-container,
.home-main-container,
.home-main-content,
.home-content,
.post-page,
.archive-page,
.category-page,
.tag-page,
.archives-page,
.categories-page,
.tags-page,
.page-container {
  background-color: transparent !important;
}

.home-banner-container,
.home-banner,
#home-banner {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.16)),
    var(--site-bg-image) !important;
  background-position: center center !important;
  background-size: cover !important;
}

.home-container,
.home-main-container,
.home-main-content,
.home-content,
.main-container,
.main-content-container,
.main-content-body,
.home-content-container,
.page-main-container,
.page-content,
.post-page,
.post-page-container,
.archive-page,
.archives-page,
.archive-page-container,
.category-page,
.categories-page,
.category-page-container,
.tag-page,
.tags-page,
.tag-page-container,
.links-page-container,
.about-page-container,
[class*="archive"][class*="container"],
[class*="archives"][class*="container"],
[class*="category"][class*="container"],
[class*="categories"][class*="container"],
[class*="tag"][class*="container"],
[class*="tags"][class*="container"],
[class*="post"][class*="container"],
[class*="article"][class*="container"],
[class*="page"][class*="container"] {
  background:
    linear-gradient(rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.5)),
    var(--site-bg-image) center center / cover fixed no-repeat !important;
}

.main-content,
.page-container,
.post-page-container,
.archive-page-container,
.category-page-container,
.tag-page-container,
.links-page-container,
.about-page-container,
.category-list-container,
.category-list-item,
.archive-list-container,
.archive-list-item,
.tag-list-container,
.tag-list-item,
.article-content,
.post-content,
.post-header,
.post-meta,
.post-toc,
.toc-content-container,
.side-tools,
.sidebar,
.home-sidebar,
.home-article-list,
.home-article-item,
.recent-post-item,
.article-card,
.post-card,
.page-card,
.card,
.content-card {
  background-color: var(--site-surface) !important;
  border-color: var(--site-border) !important;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.navbar,
.navbar-container,
#navbar {
  background-color: rgba(255, 255, 255, 0.62) !important;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.post-page-container,
.page-container,
.article-content,
.post-content {
  background-color: var(--site-surface-strong) !important;
}

@media (max-width: 768px) {
  html,
  body,
  .home-container,
  .home-main-container,
  .home-main-content,
  .home-content,
  .main-container,
  .main-content-container,
  .main-content-body,
  .home-content-container {
    background-attachment: scroll !important;
  }
}
</style>`;

function injectStyleBlock(html) {
  if (html.includes('id="site-banner-bg"')) return html;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${siteBackgroundCss}\n</head>`);
  }

  return `${siteBackgroundCss}\n${html}`;
}

function appendStyleTag(html, selector, style) {
  const classPattern = selector.replace('.', '');
  const tagPattern = new RegExp(
    `(<[^>]+class=(["'])[^"']*\\b${classPattern}\\b[^"']*\\2)([^>]*>)`,
    'g'
  );

  return html.replace(tagPattern, (match, start, quote, rest) => {
    if (/style=(["'])/i.test(match)) {
      return match.replace(/style=(["'])(.*?)\1/i, (_styleMatch, styleQuote, value) => (
        `style=${styleQuote}${value};${style}${styleQuote}`
      ));
    }

    return `${start} style="${style}"${rest}`;
  });
}

function appendBodyStyle(html, style) {
  return html.replace(/<body([^>]*)>/i, (match) => {
    if (/style=(["'])/i.test(match)) {
      return match.replace(/style=(["'])(.*?)\1/i, (_styleMatch, styleQuote, value) => (
        `style=${styleQuote}${value};${style}${styleQuote}`
      ));
    }

    return match.replace('<body', `<body style="${style}"`);
  });
}

hexo.extend.filter.register('after_render:html', (html, data) => {
  if (!/<(?:html|body)\b/i.test(html)) return html;

  let output = injectStyleBlock(appendBodyStyle(html, bannerBackground));

  [
    '.page-container',
    '.main-content',
    '.main-container',
    '.main-content-container',
    '.main-content-body',
    '.page-main-container',
    '.page-content',
    '.home-content-container',
    '.home-article-list',
    '.post-page',
    '.post-page-container',
    '.archive-page',
    '.archives-page',
    '.archive-page-container',
    '.category-page',
    '.categories-page',
    '.category-page-container',
    '.tag-page',
    '.tags-page',
    '.tag-page-container',
    '.links-page-container',
    '.about-page-container'
  ].forEach((selector) => {
    output = appendStyleTag(output, selector, bannerBackground);
  });

  return output;
});
