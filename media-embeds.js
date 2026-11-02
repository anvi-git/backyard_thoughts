/**
 * Backyard Media Embeds Engine
 * Lightweight, accessible click-to-load facades for third-party media (YouTube, Apple Music)
 * and responsive image handling to prevent blocking third-party network requests on initial page load.
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

  function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:embed\/|v=|vi=|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  function createYouTubeFacade(iframe) {
    const src = iframe.getAttribute('src') || '';
    const title = iframe.getAttribute('title') || 'YouTube Video';
    const videoId = extractYouTubeId(src);

    const wrapper = document.createElement('div');
    wrapper.className = 'ht-media-facade ht-youtube-facade';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', `Video player: ${title}`);

    const posterUrl = videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : '';

    wrapper.innerHTML = `
      <div class="ht-facade-poster" style="${posterUrl ? `background-image: url('${posterUrl}');` : ''}">
        <div class="ht-facade-overlay">
          <div class="ht-facade-header">
            <span class="ht-facade-title">${escapeHtml(title)}</span>
          </div>
          <button type="button" class="ht-facade-play-btn" aria-label="Play: ${escapeHtml(title)}">
            <svg class="ht-facade-play-icon" viewBox="0 0 68 48" width="56" height="40" aria-hidden="true">
              <path class="ht-facade-play-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#0d0d0d" />
              <path d="M 45,24 27,14 27,34" fill="#ffffff" />
            </svg>
          </button>
          <div class="ht-facade-privacy">
            <span>Click to load video (connects to YouTube)</span>
          </div>
        </div>
      </div>
    `;

    const loadRealIframe = () => {
      const separator = src.includes('?') ? '&' : '?';
      const autoplaySrc = `${src}${separator}autoplay=1`;
      const realIframe = document.createElement('iframe');
      realIframe.setAttribute('src', autoplaySrc);
      realIframe.setAttribute('title', title);
      realIframe.setAttribute('frameborder', '0');
      realIframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      realIframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      realIframe.setAttribute('allowfullscreen', 'true');
      realIframe.className = 'ht-responsive-iframe';

      wrapper.innerHTML = '';
      wrapper.classList.add('ht-facade-loaded');
      wrapper.appendChild(realIframe);
      realIframe.focus();
    };

    wrapper.querySelector('.ht-facade-play-btn').addEventListener('click', loadRealIframe);
    wrapper.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !wrapper.classList.contains('ht-facade-loaded')) {
        e.preventDefault();
        loadRealIframe();
      }
    });

    return wrapper;
  }

  function createAppleMusicFacade(iframe) {
    const src = iframe.getAttribute('src') || '';
    const wrapper = document.createElement('div');
    wrapper.className = 'ht-media-facade ht-audio-facade';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Apple Music audio player');

    wrapper.innerHTML = `
      <div class="ht-audio-facade-card">
        <div class="ht-audio-facade-info">
          <span class="ht-audio-badge">Apple Music Track</span>
          <span class="ht-audio-desc">Stream or preview this song in the browser</span>
        </div>
        <button type="button" class="ht-audio-load-btn" aria-label="Load Apple Music player">
          <span>Load Player</span>
          <span aria-hidden="true">▶</span>
        </button>
      </div>
    `;

    const loadRealIframe = () => {
      const realIframe = document.createElement('iframe');
      realIframe.setAttribute('src', src);
      realIframe.setAttribute('frameborder', '0');
      realIframe.setAttribute('height', '150');
      realIframe.setAttribute('style', 'width:100%;max-width:660px;overflow:hidden;background:transparent;border:none;');
      realIframe.setAttribute('sandbox', 'allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation');
      realIframe.setAttribute('allow', 'autoplay *; encrypted-media *;');

      wrapper.innerHTML = '';
      wrapper.classList.add('ht-facade-loaded');
      wrapper.appendChild(realIframe);
    };

    wrapper.querySelector('.ht-audio-load-btn').addEventListener('click', loadRealIframe);
    return wrapper;
  }

  function enhanceContainerMedia(container) {
    if (!container) return;

    // Upgrade all iframes
    const iframes = Array.from(container.querySelectorAll('iframe'));
    iframes.forEach(iframe => {
      const src = iframe.getAttribute('src') || '';
      if (src.includes('youtube.com') || src.includes('youtu.be')) {
        const facade = createYouTubeFacade(iframe);
        iframe.parentNode.replaceChild(facade, iframe);
      } else if (src.includes('music.apple.com')) {
        const facade = createAppleMusicFacade(iframe);
        iframe.parentNode.replaceChild(facade, iframe);
      } else {
        // Generic iframe responsive wrapper
        iframe.classList.add('ht-responsive-iframe');
        iframe.setAttribute('loading', 'lazy');
      }
    });

    // Enhance all images: lazy loading, async decoding, graceful error handling
    const images = Array.from(container.querySelectorAll('img'));
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      img.addEventListener('error', function() {
        this.style.display = 'none';
        const parentFigure = this.closest('figure');
        if (parentFigure) {
          parentFigure.style.display = 'none';
        }
      });
    });
  }

  window.BackyardMedia = {
    enhanceContainerMedia,
    createYouTubeFacade,
    createAppleMusicFacade
  };
})();
