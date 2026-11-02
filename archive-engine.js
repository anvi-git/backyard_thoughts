/**
 * Backyard Archive Engine
 * Shared client module for rendering publication archives and dispatches.
 */
(function() {
  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getArticleSlug(article) {
    const file = ((article && article.markdownFile) || '').toString();
    const filename = file.split('/').pop() || '';
    return filename.replace(/\.(md|html)$/i, '');
  }

  function buildArticleHref(article, viewerUrl) {
    const slug = getArticleSlug(article);
    const base = viewerUrl || 'ht_article.html';
    return slug ? `${base}?article=${encodeURIComponent(slug)}` : base;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  }

  function estimateReadTime(article) {
    const words = ((article.title || '') + ' ' + (article.excerpt || '')).split(/\s+/).length;
    const minutes = Math.max(3, Math.min(8, Math.round(words / 15) + 3));
    return `${minutes} MIN READ`;
  }

  function dedupeArticles(source) {
    const scoreArticle = (art) => {
      const file = ((art && art.markdownFile) || '').toLowerCase();
      if (file.endsWith('.html')) return 2;
      if (file.endsWith('.md')) return 1;
      return 0;
    };

    const normalize = val => (val || '').toString().trim().toLowerCase();
    const makeKey = art => [
      normalize(art && art.title),
      normalize(art && art.date),
      normalize(art && art.excerpt)
    ].join('||');

    const bestByKey = new Map();
    const idAlias = {};

    Object.entries(source || {}).forEach(([id, article]) => {
      if (!article) return;
      const key = makeKey(article);
      const score = scoreArticle(article);
      const existing = bestByKey.get(key);

      if (!existing) {
        bestByKey.set(key, { id, article, score });
      } else if (score > existing.score) {
        idAlias[existing.id] = id;
        bestByKey.set(key, { id, article, score });
      } else {
        idAlias[id] = existing.id;
      }
    });

    const articles = {};
    bestByKey.forEach(entry => {
      articles[entry.id] = entry.article;
    });

    return { articles, idAlias };
  }

  function renderCard(id, article, viewerUrl, categoryLabel) {
    const href = buildArticleHref(article, viewerUrl);
    const dateFormatted = formatDisplayDate(article.date);
    const readTime = estimateReadTime(article);
    const cat = categoryLabel || article.category || 'ESSAY';

    const mediaMarkup = article.image
      ? `<img src="${escapeHtml(article.image)}" alt="Cover: ${escapeHtml(article.title)}" class="ht-card-image" loading="lazy" decoding="async">`
      : `<div class="ht-card-media-fallback" aria-hidden="true">BT</div>`;

    return `
      <article class="ht-article-card" id="article-card-${id}">
        <a href="${href}" class="ht-card-media-link" tabindex="-1" aria-hidden="true">
          <div class="ht-card-media-wrap">
            ${mediaMarkup}
          </div>
        </a>
        <div class="ht-card-content">
          <div class="ht-card-meta">
            <span class="ht-card-category">${escapeHtml(cat)}</span>
            <span class="ht-meta-dot" aria-hidden="true">•</span>
            <time datetime="${escapeHtml(article.date || '')}" class="ht-card-date">${dateFormatted}</time>
            <span class="ht-meta-dot" aria-hidden="true">•</span>
            <span class="ht-card-readtime">${readTime}</span>
          </div>
          <h3 class="ht-card-title">
            <a href="${href}">${escapeHtml(article.title)}</a>
          </h3>
          <p class="ht-card-excerpt">${escapeHtml(article.excerpt || '')}</p>
          <div class="ht-card-footer">
            <a href="${href}" class="ht-card-read-link">
              <span>Read</span>
              <span class="ht-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function initArchive(config) {
    const {
      sourceData,
      viewerUrl,
      featuredContainerId,
      gridContainerId,
      countElementId,
      filterSelector,
      detectCategory,
      filterFn
    } = config;

    const deduped = dedupeArticles(sourceData || {});
    const articles = deduped.articles;
    const sortedIds = Object.keys(articles).sort((a, b) => {
      const da = new Date(articles[a].date || 0);
      const db = new Date(articles[b].date || 0);
      return db - da;
    });

    const featuredContainer = featuredContainerId ? document.getElementById(featuredContainerId) : null;
    const gridContainer = document.getElementById(gridContainerId);
    const countEl = countElementId ? document.getElementById(countElementId) : null;
    const filterButtons = filterSelector ? document.querySelectorAll(filterSelector) : [];

    let currentFilter = 'all';

    function render() {
      let filteredIds = [...sortedIds];
      if (filterFn && currentFilter !== 'all') {
        filteredIds = filteredIds.filter(id => filterFn(articles[id], currentFilter));
      }

      if (countEl) {
        countEl.textContent = `${filteredIds.length} ${filteredIds.length === 1 ? 'DISPATCH' : 'DISPATCHES'}`;
      }

      // Featured piece
      if (featuredContainer) {
        if (filteredIds.length > 0 && currentFilter === 'all') {
          const featId = filteredIds[0];
          const feat = articles[featId];
          const featHref = buildArticleHref(feat, viewerUrl);
          const featCat = detectCategory ? detectCategory(feat) : (feat.category || 'FEATURED');
          const featDate = formatDisplayDate(feat.date);
          const featRead = estimateReadTime(feat);

          featuredContainer.innerHTML = `
            <article class="ht-featured-article" aria-label="Latest dispatch">
              <div class="ht-featured-grid">
                <a href="${featHref}" class="ht-featured-media-link" tabindex="-1" aria-hidden="true">
                  <div class="ht-featured-media-wrap">
                    ${feat.image 
                      ? `<img src="${escapeHtml(feat.image)}" alt="Cover: ${escapeHtml(feat.title)}" class="ht-featured-image" loading="eager" fetchpriority="high">`
                      : `<div class="ht-card-media-fallback" aria-hidden="true">BT</div>`
                    }
                  </div>
                </a>
                <div class="ht-featured-content">
                  <span class="ht-featured-badge">Featured · ${escapeHtml(featCat)}</span>
                  <div class="ht-card-meta">
                    <time datetime="${escapeHtml(feat.date || '')}">${featDate}</time>
                    <span class="ht-meta-dot" aria-hidden="true">•</span>
                    <span>${featRead}</span>
                  </div>
                  <h2 class="ht-featured-title">
                    <a href="${featHref}">${escapeHtml(feat.title)}</a>
                  </h2>
                  <p class="ht-featured-excerpt">${escapeHtml(feat.excerpt || '')}</p>
                  <div class="ht-card-footer">
                    <a href="${featHref}" class="ht-btn-primary">
                      <span>Read Essay</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
              </div>
            </article>
          `;
          featuredContainer.style.display = 'block';
        } else {
          featuredContainer.innerHTML = '';
          featuredContainer.style.display = 'none';
        }
      }

      // Grid
      if (!gridContainer) return;
      if (filteredIds.length === 0) {
        gridContainer.innerHTML = `
          <div class="ht-empty-state">
            <p>No dispatches found for this category.</p>
          </div>
        `;
        return;
      }

      gridContainer.innerHTML = filteredIds.map(id => {
        const art = articles[id];
        const cat = detectCategory ? detectCategory(art) : (art.category || 'ESSAY');
        return renderCard(id, art, viewerUrl, cat);
      }).join('');
    }

    // Filter clicks
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        render();
      });
    });

    render();
  }

  window.BackyardArchive = {
    dedupeArticles,
    getArticleSlug,
    buildArticleHref,
    formatDisplayDate,
    estimateReadTime,
    renderCard,
    initArchive
  };
})();
