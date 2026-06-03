'use strict';

const bannerScript = `
<script id="directory-banner-bg">
(function () {
  var banner = 'linear-gradient(rgba(255,255,255,.16),rgba(255,255,255,.28)),url("/images/banner.svg")';
  var selectors = [
    'html',
    'body',
    '#body-wrap',
    '.body-wrap',
    '#app',
    '.app',
    '.page-container',
    '.main-container',
    '.main-content-container',
    '.page-main-container'
  ];

  selectors.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (element) {
      element.style.backgroundImage = banner;
      element.style.backgroundPosition = 'center center';
      element.style.backgroundSize = 'cover';
      element.style.backgroundRepeat = 'no-repeat';
      element.style.backgroundAttachment = 'fixed';
      element.style.backgroundColor = 'transparent';
    });
  });
})();
</script>`;

function injectBannerScript(html) {
  if (html.includes('id="directory-banner-bg"')) return html;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${bannerScript}\n</body>`);
  }

  return `${html}\n${bannerScript}`;
}

hexo.extend.filter.register('after_render:html', (html, data) => {
  if (!/<(?:html|body)\b/i.test(html)) return html;
  if (data && data.path === 'index.html') return html;

  return injectBannerScript(html);
});
