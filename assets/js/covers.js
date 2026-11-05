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

  // The whole moon-cycle is ornamental: it never locks chapters or stores data.
  const moonIcons = [];
  const moonNamespace = 'http://www.w3.org/2000/svg';
  const moonElement = (name, attributes={}) => {
    const e = document.createElementNS(moonNamespace, name);
    Object.entries(attributes).forEach(([key,val]) => e.setAttribute(key,String(val)));
    return e;
  };
  const attachMoon = card => {
    if (card.querySelector('.moon-phase-ornament')) return;
    const ornament = document.createElement('span');
    ornament.className = 'moon-phase-ornament';
    ornament.setAttribute('aria-hidden','true');
    const svg = moonElement('svg',{viewBox:'0 0 100 100',focusable:'false'});
    const dark = moonElement('circle',{cx:50,cy:50,r:39,fill:'#2b2837',stroke:'#85765f','stroke-width':1.1});
    const lit = moonElement('path',{fill:'#f0dfbd'});
    const rim = moonElement('circle',{cx:50,cy:50,r:39,fill:'none',stroke:'#d5ba88','stroke-opacity':'.55','stroke-width':'.8'});
    svg.append(dark,lit,rim);
    const caption = document.createElement('span');
    caption.className = 'moon-cycle-caption';
    caption.textContent = '☾ 月相';
    ornament.append(svg,caption);
    card.append(ornament);
    moonIcons.push(lit);
    drawMoonPhase(lit,.14);
    startMoonCycle();
  };
  function drawMoonPhase(path, phase) {
    const radius=39, steps=44, wave=Math.cos(phase*2*Math.PI);
    const waxing=phase < .5;
    const points=[];
    const xAt=(i,part)=>{
      const y=-1+2*i/steps;
      const half=Math.sqrt(Math.max(0,1-y*y))*radius;
      const edge=part==='right'?half:-half;
      const terminator=half*(waxing?wave:-wave);
      return [50+(part==='term'?terminator:edge),50+y*radius];
    };
    if(waxing) {
      for(let i=0;i<=steps;i++)points.push(xAt(i,'right'));
      for(let i=steps;i>=0;i--)points.push(xAt(i,'term'));
    } else {
      for(let i=0;i<=steps;i++)points.push(xAt(i,'term'));
      for(let i=steps;i>=0;i--)points.push(xAt(i,'left'));
    }
    path.setAttribute('d',points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join(' ')+' Z');
  }
  let moonLoopStarted=false;
  function startMoonCycle() {
    if(moonLoopStarted)return;
    moonLoopStarted=true;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const start=performance.now();
    let last=-Infinity;
    function tick(now){
      if(now-last>=45) {
        // Starts as a waxing crescent, grows to full, wanes back to new.
        const phase=((now-start)/20000+.14)%1;
        for(const icon of moonIcons)drawMoonPhase(icon,phase);
        last=now;
      }
      window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  const applyCover = (card, path) => {
    if (!card || !path) return;
    preload(path, img => {
      img.className = 'volume-cover-image';
      img.alt = '';
      img.loading = 'lazy';
      card.prepend(img);
      card.classList.add('with-cover');
      attachMoon(card);
    });
  };
  // The featured-book carousel is independent of reading progress and device.
  const setupFeaturedCarousel = (volumes) => {
    const book = document.getElementById('featured-book');
    const prev = document.getElementById('featured-prev');
    const next = document.getElementById('featured-next');
    const caption = document.getElementById('featured-status');
    const link = document.getElementById('featured-read');
    const label = document.getElementById('featured-read-label');
    if (!book || !prev || !next || !caption || !link || !label) return;

    const items = volumes
      .filter(v => v && v.status === 'published' && Number.isInteger(Number(v.number))
        && /^volume-\d{2}\.html$/.test(v.path || '')
        )
      .sort((a,b) => Number(a.number)-Number(b.number));
    if (!items.length) return;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coverFor = v => permittedPath(v.hero_image) || permittedPath(v.cover_image);
    let index = items.length - 1;
    let busy = false;
    let image = book.querySelector('.official-cover-image');
    if (!image) {
      image = document.createElement('img');
      image.className = 'official-cover-image';
      book.append(image);
    }
    book.classList.add('has-official-cover','featured-book');

    const paint = () => {
      const item = items[index];
      const coverPath = coverFor(item);
      if (coverPath) {
        image.src = coverPath;
        image.alt = item.title + '正式封面';
        image.style.display = 'block';
        book.classList.add('has-official-cover');
      } else {
        image.removeAttribute('src');
        image.alt = '';
        image.style.display = 'none';
        book.classList.remove('has-official-cover');
      }
      const edition = book.querySelector('.book-bottom');
      const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
      if (edition) edition.textContent = 'VOL. ' + (roman[Number(item.number)-1] || item.number);
      link.href = item.path;
      label.textContent = '阅读' + item.title;
      link.setAttribute('aria-label','阅读'+item.title);
      caption.textContent = String(item.number).padStart(2,'0') + ' / '
        + String(items.length).padStart(2,'0') + ' · ' + item.title;
    };
    const move = step => {
      if (busy || items.length < 2) return;
      index = (index + step + items.length) % items.length;
      if (reducedMotion) { paint(); return; }
      busy = true;
      prev.disabled = true;
      next.disabled = true;
      book.classList.remove('hero-flip-in');
      book.classList.add('hero-flip-out');
      window.setTimeout(() => {
        paint();
        book.classList.remove('hero-flip-out');
        book.classList.add('hero-flip-in');
        window.setTimeout(() => {
          book.classList.remove('hero-flip-in');
          prev.disabled = false;
          next.disabled = false;
          busy = false;
        }, 430);
      }, 260);
    };

    // Default to the latest published volume every visit.
    paint();
    if (items.length > 1) {
      prev.hidden = false;
      next.hidden = false;
      prev.addEventListener('click', () => move(-1));
      next.addEventListener('click', () => move(1));
    } else {
      prev.hidden = true;
      next.hidden = true;
    }
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
      // Resolve the volume from its actual link, not its position on the shelf.
      // Volume 00 precedes Volume 01, so index + 1 would shift every cover.
      document.querySelectorAll('.volume-card').forEach(card => {
        const href = card.getAttribute('href') || '';
        const cardMatch = href.match(/^volume-(\d{2})\.html$/);
        if (!cardMatch) return;
        const item = byNumber.get(Number(cardMatch[1]));
        if (!item) return;
        if (item.status !== 'published' && item.cover_revealed !== true) return;
        applyCover(card, permittedPath(item.cover_image));
      });
      setupFeaturedCarousel(data.volumes);
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
