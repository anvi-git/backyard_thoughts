/**
 * Backyard Article Engine
 * Shared client module for rendering single essays, dispatches, and sound orbits.
 * Standardizes typography (Bebas Neue headline, JetBrains Mono body, vertical rule, drop cap),
 * integrates click-to-load media facades, and manages related article recommendations.
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

  function plainTextLength(str) {
    return (str || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .length;
  }

  async function getArticleBody(markdownFile) {
    if (
      window.POST_CONTENTS &&
      Object.prototype.hasOwnProperty.call(window.POST_CONTENTS, markdownFile)
    ) {
      return window.POST_CONTENTS[markdownFile];
    }

    const response = await fetch(markdownFile);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.text();
  }

  function showArticleError(container, message) {
    if (!container) return;
    container.innerHTML = `<p class="ht-empty-state">Unable to load dispatch content. ${escapeHtml(message)}</p>`;
  }

  function buildShortContentNote(article) {
    const excerpt = (article && article.excerpt) || '';
    const markdownFile = (article && article.markdownFile) || 'unknown file';
    const excerptHtml = excerpt ? `<p>${escapeHtml(excerpt)}</p>` : '';
    return `
      <div class="archive-short-content-note">
        ${excerptHtml}
        <p><em>Archive note: this file currently contains a short preview. Source file: ${escapeHtml(markdownFile)}.</em></p>
      </div>
    `;
  }

  function removeDuplicateTitle(container, pageTitle) {
    if (!container || !pageTitle) return;
    const firstHeading = container.querySelector('h1, h2');
    if (!firstHeading) return;

    const normalize = text => (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (normalize(firstHeading.textContent) === normalize(pageTitle)) {
      firstHeading.remove();
    }
  }

  function renderInterruptions(container, article) {
    if (!container || !article || !article.interruptions) return;
    article.interruptions.forEach(interruption => {
      const div = container.querySelector(`#${interruption.id}`);
      if (div && window.renderInterruption) {
        window.renderInterruption(interruption.id, interruption.caption);
      }
    });
  }

  function formatSoundOrbitsBody(container) {
    if (!container) return;
    container.querySelectorAll('p').forEach(p => {
      const text = p.textContent.trim();
      if (text.includes(':') && !text.toLowerCase().startsWith('this week') && !text.toLowerCase().startsWith('published')) {
        const parts = text.split(':');
        if (parts.length === 2 && parts[0].length < 40) {
          p.innerHTML = `<span class="sound-orbit-song-title">${escapeHtml(parts[0])}</span>: ${escapeHtml(parts[1])}`;
        }
      }
    });
  }

  function renderArticleBody(container, bodyText, article, options) {
    if (!container) return;
    const trimmed = (bodyText || '').trim();
    if (!trimmed) {
      container.innerHTML = buildShortContentNote(article);
      return;
    }

    const looksLikeHtml = /<\s*[a-z!][^>]*>/i.test(trimmed);
    let renderedHtml = '';

    if (looksLikeHtml) {
      renderedHtml = trimmed;
    } else if (window.marked && typeof window.marked.parse === 'function') {
      renderedHtml = window.marked.parse(trimmed);
    } else {
      renderedHtml = trimmed
        .split(/\n{2,}/)
        .map(block => {
          const escaped = escapeHtml(block);
          const withImages = escaped.replace(
            /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
            (_m, alt, src, title) => `<img src="${src}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`
          );
          return `<p>${withImages.replace(/\n/g, '<br>')}</p>`;
        })
        .join('');
    }

    if (!plainTextLength(renderedHtml)) {
      container.innerHTML = buildShortContentNote(article);
      return;
    }

    const shortNote = plainTextLength(renderedHtml) < 120 ? buildShortContentNote(article) : '';
    container.innerHTML = renderedHtml + shortNote;

    // Remove duplicate title heading inside body if present
    removeDuplicateTitle(container, article.title);

    // Apply drop cap class to first paragraph if needed
    if (!container.querySelector('.drop-cap, .ht-drop-cap')) {
      const firstParagraph = container.querySelector('p');
      if (firstParagraph) {
        firstParagraph.classList.add('ht-first-p');
      }
    }

    // Optional Sound Orbits formatting
    if (options && options.isSoundOrbits) {
      formatSoundOrbitsBody(container);
    }

    // Render interruptions if present
    renderInterruptions(container, article);

    // Enhance media (iframes to click-to-load facades, images to lazy loading)
    if (window.BackyardMedia && typeof window.BackyardMedia.enhanceContainerMedia === 'function') {
      window.BackyardMedia.enhanceContainerMedia(container);
    }
  }

  function setupMobileMenu() {
    const hamburgerBtn = document.getElementById('ht-hamburger-btn') || document.querySelector('.ht-hamburger');
    const navMenu = document.getElementById('ht-nav-menu') || document.querySelector('.ht-nav-links');

    if (hamburgerBtn && navMenu) {
      hamburgerBtn.addEventListener('click', () => {
        const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
        hamburgerBtn.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('open');
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('open')) {
          hamburgerBtn.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('open');
          hamburgerBtn.focus();
        }
      });

      document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
          hamburgerBtn.setAttribute('aria-expanded', 'false');
          navMenu.classList.remove('open');
        }
      });
    }
  }

  async function initArticle(config) {
    const {
      sourceData,
      publicationName,
      viewerUrl,
      defaultId,
      bodyContainerId,
      titleElementId,
      deckElementId,
      dateElementId,
      readTimeElementId,
      categoryElementId,
      coverWrapId,
      coverImgId,
      relatedGridId,
      detectCategory,
      isSoundOrbits
    } = config;

    setupMobileMenu();

    const bodyContainer = document.getElementById(bodyContainerId);
    if (!bodyContainer) return;

    try {
      const deduped = (window.BackyardArchive && window.BackyardArchive.dedupeArticles)
        ? window.BackyardArchive.dedupeArticles(sourceData || {})
        : { articles: sourceData || {}, idAlias: {} };

      const articles = deduped.articles;
      const idBySlug = {};
      Object.keys(articles).forEach(artId => {
        const slug = (window.BackyardArchive && window.BackyardArchive.getArticleSlug)
          ? window.BackyardArchive.getArticleSlug(articles[artId])
          : (articles[artId].markdownFile || '').split('/').pop().replace(/\.(md|html)$/i, '');
        if (slug) idBySlug[slug] = artId;
      });

      const params = new URLSearchParams(window.location.search);
      const requestedSlug = params.get('article');
      const requestedId = params.get('id') || defaultId;

      const idFromSlug = requestedSlug ? idBySlug[requestedSlug] : null;
      const resolvedId = idFromSlug || deduped.idAlias[requestedId] || requestedId;
      const fallbackId = Object.keys(articles)[0];
      const article = articles[resolvedId] || articles[fallbackId];

      if (!article) {
        showArticleError(bodyContainer, 'Post not found in publication archive.');
        return;
      }

      // Metadata & Title
      const pubTitle = publicationName || 'BACKYARD';
      document.title = `${article.title.toUpperCase()} — ${pubTitle}`;

      const titleEl = document.getElementById(titleElementId);
      if (titleEl) titleEl.textContent = article.title;

      const cat = detectCategory ? detectCategory(article) : (article.category || pubTitle);
      const catEl = categoryElementId ? document.getElementById(categoryElementId) : null;
      if (catEl) catEl.textContent = cat;

      const deckEl = deckElementId ? document.getElementById(deckElementId) : null;
      if (deckEl) {
        if (article.excerpt) {
          deckEl.textContent = article.excerpt;
          deckEl.style.display = 'block';
        } else {
          deckEl.style.display = 'none';
        }
      }

      const dateEl = dateElementId ? document.getElementById(dateElementId) : null;
      if (dateEl) {
        const formattedDate = (window.BackyardArchive && window.BackyardArchive.formatDisplayDate)
          ? window.BackyardArchive.formatDisplayDate(article.date)
          : (article.date || '');
        dateEl.textContent = formattedDate;
        dateEl.setAttribute('datetime', article.date || '');
      }

      const readTimeEl = readTimeElementId ? document.getElementById(readTimeElementId) : null;
      if (readTimeEl) {
        readTimeEl.textContent = (window.BackyardArchive && window.BackyardArchive.estimateReadTime)
          ? window.BackyardArchive.estimateReadTime(article)
          : '5 MIN READ';
      }

      // Cover image
      const coverWrap = coverWrapId ? document.getElementById(coverWrapId) : null;
      const coverImg = coverImgId ? document.getElementById(coverImgId) : null;
      if (coverWrap && coverImg) {
        if (article.image) {
          coverImg.src = article.image;
          coverImg.alt = `Cover: ${article.title}`;
          coverWrap.style.display = 'block';
          coverImg.onerror = () => { coverWrap.style.display = 'none'; };
        } else {
          coverWrap.style.display = 'none';
        }
      }

      // Fetch and render body
      try {
        const bodyContent = await getArticleBody(article.markdownFile);
        renderArticleBody(bodyContainer, bodyContent, article, { isSoundOrbits });
      } catch (err) {
        showArticleError(bodyContainer, `Source file: ${article.markdownFile}`);
      }

      // Related articles grid
      const relatedGrid = relatedGridId ? document.getElementById(relatedGridId) : null;
      if (relatedGrid) {
        const sortedIds = Object.keys(articles).sort((a, b) => {
          const da = new Date(articles[a].date || 0);
          const db = new Date(articles[b].date || 0);
          return db - da;
        });

        let relatedIds = sortedIds.filter(id => {
          if (id === resolvedId) return false;
          if (!detectCategory) return true;
          return detectCategory(articles[id]) === cat;
        });

        if (relatedIds.length < 3) {
          sortedIds.forEach(id => {
            if (id !== resolvedId && !relatedIds.includes(id)) {
              relatedIds.push(id);
            }
          });
        }

        const topRelated = relatedIds.slice(0, 3);
        if (topRelated.length && window.BackyardArchive) {
          relatedGrid.innerHTML = topRelated.map(relId => {
            const relArt = articles[relId];
            const relCat = detectCategory ? detectCategory(relArt) : (relArt.category || pubTitle);
            return window.BackyardArchive.renderCard(relId, relArt, viewerUrl, relCat);
          }).join('');
        } else if (topRelated.length === 0) {
          relatedGrid.innerHTML = '<p class="ht-empty-state">No other related dispatches at this time.</p>';
        }
      }

    } catch (err) {
      showArticleError(bodyContainer, `Initialization error: ${err.message}`);
    }
  }

  window.BackyardArticle = {
    getArticleBody,
    renderArticleBody,
    initArticle
  };
})();
