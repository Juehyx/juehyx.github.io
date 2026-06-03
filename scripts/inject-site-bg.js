'use strict';

const bannerBackground = [
  'background:linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,.5)),url("/images/banner.svg") center center / cover fixed no-repeat !important',
  'background-color:transparent !important'
].join(';');

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
  if (!data || data.path !== 'index.html') return html;

  let output = appendBodyStyle(html, bannerBackground);

  [
    '.page-container',
    '.main-content',
    '.main-content-container',
    '.main-content-body',
    '.home-content-container',
    '.home-article-list'
  ].forEach((selector) => {
    output = appendStyleTag(output, selector, bannerBackground);
  });

  return output;
});
