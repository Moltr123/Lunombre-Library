/* Cover-aware presentation. The original moon-themed layout remains visible
   until a published volume has a valid cover image in volumes.json. */
(() => {
  const permittedPath = value => {
    if (typeof value !== 'string' || !value || value.includes('..')) return '';
    return /^assets\/(covers|hero)\/[a-zA-Z0-9_\/-]+\.(?:webp|png|jpe?g|avif)$/.test(value) ? value : '';
  };
  const preload = (path, done) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => done(img);
    img.onerror = () => {}; // Missing artwork? Leave the elegant original layout.
    img.src = path;
  };
  const applyCover = (card, path) => {
    if (!card || !path) return;
    preload(path, img => {
      img.className = 'volume-cover-image';
      img.alt = '';
      img.loading = 'lazy';
      card.prepend(img);
      card.classList.add('with-cover');
    });
  };
  const applyHero = path => {
    const book = document.querySelector('.hero-art .book');
    if (!book || !path) return;
    preload(path, img => {
      img.className = 'official-cover-image';
      img.alt = '当前主推书卷的正式封面';
      book.append(img);
      book.classList.add('has-official-cover');
    });
  };
  const applyReader = path => {
    const cover = document.querySelector('header.cover');
    if (!cover || !path) return;
    preload(path, img => {
      const figure = document.createElement('figure');
      figure.className = 'reader-art';
      img.alt = '本卷正式封面';
      figure.append(img);
      cover.prepend(figure);
      cover.classList.add('with-official-art');
    });
  };
  fetch('volumes.json', {cache:'no-store'})
    .then(response => {
      if (!response.ok) throw new Error('Manifest unavailable');
      return response.json();
    })
    .then(data => {
      if (!Array.isArray(data.volumes)) return;
      const byNumber = new Map(data.volumes.map(v => [Number(v.number), v]));
      document.querySelectorAll('.volume-card').forEach((card, index) => {
        const item = byNumber.get(index + 1);
        if (!item) return;
        if (item.status !== 'published' && item.cover_revealed !== true) return;
        applyCover(card, permittedPath(item.cover_image));
      });
      const featured = byNumber.get(Number(data.featured_volume || 1));
      if (featured && featured.status === 'published') {
        applyHero(permittedPath(featured.hero_image) || permittedPath(featured.cover_image));
      }
      const match = location.pathname.match(/volume-(\d{2})\.html$/);
      if (match) {
        const item = byNumber.get(Number(match[1]));
        if (item && item.status === 'published') {
          applyReader(permittedPath(item.cover_image));
        }
      }
    })
    .catch(() => {}); // Reader and site still work offline or without metadata.
})();
