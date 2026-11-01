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
