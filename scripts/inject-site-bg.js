'use strict';

const bannerBackground = [
  'background:linear-gradient(rgba(255,255,255,.14),rgba(255,255,255,.24)),url("/images/banner.svg") center center / cover fixed no-repeat !important',
  'background-color:transparent !important'
].join(';');

const siteBackgroundCss = `
<style id="site-banner-bg">
:root {
  --site-bg-image: url("/images/banner.svg");
  --site-surface: rgba(255, 255, 255, 0.36);
  --site-surface-soft: rgba(255, 255, 255, 0.2);
  --site-surface-strong: rgba(255, 255, 255, 0.58);
  --site-border: rgba(255, 255, 255, 0.28);
}

html,
body {
  min-height: 100%;
}

html,
body {
  background:
    linear-gradient(rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.24)),
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
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.22), transparent 32rem),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.28));
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
.page-container,
.post-page-container,
.archive-page-container,
.category-page-container,
.tag-page-container,
.links-page-container,
.about-page-container,
.home-content-container,
.home-article-list,
.category-list-container,
.archive-list-container,
.tag-list-container {
  background-color: transparent !important;
  background-image: none !important;
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

.main-content,
.sidebar,
.home-sidebar {
  background-color: var(--site-surface) !important;
  border-color: var(--site-border) !important;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.article-content,
.post-content,
.post-header,
.post-meta,
.page-content,
.home-article-item,
.recent-post-item,
.article-card,
.post-card,
.page-card,
.category-list-item,
.archive-list-item,
.tag-list-item,
.card,
.content-card {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}

.post-toc,
.toc-content-container,
.side-tools {
  background-color: var(--site-surface-soft) !important;
  border-color: var(--site-border) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.navbar,
.navbar-container,
#navbar {
  background-color: var(--site-surface-strong) !important;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.page-container,
.post-page-container,
.archive-page-container,
.category-page-container,
.tag-page-container,
.links-page-container,
.about-page-container {
  box-shadow: none !important;
}

.main-content {
  border-radius: 14px;
  box-shadow: 0 18px 60px rgba(31, 41, 55, 0.08) !important;
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

hexo.extend.filter.register('after_render:html', (html) => {
  if (!/<(?:html|body)\b/i.test(html)) return html;

  return injectStyleBlock(appendBodyStyle(html, bannerBackground));
});
