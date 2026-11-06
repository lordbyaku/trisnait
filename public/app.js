import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const params = new URLSearchParams(location.search);
const PREVIEW = params.has('preview');
const isTouch = matchMedia('(pointer: coarse)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !!window.gsap;
if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

// ---------- utils ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// **teks** -> highlight warna aksen, baris baru -> <br>
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>').replace(/\n/g, '<br>');
const safeUrl = u => { const s = String(u ?? '').trim(); return /^(javascript|data|vbscript):/i.test(s) ? '#' : s; };
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ICONS = {
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
  x: '<path d="M4 4l11.7 16H20L8.3 4z"/><path d="M4 20l6.8-6.8M20 4l-6.8 6.8"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>',
  dribbble: '<circle cx="12" cy="12" r="10"/><path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32M8.56 2.75c4.37 6 6 9.42 8 17.72"/>',
  behance: '<path d="M3 6h5a3 3 0 0 1 0 6H3zM3 12h6a3 3 0 0 1 0 6H3zM14 7h6M13.5 14.5h7a3.5 3.5 0 1 0-.8 2.3"/>',
  tiktok: '<path d="M16 3c.3 2.4 1.9 4 4.5 4.3V11a8 8 0 0 1-4.5-1.4V15a6 6 0 1 1-6-6v3.6A2.5 2.5 0 1 0 12.5 15V3z"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  whatsapp: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
  web: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.web}</svg>`;

// ---------- data ----------
async function loadContent() {
  if (PREVIEW) {
    try { const d = localStorage.getItem('portfolio_draft'); if (d) return JSON.parse(d); } catch {}
  }
  const r = await fetch('/api/content', { cache: 'no-store' });
  return r.json();
}

function applyTheme(c) {
  const t = c.theme || {}, root = document.documentElement.style;
  const map = { bg: '--bg', bg2: '--bg2', text: '--text', muted: '--muted', accent: '--accent', accent2: '--accent2' };
  for (const [k, v] of Object.entries(map)) if (t[k]) root.setProperty(v, t[k]);
  root.setProperty('--radius', (t.radius ?? 18) + 'px');
  const fonts = [t.fontHeading, t.fontBody].filter(Boolean);
  if (fonts.length) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + [...new Set(fonts)].map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700`).join('&') + '&display=swap';
    document.head.appendChild(link);
    if (t.fontHeading) root.setProperty('--font-h', `'${t.fontHeading}', system-ui, sans-serif`);
    if (t.fontBody) root.setProperty('--font-b', `'${t.fontBody}', system-ui, sans-serif`);
  }
  $('#custom-css').textContent = t.customCss || '';
  document.body.classList.toggle('has-grain', !!t.grain);

  const s = c.site || {};
  document.title = s.title || 'Portfolio';
  $('meta[name="description"]').content = s.description || '';
  if (s.favicon) $('link[rel="icon"]').href = s.favicon;
  if (s.ogImage) {
    const m = document.createElement('meta'); m.setAttribute('property', 'og:image'); m.content = s.ogImage; document.head.appendChild(m);
  }
}

// ---------- section renderers ----------
const R = {
  hero(h) {
    const name = w => `<span class="line"><span>${esc(w)}</span></span>`;
    const roles = (h.roles || []).filter(Boolean);
    return `<section class="hero" data-sec="hero">
      <canvas class="hero-canvas" id="hero-canvas"></canvas>
      <div class="hero-left">
        <p class="hero-greet">${esc(h.greeting)}</p>
        <h1 class="hero-name">${name(h.firstName)}${name(h.lastName)}</h1>
      </div>
      <div class="hero-right">
        <p class="hero-prefix">${esc(h.rolePrefix)}</p>
        <div class="hero-roles">${roles.map((r, i) => `<span class="hero-role${i === 0 ? ' in' : ''}">${esc(r)}</span>`).join('')}</div>
        ${h.subtitle ? `<p class="hero-sub">${rich(h.subtitle)}</p>` : ''}
      </div>
      <div class="scroll-hint">Scroll</div>
    </section>`;
  },
  about(a) {
    const words = rich(a.body).split(/(<span class="hl">.*?<\/span>|<br>|\s+)/).filter(Boolean)
      .map(w => /^\s+$/.test(w) || w === '<br>' ? w : `<span class="word">${w}</span>`).join('');
    return `<section class="about" data-sec="about">
      <div class="about-inner${a.image ? ' with-img' : ''}">
        ${a.image ? `<div class="about-img reveal"><img src="${esc(safeUrl(a.image))}" alt="" loading="lazy"></div>` : ''}
        <div><h2 class="kicker reveal">${esc(a.heading)}</h2><p class="about-text">${words}</p></div>
      </div>
    </section>`;
  },
  services(s) {
    return `<section class="services" data-sec="services">
      <h2 class="title reveal">${esc(s.heading)}<span class="accent">${esc(s.headingAccent)}</span></h2>
      <div class="svc-list">${(s.items || []).map(it => `
        <article class="svc reveal">
          <h3>${esc(it.title)}</h3>
          <h4>${esc(it.subtitle)}</h4>
          <p>${rich(it.description)}</p>
          ${(it.tags || []).length ? `<div class="svc-tags-label">${esc(it.tagsLabel)}</div>
          <div class="tags">${it.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        </article>`).join('')}
      </div>
    </section>`;
  },
  experience(e) {
    return `<section class="experience" data-sec="experience">
      <h2 class="title reveal" style="text-align:center">${esc(e.heading)} <span class="accent">${esc(e.headingAccent)}</span></h2>
      <div class="exp-wrap">
        <div class="exp-line"><span></span></div>
        ${(e.items || []).map(it => `
          <div class="exp-item reveal">
            <div><h3>${esc(it.role)}</h3><h4>${esc(it.company)}</h4></div>
            <div class="exp-year">${esc(it.year)}</div>
            <p>${rich(it.description)}</p>
          </div>`).join('')}
      </div>
    </section>`;
  },
  projects(p) {
    return `<section class="projects" data-sec="projects">
      <h2 class="title reveal">${esc(p.heading)} <span class="accent" style="display:inline">${esc(p.headingAccent)}</span></h2>
      <div class="proj-track">${(p.items || []).map((it, i) => `
        <article class="proj">
          <div class="proj-head">
            <span class="proj-num">${String(i + 1).padStart(2, '0')}</span>
            <div><h3>${esc(it.title)}</h3><div class="proj-cat">${esc(it.category)}</div></div>
          </div>
          <div class="proj-tools-label">Tools & features</div>
          <div class="proj-tools">${esc(it.tools)}</div>
          <a class="proj-img" href="${esc(safeUrl(it.link) || '#')}" target="_blank" rel="noopener" style="--c:${esc(it.color || 'var(--accent)')}">
            ${it.image ? `<img src="${esc(safeUrl(it.image))}" alt="${esc(it.title)}" loading="lazy">` : `<div class="proj-ph">${esc(it.title)}</div>`}
          </a>
        </article>`).join('')}
      </div>
    </section>`;
  },
  techstack(t) {
    return `<section class="techstack" data-sec="techstack">
      <canvas class="tech-canvas" id="tech-canvas"></canvas>
      <h2 class="title reveal">${esc(t.heading)} <span class="accent" style="display:inline">${esc(t.headingAccent)}</span></h2>
      ${t.hint ? `<p class="tech-hint">${esc(t.hint)}</p>` : ''}
    </section>`;
  },
  contact(c) {
    return `<section class="contact" data-sec="contact">
      <h2 class="title reveal">${esc(c.heading)}</h2>
      <div class="contact-grid">
        <div class="reveal">
          <h4>${esc(c.connectLabel)}</h4>
          ${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}
          ${c.phone ? `<a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a>` : ''}
          ${c.location ? `<p>${esc(c.location)}</p>` : ''}
        </div>
        <div class="reveal contact-social">
          <h4>${esc(c.socialLabel)}</h4>
          ${(c.socials || []).map(s => `<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener">${icon(s.icon)}${esc(s.label)}</a>`).join('')}
        </div>
        <div class="reveal credit">${esc(c.creditPrefix)} <b>${esc(c.creditName)}</b><small>${esc(c.copyright)}</small></div>
      </div>
    </section>`;
  }
};

function renderChrome(c) {
  const nav = c.nav || {}, s = c.site || {}, socials = c.contact?.socials || [];
  const visible = new Set((c.layout?.sections || []).filter(x => x.visible).map(x => x.id));
  $('#nav').innerHTML = `
    <a class="nav-logo" href="#hero">${esc(s.logoText)}</a>
    ${s.headerEmail ? `<a class="nav-email" href="mailto:${esc(s.headerEmail)}">${esc(s.headerEmail)}</a>` : ''}
    <ul class="nav-links">${(nav.items || []).filter(i => visible.has(i.target)).map(i => `<li><a href="#${esc(i.target)}">${esc(i.label)}</a></li>`).join('')}</ul>`;
  $('#fixed-socials').innerHTML = nav.showFixedSocials
    ? socials.map(x => `<a href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener" aria-label="${esc(x.label)}">${icon(x.icon)}</a>`).join('') : '';
  const rb = $('#resume-btn');
  if (nav.resumeLabel && nav.resumeUrl) { rb.href = safeUrl(nav.resumeUrl); rb.innerHTML = `${esc(nav.resumeLabel)} <span>↗</span>`; }
  else rb.innerHTML = '';
}

function renderSections(c) {
  const order = c.layout?.sections || Object.keys(R).map(id => ({ id, visible: true }));
  $('#app').innerHTML = order.filter(s => s.visible && R[s.id] && c[s.id])
    .map(s => R[s.id](c[s.id]).replace('data-sec=', `id="${s.id}" data-sec=`)).join('');
}

// ---------- interactions ----------
function initCursor(enabled) {
  if (!enabled || isTouch) return;
  document.body.classList.add('has-cursor');
  const el = $('.cursor');
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  el.style.opacity = 0;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; el.style.opacity = 1; });
  document.addEventListener('pointerover', e => el.classList.toggle('big', !!e.target.closest('a, button, .proj-img')));
  (function loop() { x += (tx - x) * .18; y += (ty - y) * .18; el.style.transform = `translate(${x}px, ${y}px)`; requestAnimationFrame(loop); })();
}

function initRoles(ms) {
  const roles = $$('.hero-role');
  if (roles.length < 2) return;
  let i = 0;
  setInterval(() => {
    const cur = roles[i]; i = (i + 1) % roles.length; const next = roles[i];
    cur.classList.remove('in'); cur.classList.add('out');
    next.classList.remove('out'); void next.offsetWidth; next.classList.add('in');
    setTimeout(() => { cur.classList.remove('out'); }, 850);
  }, Math.max(1200, ms || 2600));
}

function initAnimations() {
  if (!hasGsap || reduceMotion) { $$('.about-text .word').forEach(w => w.style.opacity = 1); return; }
  gsap.from('.hero-name .line span', { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: .12, delay: .1 });
  gsap.from('.hero-greet, .hero-prefix, .hero-roles, .hero-sub', { y: 30, opacity: 0, duration: 1, stagger: .1, delay: .4 });
  gsap.from('#nav > *', { y: -20, opacity: 0, duration: .8, stagger: .1, delay: .3 });

  $$('.reveal').forEach(el => gsap.from(el, {
    y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' }
  }));

  const words = $$('.about-text .word');
  if (words.length) gsap.to(words, {
    opacity: 1, stagger: .05, ease: 'none',
    scrollTrigger: { trigger: '.about-text', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });

  const line = $('.exp-line span');
  if (line) gsap.to(line, { height: '100%', ease: 'none', scrollTrigger: { trigger: '.exp-wrap', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  const track = $('.proj-track');
  if (track) gsap.matchMedia().add('(min-width: 901px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + 80);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.projects', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true }
    });
  });
}

// ---------- hero 3D ----------
function makeRenderer(canvas) {
  try {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    return r;
  } catch { canvas.remove(); return null; }
}
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

function initHero3D(cfg = {}) {
  const canvas = $('#hero-canvas'); if (!canvas) return;
  const renderer = makeRenderer(canvas); if (!renderer) return;
  const accent = new THREE.Color(cssVar('--accent')), accent2 = new THREE.Color(cssVar('--accent2'));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100); camera.position.set(0, 0, 9);
  const group = new THREE.Group(); scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, .35));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(2, 4, 5); scene.add(key);
  const p1 = new THREE.PointLight(accent, 80, 40); p1.position.set(4, 2, 4); scene.add(p1);
  const p2 = new THREE.PointLight(accent2, 60, 40); p2.position.set(-4, -2, 3); scene.add(p2);
  const scale = Number(cfg.scale) || 1;
  group.scale.setScalar(scale);

  let blob = null, basePos = null, mixer = null;
  function buildShape() {
    let geo;
    switch (cfg.shape) {
      case 'knot': geo = new THREE.TorusKnotGeometry(1.1, .36, 260, 36); break;
      case 'torus': geo = new THREE.TorusGeometry(1.3, .5, 64, 180); break;
      case 'icosa': geo = new THREE.IcosahedronGeometry(1.6, 0); break;
      case 'sphere': geo = new THREE.SphereGeometry(1.5, 64, 64); break;
      default: {
        geo = new THREE.IcosahedronGeometry(1.3, 28); geo.deleteAttribute('uv'); geo.deleteAttribute('normal');
        geo = mergeVertices(geo); geo.computeVertexNormals();
        basePos = geo.attributes.position.array.slice();
      }
    }
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(cfg.color || '#2a1f33'), metalness: .5, roughness: .38, clearcoat: .6, clearcoatRoughness: .45,
      flatShading: cfg.shape === 'icosa'
    });
    const mesh = new THREE.Mesh(geo, mat); group.add(mesh);
    const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: .07 }));
    wire.scale.setScalar(1.015); group.add(wire);
    if (!cfg.shape || cfg.shape === 'blob') blob = geo;
  }

  if (cfg.type === 'glb' && cfg.glbUrl) {
    new GLTFLoader().load(cfg.glbUrl, gltf => {
      const m = gltf.scene, box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
      const s = 3.4 / Math.max(size.x, size.y, size.z || 1);
      m.scale.setScalar(s);
      m.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(s));
      group.add(m);
      // play only the first clip — Mixamo/AI exports often bundle several clips that would blend into a mess
      if (gltf.animations?.length) { mixer = new THREE.AnimationMixer(m); mixer.clipAction(gltf.animations[0]).play(); }
    }, undefined, () => buildShape());
  } else buildShape();

  if (cfg.particles !== false) {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 4 + Math.random() * 8, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph) - 4], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: accent, size: .035, transparent: true, opacity: .7 }));
    pts.name = 'particles'; scene.add(pts);
  }

  let mx = 0, my = 0, visible = true;
  if (cfg.followMouse !== false) addEventListener('pointermove', e => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = camera.aspect < .8 ? 14 : 9; // portrait: pull back so text stays readable
    camera.updateProjectionMatrix();
    group.position.y = innerWidth < 900 ? -.3 : 0;
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const dt = clock.getDelta(), t = clock.elapsedTime;
    if (mixer) mixer.update(dt);
    if (blob && !reduceMotion) {
      const a = blob.attributes.position.array;
      for (let i = 0; i < a.length; i += 3) {
        const x = basePos[i], y = basePos[i + 1], z = basePos[i + 2];
        const d = 1 + .12 * Math.sin(x * 1.8 + t) * Math.sin(y * 2.1 + t * 1.3) * Math.sin(z * 1.6 + t * .7);
        a[i] = x * d; a[i + 1] = y * d; a[i + 2] = z * d;
      }
      blob.attributes.position.needsUpdate = true; blob.computeVertexNormals();
    }
    const spin = cfg.autoRotate !== false && !reduceMotion ? t * .15 : 0;
    group.rotation.y += ((mx * .6 + spin) - group.rotation.y) * .05;
    group.rotation.x += ((my * .35) - group.rotation.x) * .05;
    const pts = scene.getObjectByName('particles'); if (pts) pts.rotation.y = t * .02;
    renderer.render(scene, camera);
  })();
}

// ---------- techstack balls ----------
function labelTexture(item, cb) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const draw = img => {
    g.clearRect(0, 0, 256, 256);
    if (img) { const s = 130; g.drawImage(img, 128 - s / 2, 128 - s / 2, s, s); }
    else {
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let fs = 64; g.font = `700 ${fs}px ${cssVar('--font-h') || 'sans-serif'}`;
      while (g.measureText(item.name).width > 190 && fs > 20) { fs -= 4; g.font = `700 ${fs}px ${cssVar('--font-h') || 'sans-serif'}`; }
      g.fillText(item.name, 128, 132);
    }
  };
  draw(null);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  if (item.icon) { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => { draw(img); tex.needsUpdate = true; }; img.src = item.icon; }
  return tex;
}

function initTech(items = []) {
  const canvas = $('#tech-canvas'); if (!canvas || !items.length) return;
  const renderer = makeRenderer(canvas); if (!renderer) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100); camera.position.z = 24;
  scene.add(new THREE.AmbientLight(0xffffff, .9));
  const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(4, 6, 10); scene.add(dl);
  const rim = new THREE.PointLight(new THREE.Color(cssVar('--accent')), 120, 60); rim.position.set(-8, -6, 6); scene.add(rim);

  let visW = 10, visH = 10;
  const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
  const balls = items.map((it, i) => {
    const mesh = new THREE.Mesh(sphereGeo, new THREE.MeshPhysicalMaterial({ color: new THREE.Color(it.color || '#333'), roughness: .3, metalness: .1, clearcoat: .8 }));
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(it), transparent: true, depthTest: false }));
    sprite.scale.setScalar(1.6); sprite.renderOrder = 2; // z=0 keeps label centered (no perspective drift)
    mesh.add(sprite); scene.add(mesh);
    return { mesh, r: 1, x: 0, y: 0, vx: 0, vy: 0, seed: i };
  });

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; visW = visH * camera.aspect;
    const base = Math.min(2.3, Math.sqrt((visW * visH * .22) / (balls.length * Math.PI)));
    balls.forEach((b, i) => { b.r = base * (.8 + ((i * 37) % 10) / 22); b.mesh.scale.setScalar(b.r); });
  }
  function drop() {
    balls.forEach((b, i) => { b.x = (Math.random() - .5) * visW * .8; b.y = visH * (.7 + Math.random() * .8); b.vx = 0; b.vy = 0; });
  }
  addEventListener('resize', layout); layout(); drop();

  let mx = 9999, my = 9999, active = false, started = false;
  canvas.parentElement.addEventListener('pointermove', e => {
    const rect = canvas.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width - .5) * visW; my = -((e.clientY - rect.top) / rect.height - .5) * visH;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { mx = my = 9999; });
  new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active && !started) { started = true; drop(); } }, { threshold: .2 }).observe(canvas);

  (function loop() {
    requestAnimationFrame(loop);
    if (!active) return;
    const cy = -visH * .08;
    for (const b of balls) {
      b.vx += -b.x * .004; b.vy += (cy - b.y) * .004;
      const dx = b.x - mx, dy = b.y - my, d = Math.hypot(dx, dy), R = b.r + 2.2;
      if (d < R && d > 0) { const f = (R - d) / R * .35; b.vx += dx / d * f; b.vy += dy / d * f; }
      b.vx *= .9; b.vy *= .9; b.x += b.vx; b.y += b.vy;
    }
    for (let k = 0; k < 3; k++) for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .001, min = a.r + b.r;
      if (d < min) { const o = (min - d) / 2, nx = dx / d, ny = dy / d; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; }
    }
    const t = performance.now() / 1000;
    for (const b of balls) {
      b.mesh.position.set(b.x, b.y, Math.sin(t + b.seed) * .3);
      b.mesh.rotation.y = Math.sin(t * .5 + b.seed) * .3;
    }
    renderer.render(scene, camera);
  })();
}

// ---------- loader ----------
function runLoader(c) {
  return new Promise(resolve => {
    const s = c.site || {};
    if (!s.showLoader || PREVIEW) return resolve();
    const el = $('#loader'); el.hidden = false;
    $('.loader-logo').textContent = s.logoText || '';
    $('.loader-label').textContent = s.loaderText || '';
    let p = 0;
    const tick = setInterval(() => {
      p = Math.min(100, p + Math.random() * 14 + 4);
      $('.loader-pct').textContent = Math.floor(p) + '%';
      $('.loader-bar span').style.width = p + '%';
      if (p >= 100) {
        clearInterval(tick);
        if (hasGsap) gsap.to(el, { yPercent: -100, duration: .9, ease: 'power4.inOut', delay: .2, onComplete: () => { el.hidden = true; } });
        else el.hidden = true;
        setTimeout(resolve, 350);
      }
    }, 90);
  });
}

// ---------- boot ----------
(async function boot() {
  let c;
  try { c = await loadContent(); } catch (e) { $('#app').innerHTML = '<p style="padding:40px">Gagal memuat konten.</p>'; return; }
  applyTheme(c);
  renderChrome(c);
  renderSections(c);
  initCursor(c.site?.customCursor);
  const contactEl = $('#contact');
  if (contactEl) new IntersectionObserver(([e]) => $('#fixed-socials').classList.toggle('away', e.isIntersecting), { threshold: .15 }).observe(contactEl);
  await runLoader(c);
  initRoles(c.hero?.roleInterval);
  initAnimations();
  try { initHero3D(c.hero?.model); } catch (e) { console.warn('hero3d', e); }
  try { initTech(c.techstack?.items); } catch (e) { console.warn('tech', e); }

  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) {
    requestAnimationFrame(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); target.scrollIntoView({ behavior: 'instant' }); });
  } else if (PREVIEW) {
    const y = Number(sessionStorage.getItem('preview_scroll') || 0);
    requestAnimationFrame(() => { scrollTo({ top: y, behavior: 'instant' }); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
    addEventListener('scroll', () => sessionStorage.setItem('preview_scroll', String(scrollY)), { passive: true });
  }
})();
