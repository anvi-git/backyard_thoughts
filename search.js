/**
 * Backyard Search Engine
 * Consolidates articles across all Backyard publications:
 * - Heralding Time
 * - Last Scattering Surface
 * - Space of Sound
 * - The Blog
 * - Observe the Fire
 * - The Magazine
 */
(function() {
  function getSlug(file) {
    return ((file || '').split('/').pop() || '').replace(/\.(md|html)$/i, '');
  }

  function dedupeArticles(sourceArticles, pubName, urlBuilder, defaultImage) {
    const map = new Map();
    Object.entries(sourceArticles || {}).forEach(([id, a]) => {
      if (!a) return;
      const slug = getSlug(a.markdownFile);
      const key = (a.title || slug || id).trim().toLowerCase();
      const score = (a.markdownFile || '').endsWith('.html') ? 2 : 1;
      const existing = map.get(key);
      if (!existing || score > existing.score) {
        map.set(key, {
          id,
          title: a.title || 'Untitled',
          date: a.date || '',
          excerpt: a.excerpt || '',
          image: a.image || defaultImage || '',
          publication: pubName,
          language: a.language || 'eng',
          url: urlBuilder(id, a, slug),
          score
        });
      }
    });
    return Array.from(map.values());
  }

  function getAllArticles() {
    const articles = [];

    // 1. Heralding Time
    if (window.HT_ARTICLES) {
      const ht = dedupeArticles(
        window.HT_ARTICLES,
        'Heralding Time',
        (id, a, slug) => slug ? `ht_article.html?article=${encodeURIComponent(slug)}` : 'ht.html',
        'images/titles/ht.png'
      );
      articles.push(...ht);
    }

    // 2. Last Scattering Surface
    if (window.LSS_ARTICLES) {
      const lss = dedupeArticles(
        window.LSS_ARTICLES,
        'Last Scattering Surface',
        (id, a, slug) => slug ? `lss_article.html?article=${encodeURIComponent(slug)}` : 'lss.html',
        'images/titles/lss.png'
      );
      articles.push(...lss);
    }

    // 3. Space of Sound
    if (window.SPACESOUND_ARTICLES) {
      const sos = dedupeArticles(
        window.SPACESOUND_ARTICLES,
        'Space of Sound',
        (id, a, slug) => slug ? `spacesound_article.html?article=${encodeURIComponent(slug)}` : 'sp.html',
        'images/titles/sos.png'
      );
      articles.push(...sos);
    }

    // 4. The Blog
    if (window.BLOG_ARTICLES) {
      Object.entries(window.BLOG_ARTICLES).forEach(([id, a]) => {
        if (!a) return;
        articles.push({
          id,
          title: a.title || 'Poem / Reflection',
          date: a.date || '',
          excerpt: a.excerpt || '',
          image: 'images/landing_page/pic.jpg',
          publication: 'The Blog',
          language: 'eng',
          url: `blog_article.html?id=${encodeURIComponent(id)}`
        });
      });
    }

    // 5. Observe the Fire
    articles.push({
      id: 'otf-global',
      title: 'Global Temperature Anomaly (1880–2026)',
      date: '2026-03-01',
      excerpt: 'Climate records and monthly temperature anomaly data tracking global shifts from 1880 to 2026.',
      image: 'assets/climate_section/plots/Global_Temperature_Anomaly_1880-2026.png',
      publication: 'Observe the Fire',
      language: 'eng',
      url: 'observe-fire.html'
    });

    articles.push({
      id: 'otf-heatmaps',
      title: 'Monthly Global, Northern & Southern Temperature Anomalies',
      date: '2026-02-15',
      excerpt: 'Visual heatmaps comparing hemispheric anomalies and long-term warming records.',
      image: 'assets/climate_section/heatmaps/Monthly_Global_Temperature_Anomalies.png',
      publication: 'Observe the Fire',
      language: 'eng',
      url: 'observe-fire.html'
    });

    // 6. The Magazine
    articles.push({
      id: 'mag-issue-1',
      title: 'Backyard Magazine — Issue No. 01',
      date: '2026-01-01',
      excerpt: 'A curated selection from the publications of Backyard, available to read online or as PDF.',
      image: 'images/titles/backyard.png',
      publication: 'The Magazine',
      language: 'eng',
      url: 'magazine.html'
    });

    return articles;
  }

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightMatches(text, queryWords) {
    if (!text) return '';
    const escaped = escapeHtml(text);
    if (!queryWords || !queryWords.length) return escaped;

    let result = escaped;
    queryWords.forEach(word => {
      if (!word || word.length < 2) return;
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
    });
    return result;
  }

  function searchArticles(query, activeFilter, allArticles) {
    const rawQuery = (query || '').trim().toLowerCase();
    const queryWords = rawQuery ? rawQuery.split(/\s+/).filter(w => w.length > 0) : [];

    let filtered = allArticles;
    if (activeFilter && activeFilter !== 'all') {
      filtered = filtered.filter(a => a.publication.toLowerCase() === activeFilter.toLowerCase());
    }

    if (!queryWords.length) {
      return {
        queryWords: [],
        results: activeFilter !== 'all' ? filtered.slice(0, 30) : []
      };
    }

    const scored = [];
    filtered.forEach(article => {
      const titleLower = (article.title || '').toLowerCase();
      const excerptLower = (article.excerpt || '').toLowerCase();
      const pubLower = (article.publication || '').toLowerCase();
      const dateLower = (article.date || '').toLowerCase();

      let score = 0;

      // Exact phrase match
      if (titleLower.includes(rawQuery)) score += 80;
      if (excerptLower.includes(rawQuery)) score += 30;

      // Match individual query words
      let allWordsFound = true;
      queryWords.forEach(word => {
        let wordFound = false;
        if (titleLower.includes(word)) {
          score += 40;
          wordFound = true;
        }
        if (excerptLower.includes(word)) {
          score += 15;
          wordFound = true;
        }
        if (pubLower.includes(word)) {
          score += 20;
          wordFound = true;
        }
        if (dateLower.includes(word)) {
          score += 10;
          wordFound = true;
        }
        if (!wordFound) {
          allWordsFound = false;
        }
      });

      // Boost if all search words appear
      if (allWordsFound && queryWords.length > 1) {
        score += 50;
      }

      if (score > 0) {
        scored.push({ article, score });
      }
    });

    // Sort by score descending, then date descending
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.article.date || '').localeCompare(a.article.date || '');
    });

    return {
      queryWords,
      results: scored.map(s => s.article)
    };
  }

  function initSearch() {
    const searchInput = document.getElementById('site-search-input');
    const searchBtn = document.getElementById('site-search-btn');
    const clearBtn = document.getElementById('site-search-clear');
    const resultsContainer = document.getElementById('site-search-results');
    const resultsList = document.getElementById('search-results-list');
    const resultsSummary = document.getElementById('search-results-summary');
    const filterPills = document.querySelectorAll('.search-filter-pill');
    const topicTags = document.querySelectorAll('.search-topic-tag');
    const totalCountEl = document.getElementById('search-total-count');

    if (!searchInput || !resultsContainer || !resultsList) return;

    const allArticles = getAllArticles();
    if (totalCountEl) {
      totalCountEl.textContent = `${allArticles.length} articles across 6 publications`;
    }

    let currentFilter = 'all';

    function renderResults() {
      const query = searchInput.value.trim();
      const { queryWords, results } = searchArticles(query, currentFilter, allArticles);

      // Toggle clear button
      if (clearBtn) {
        clearBtn.style.display = query ? 'inline-flex' : 'none';
      }

      // If no query and filter is all, hide results
      if (!query && currentFilter === 'all') {
        resultsContainer.style.display = 'none';
        resultsList.innerHTML = '';
        return;
      }

      resultsContainer.style.display = 'block';

      // Summary text
      let filterText = currentFilter === 'all' ? 'all publications' : currentFilter;
      if (query) {
        resultsSummary.innerHTML = `Found <strong>${results.length}</strong> ${results.length === 1 ? 'article' : 'articles'} matching <em>"${escapeHtml(query)}"</em> in ${filterText}`;
      } else {
        resultsSummary.innerHTML = `Showing <strong>${results.length}</strong> articles in ${filterText}`;
      }

      if (results.length === 0) {
        resultsList.innerHTML = `
          <div class="search-empty-state">
            <p class="search-empty-title">No articles found</p>
            <p class="search-empty-desc">We couldn't find any articles matching your search. Try searching for broader terms like <em>cycloid</em>, <em>star</em>, <em>sound orbits</em>, <em>physics</em>, or select another publication filter.</p>
          </div>
        `;
        return;
      }

      resultsList.innerHTML = results.map(article => {
        const pubClass = article.publication.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const highlightedTitle = highlightMatches(article.title, queryWords);
        const highlightedExcerpt = highlightMatches(article.excerpt, queryWords);

        return `
          <a href="${article.url}" class="search-result-card pub-${pubClass}">
            <div class="search-card-meta">
              <span class="search-card-pub">${escapeHtml(article.publication)}</span>
              ${article.date ? `<span class="search-card-date">${escapeHtml(article.date)}</span>` : ''}
            </div>
            <div class="search-card-body">
              ${article.image ? `
                <div class="search-card-thumb-wrap">
                  <img src="${article.image}" alt="" class="search-card-thumb" loading="lazy" onerror="this.parentElement.style.display='none'">
                </div>
              ` : ''}
              <div class="search-card-content">
                <h4 class="search-card-title">${highlightedTitle}</h4>
                ${article.excerpt ? `<p class="search-card-excerpt">${highlightedExcerpt}</p>` : ''}
              </div>
            </div>
            <span class="search-card-link">Read article &rarr;</span>
          </a>
        `;
      }).join('');
    }

    // Debounced search on typing
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderResults, 180);
    });

    // Enter key submits search or opens first result
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderResults();
        const firstCard = resultsList.querySelector('.search-result-card');
        if (firstCard && resultsContainer.style.display !== 'none') {
          // If already showing results, navigate on Enter
          // firstCard.click();
        }
      } else if (e.key === 'Escape') {
        searchInput.value = '';
        renderResults();
        searchInput.blur();
      }
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        renderResults();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        renderResults();
        searchInput.focus();
      });
    }

    // Close results button
    const closeBtn = document.getElementById('search-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentFilter = 'all';
        filterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === 'all'));
        resultsContainer.style.display = 'none';
      });
    }

    // Filter pills click
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.getAttribute('data-filter') || 'all';
        renderResults();
      });
    });

    // Topic chips click
    topicTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const topic = tag.getAttribute('data-topic');
        searchInput.value = topic;
        currentFilter = 'all';
        filterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === 'all'));
        renderResults();
        searchInput.focus();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();
