// Portfolio CMS — dashboard (vanilla JS, schema-driven forms)
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const SECTION_IDS = [['hero', 'Hero'], ['about', 'About'], ['services', 'What I Do'], ['experience', 'Career'], ['projects', 'Work'], ['techstack', 'Tech Stack'], ['contact', 'Contact']];
  const ICON_OPTS = ['github', 'linkedin', 'instagram', 'x', 'youtube', 'dribbble', 'behance', 'tiktok', 'facebook', 'whatsapp', 'mail', 'web'].map(v => [v, v]);
  const FONT_HINT = 'Nama font Google Fonts persis, contoh: Inter, Geist, Poppins, Space Grotesk, Syne, Plus Jakarta Sans';
  const RICH_HINT = 'Tip: apit kata dengan **dua bintang** untuk warna aksen. Enter = baris baru.';

  // ---------- SCHEMA: semua yang bisa diedit ----------
  // field types: text, textarea, color, image, file, number, toggle, select, tags, lines, list, code
  const SCHEMA = [
    { grp: 'Umum' },
    { id: 'site', icon: '⚙', label: 'Situs & SEO', desc: 'Judul tab, deskripsi Google, logo, loader dan kursor.', fields: [
      { k: 'title', t: 'text', l: 'Judul situs (tab browser & SEO)' },
      { k: 'description', t: 'textarea', l: 'Meta description', h: 'Muncul di hasil pencarian Google. Idealnya 120–160 karakter.' },
      { row: [{ k: 'logoText', t: 'text', l: 'Teks logo (pojok kiri atas)' }, { k: 'headerEmail', t: 'text', l: 'Email di header', h: 'Kosongkan untuk menyembunyikan' }] },
      { row: [{ k: 'favicon', t: 'image', l: 'Favicon' }, { k: 'ogImage', t: 'image', l: 'Gambar share (OG image)', h: 'Ukuran 1200×630' }] },
      { row: [{ k: 'showLoader', t: 'toggle', l: 'Tampilkan loading screen' }, { k: 'loaderText', t: 'text', l: 'Teks loader' }] },
      { k: 'customCursor', t: 'toggle', l: 'Kursor custom (lingkaran mengikuti mouse)' }
    ]},
    { id: 'theme', icon: '🎨', label: 'Tema & Warna', desc: 'Warna, font, radius sudut, efek grain, dan CSS tambahan.', fields: [
      { row: [{ k: 'bg', t: 'color', l: 'Background utama' }, { k: 'bg2', t: 'color', l: 'Background kartu' }] },
      { row: [{ k: 'text', t: 'color', l: 'Warna teks' }, { k: 'muted', t: 'color', l: 'Teks sekunder' }] },
      { row: [{ k: 'accent', t: 'color', l: 'Aksen 1' }, { k: 'accent2', t: 'color', l: 'Aksen 2 (gradien)' }] },
      { row: [{ k: 'fontHeading', t: 'text', l: 'Font judul', h: FONT_HINT }, { k: 'fontBody', t: 'text', l: 'Font isi' }] },
      { row: [{ k: 'radius', t: 'number', l: 'Radius sudut (px)', min: 0, max: 48 }, { k: 'grain', t: 'toggle', l: 'Efek film grain' }] },
      { k: 'customCss', t: 'code', l: 'Custom CSS (lanjutan)', h: 'CSS bebas yang ditambahkan ke situs. Contoh: .hero-name { letter-spacing: -.05em }' }
    ]},
    { id: 'layout', icon: '☰', label: 'Urutan Section', desc: 'Atur urutan (▲▼) dan tampilkan/sembunyikan tiap section.', fields: [
      { k: 'sections', t: 'list', l: 'Section', fixed: true, title: it => it.label + (it.visible ? '' : ' (disembunyikan)'), hiddenFlag: 'visible', item: [
        { k: 'label', t: 'text', l: 'Nama (hanya label di dashboard)' },
        { k: 'visible', t: 'toggle', l: 'Tampilkan di situs' }
      ]}
    ]},
    { id: 'nav', icon: '🧭', label: 'Navigasi', desc: 'Menu di header, tombol resume, dan ikon sosial melayang.', fields: [
      { k: 'items', t: 'list', l: 'Menu', title: it => it.label || '(tanpa label)', newItem: () => ({ label: 'Menu', target: 'about' }), item: [
        { row: [{ k: 'label', t: 'text', l: 'Label' }, { k: 'target', t: 'select', l: 'Scroll ke section', opts: SECTION_IDS }] }
      ]},
      { row: [{ k: 'resumeLabel', t: 'text', l: 'Label tombol resume', h: 'Kosongkan untuk menyembunyikan' }, { k: 'resumeUrl', t: 'file', l: 'File / link resume (PDF)' }] },
      { k: 'showFixedSocials', t: 'toggle', l: 'Ikon sosial melayang di kiri bawah (diambil dari Contact → Social)' }
    ]},
    { grp: 'Konten' },
    { id: 'hero', icon: '★', label: 'Hero', desc: 'Bagian pertama: nama, peran, dan objek 3D.', fields: [
      { k: 'greeting', t: 'text', l: 'Sapaan' },
      { row: [{ k: 'firstName', t: 'text', l: 'Nama depan (baris 1)' }, { k: 'lastName', t: 'text', l: 'Nama belakang (baris 2)' }] },
      { k: 'rolePrefix', t: 'text', l: 'Teks sebelum peran', h: 'Contoh: "A Creative"' },
      { k: 'roles', t: 'lines', l: 'Peran yang bergantian (satu per baris)' },
      { k: 'roleInterval', t: 'number', l: 'Jeda ganti peran (ms)', min: 1200, step: 100 },
      { k: 'subtitle', t: 'textarea', l: 'Subjudul', h: RICH_HINT },
      { card: 'Objek 3D', path: 'model', fields: [
        { row: [{ k: 'type', t: 'select', l: 'Jenis', opts: [['shape', 'Bentuk bawaan'], ['glb', 'Model 3D sendiri (.glb)']] },
                { k: 'shape', t: 'select', l: 'Bentuk bawaan', opts: [['blob', 'Blob bergerak'], ['knot', 'Torus knot'], ['torus', 'Donat'], ['icosa', 'Kristal'], ['sphere', 'Bola']] }] },
        { k: 'glbUrl', t: 'file', l: 'File model .glb', h: 'Upload karakter/objek 3D .glb (mis. dari MetaPerson, Avaturn, Meshy/Tripo, Sketchfab, Blender + Mixamo). Idealnya < 10 MB. Dipakai jika Jenis = Model 3D sendiri. Jika file punya beberapa animasi, yang pertama diputar.' },
        { row: [{ k: 'color', t: 'color', l: 'Warna bentuk bawaan' }, { k: 'scale', t: 'number', l: 'Skala', step: .1, min: .2, max: 3 }] },
        { row: [{ k: 'autoRotate', t: 'toggle', l: 'Berputar otomatis' }, { k: 'followMouse', t: 'toggle', l: 'Mengikuti mouse' }] },
        { k: 'particles', t: 'toggle', l: 'Partikel bintang di latar' }
      ]}
    ]},
    { id: 'about', icon: '👤', label: 'About', desc: 'Paragraf perkenalan. Kata-kata akan "menyala" saat di-scroll.', fields: [
      { k: 'heading', t: 'text', l: 'Judul kecil' },
      { k: 'body', t: 'textarea', l: 'Isi', h: RICH_HINT, rows: 6 },
      { k: 'image', t: 'image', l: 'Foto (opsional)' }
    ]},
    { id: 'services', icon: '◧', label: 'What I Do', desc: 'Layanan/keahlian dalam bentuk kartu.', fields: [
      { row: [{ k: 'heading', t: 'text', l: 'Judul' }, { k: 'headingAccent', t: 'text', l: 'Judul (warna aksen)' }] },
      { k: 'items', t: 'list', l: 'Kartu', title: it => it.title, newItem: () => ({ title: 'Baru', subtitle: '', description: '', tagsLabel: 'Skillset & tools', tags: [] }), item: [
        { row: [{ k: 'title', t: 'text', l: 'Judul' }, { k: 'subtitle', t: 'text', l: 'Subjudul' }] },
        { k: 'description', t: 'textarea', l: 'Deskripsi', h: RICH_HINT },
        { k: 'tagsLabel', t: 'text', l: 'Label tag' },
        { k: 'tags', t: 'tags', l: 'Tag (pisahkan dengan koma)' }
      ]}
    ]},
    { id: 'experience', icon: '⌛', label: 'Career', desc: 'Timeline pengalaman kerja.', fields: [
      { row: [{ k: 'heading', t: 'text', l: 'Judul' }, { k: 'headingAccent', t: 'text', l: 'Judul (warna aksen)' }] },
      { k: 'items', t: 'list', l: 'Pengalaman', title: it => `${it.year} — ${it.role}`, newItem: () => ({ role: 'Posisi', company: 'Perusahaan', year: String(new Date().getFullYear()), description: '' }), item: [
        { row: [{ k: 'role', t: 'text', l: 'Posisi' }, { k: 'company', t: 'text', l: 'Perusahaan' }] },
        { k: 'year', t: 'text', l: 'Tahun', h: 'Bebas: 2024, 2022–2024, NOW' },
        { k: 'description', t: 'textarea', l: 'Deskripsi', h: RICH_HINT }
      ]}
    ]},
    { id: 'projects', icon: '▦', label: 'Work / Proyek', desc: 'Karya yang tampil di carousel horizontal.', fields: [
      { row: [{ k: 'heading', t: 'text', l: 'Judul' }, { k: 'headingAccent', t: 'text', l: 'Judul (warna aksen)' }] },
      { k: 'items', t: 'list', l: 'Proyek', title: it => it.title, newItem: () => ({ title: 'Proyek baru', category: '', tools: '', image: '', link: '#', color: '#c481ff' }), item: [
        { row: [{ k: 'title', t: 'text', l: 'Nama proyek' }, { k: 'category', t: 'text', l: 'Kategori' }] },
        { k: 'tools', t: 'text', l: 'Tools & fitur' },
        { k: 'image', t: 'image', l: 'Gambar / screenshot', h: 'Rasio 16:11 disarankan. Kosong = kartu warna.' },
        { row: [{ k: 'link', t: 'text', l: 'Link proyek' }, { k: 'color', t: 'color', l: 'Warna kartu (jika tanpa gambar)' }] }
      ]}
    ]},
    { id: 'techstack', icon: '●', label: 'Tech Stack', desc: 'Bola 3D interaktif yang bisa didorong kursor.', fields: [
      { row: [{ k: 'heading', t: 'text', l: 'Judul' }, { k: 'headingAccent', t: 'text', l: 'Judul (warna aksen)' }] },
      { k: 'hint', t: 'text', l: 'Teks petunjuk' },
      { k: 'items', t: 'list', l: 'Teknologi', title: it => it.name, newItem: () => ({ name: 'Baru', color: '#444444', icon: '' }), item: [
        { row: [{ k: 'name', t: 'text', l: 'Nama' }, { k: 'color', t: 'color', l: 'Warna bola' }] },
        { k: 'icon', t: 'image', l: 'Logo (opsional, PNG/SVG transparan)', h: 'Jika diisi, logo menggantikan teks nama.' }
      ]}
    ]},
    { id: 'contact', icon: '✉', label: 'Contact & Footer', desc: 'Kontak, akun sosial media, dan kredit footer.', fields: [
      { k: 'heading', t: 'text', l: 'Judul' },
      { row: [{ k: 'connectLabel', t: 'text', l: 'Label kolom kontak' }, { k: 'socialLabel', t: 'text', l: 'Label kolom sosial' }] },
      { row: [{ k: 'email', t: 'text', l: 'Email' }, { k: 'phone', t: 'text', l: 'Telepon / WA' }] },
      { k: 'location', t: 'text', l: 'Lokasi' },
      { k: 'socials', t: 'list', l: 'Sosial media', title: it => it.label, newItem: () => ({ label: 'Baru', icon: 'web', url: 'https://' }), item: [
        { row: [{ k: 'label', t: 'text', l: 'Label' }, { k: 'icon', t: 'select', l: 'Ikon', opts: ICON_OPTS }] },
        { k: 'url', t: 'text', l: 'URL' }
      ]},
      { row: [{ k: 'creditPrefix', t: 'text', l: 'Teks kredit' }, { k: 'creditName', t: 'text', l: 'Nama di kredit' }] },
      { k: 'copyright', t: 'text', l: 'Copyright' }
    ]},
    { grp: 'Sistem' },
    { id: 'media', icon: '🖼', label: 'Media Library', desc: 'Semua file yang sudah di-upload.', custom: renderMedia },
    { id: 'backup', icon: '⟲', label: 'Backup & Import', desc: 'Setiap simpan otomatis membuat backup. Pulihkan, ekspor, atau impor konten.', custom: renderBackup },
    { id: 'account', icon: '🔒', label: 'Akun & Keamanan', desc: 'Ganti password dashboard.', custom: renderAccount }
  ];
  const SECTIONS = SCHEMA.filter(s => s.id);

  // ---------- state ----------
  let content = null, dirty = false, current = 'site', previewOn = true;

  // ---------- api ----------
  async function api(url, opts = {}) {
    const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', ...opts, body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && !url.includes('login')) { showLogin(); throw new Error('Sesi habis, silakan login lagi'); }
    if (!r.ok) throw new Error(data.error || `Error ${r.status}`);
    return data;
  }
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.className = 'toast' + (err ? ' err' : ''), 2600);
  }
  function fileToDataUrl(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
  async function upload(file) {
    if (file.size > 18 * 1024 * 1024) throw new Error('File maksimal 18 MB');
    toast('Mengupload ' + file.name + '…');
    const { url } = await api('/api/upload', { method: 'POST', body: { name: file.name, data: await fileToDataUrl(file) } });
    toast('Upload selesai');
    return url;
  }
  function pickFile(accept) {
    return new Promise(res => { const i = el('input'); i.type = 'file'; i.accept = accept || ''; i.onchange = () => res(i.files[0]); i.click(); });
  }

  // ---------- dirty + preview ----------
  function setDirty(v = true) {
    dirty = v;
    const s = $('#status'); s.textContent = v ? '● Belum disimpan' : '✓ Tersimpan'; s.classList.toggle('dirty', v);
    if (v) schedulePreview();
  }
  let pvTimer;
  function schedulePreview() { clearTimeout(pvTimer); pvTimer = setTimeout(pushPreview, 700); }
  function pushPreview() {
    try { localStorage.setItem('portfolio_draft', JSON.stringify(content)); } catch {}
    const f = $('#frame');
    if (!previewOn) return;
    if (!f.src) f.src = '/?preview=1'; else f.contentWindow?.location.reload();
  }
  async function save() {
    try {
      await api('/api/content', { method: 'PUT', body: content });
      setDirty(false); toast('Tersimpan — situs sudah diperbarui');
    } catch (e) { toast(e.message, true); }
  }

  // ---------- field builders ----------
  function fieldWrap(def) {
    const w = el('div', 'fld');
    if (def.t !== 'toggle') w.append(el('div', 'lbl', esc(def.l)));
    return w;
  }
  function addHint(w, def) { if (def.h) w.append(el('div', 'hint', esc(def.h))); }

  function buildField(def, obj, onChange) {
    if (def.row) { const r = el('div', 'row2'); def.row.forEach(d => r.append(buildField(d, obj, onChange))); return r; }
    if (def.card) {
      obj[def.path] ||= {};
      const c = el('div', 'card'); c.append(el('h3', '', esc(def.card)));
      def.fields.forEach(d => c.append(buildField(d, obj[def.path], onChange)));
      return c;
    }
    const w = fieldWrap(def);
    const set = v => { obj[def.k] = v; setDirty(); onChange && onChange(); };
    const val = obj[def.k];

    switch (def.t) {
      case 'text': case 'number': {
        const i = el('input'); i.type = def.t === 'number' ? 'number' : 'text'; i.value = val ?? '';
        ['min', 'max', 'step'].forEach(a => def[a] != null && (i[a] = def[a]));
        i.oninput = () => set(def.t === 'number' ? (i.value === '' ? '' : Number(i.value)) : i.value);
        w.append(i); break;
      }
      case 'textarea': case 'code': {
        const i = el('textarea', def.t === 'code' ? 'code' : ''); i.value = val ?? ''; if (def.rows) i.rows = def.rows;
        i.spellcheck = def.t !== 'code';
        i.oninput = () => set(i.value); w.append(i); break;
      }
      case 'lines': {
        const i = el('textarea'); i.value = (val || []).join('\n'); i.rows = 3;
        i.oninput = () => set(i.value.split('\n').map(s => s.trim()).filter(Boolean)); w.append(i); break;
      }
      case 'tags': {
        const i = el('input'); i.type = 'text'; i.value = (val || []).join(', ');
        i.oninput = () => set(i.value.split(',').map(s => s.trim()).filter(Boolean)); w.append(i); break;
      }
      case 'color': {
        const r = el('div', 'color-row'), c = el('input'), t = el('input');
        c.type = 'color'; t.type = 'text'; c.value = /^#[0-9a-f]{6}$/i.test(val) ? val : '#000000'; t.value = val || '';
        c.oninput = () => { t.value = c.value; set(c.value); };
        t.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(t.value)) c.value = t.value; set(t.value); };
        r.append(c, t); w.append(r); break;
      }
      case 'toggle': {
        const l = el('label', 'toggle'), i = el('input'); i.type = 'checkbox'; i.checked = !!val;
        i.onchange = () => set(i.checked); l.append(i, document.createTextNode(def.l)); w.append(l); break;
      }
      case 'select': {
        const s = el('select');
        def.opts.forEach(([v, l]) => { const o = el('option', '', esc(l)); o.value = v; s.append(o); });
        s.value = val ?? def.opts[0][0]; s.onchange = () => set(s.value); w.append(s); break;
      }
      case 'image': case 'file': {
        const r = el('div', 'media-row'), i = el('input'); i.type = 'text'; i.placeholder = 'URL atau upload…'; i.value = val || '';
        const up = el('button', 'btn sm', 'Upload'), lib = el('button', 'btn sm', 'Pilih'), clr = el('button', 'btn sm ghost', '✕');
        [up, lib, clr].forEach(b => b.type = 'button'); clr.title = 'Kosongkan'; lib.title = 'Pilih dari Media Library';
        const thumb = el('img', 'thumb'); thumb.alt = '';
        const showThumb = () => { const isImg = def.t === 'image' && i.value; thumb.hidden = !isImg; if (isImg) thumb.src = i.value; };
        const apply = v => { i.value = v; set(v); showThumb(); };
        i.oninput = () => { set(i.value); showThumb(); };
        up.onclick = async () => { const f = await pickFile(def.t === 'image' ? 'image/*' : ''); if (f) try { apply(await upload(f)); } catch (e) { toast(e.message, true); } };
        lib.onclick = async () => { const u = await mediaPicker(def.t === 'image'); if (u) apply(u); };
        clr.onclick = () => apply('');
        r.append(i, up, lib, clr); w.append(r, thumb); showThumb(); break;
      }
      case 'list': w.append(buildList(def, obj)); break;
    }
    addHint(w, def);
    return w;
  }

  function buildList(def, obj) {
    const box = el('div', 'list');
    obj[def.k] ||= [];
    const arr = obj[def.k];
    const openSet = new WeakSet();
    const draw = () => {
      box.innerHTML = '';
      arr.forEach((it, idx) => {
        const d = el('details', 'item');
        if (openSet.has(it)) d.open = true;
        if (def.hiddenFlag && !it[def.hiddenFlag]) d.classList.add('hidden-sec');
        d.ontoggle = () => d.open ? openSet.add(it) : openSet.delete(it);
        const sum = el('summary'); const t = el('span', 't', esc(def.title(it) || `Item ${idx + 1}`));
        const acts = el('span', 'acts');
        const btn = (txt, title, fn, cls = '') => { const b = el('button', cls, txt); b.type = 'button'; b.title = title; b.onclick = e => { e.preventDefault(); e.stopPropagation(); fn(); }; acts.append(b); };
        btn('▲', 'Naik', () => { if (idx > 0) { [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; setDirty(); draw(); } });
        btn('▼', 'Turun', () => { if (idx < arr.length - 1) { [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; setDirty(); draw(); } });
        if (!def.fixed) {
          btn('⧉', 'Duplikat', () => { const c = structuredClone(it); arr.splice(idx + 1, 0, c); openSet.add(c); setDirty(); draw(); });
          btn('🗑', 'Hapus', () => { if (confirm('Hapus item ini?')) { arr.splice(idx, 1); setDirty(); draw(); } }, 'del');
        }
        sum.append(t, acts); d.append(sum);
        const body = el('div', 'item-body');
        const refreshTitle = () => { t.innerHTML = esc(def.title(it) || `Item ${idx + 1}`); if (def.hiddenFlag) d.classList.toggle('hidden-sec', !it[def.hiddenFlag]); };
        def.item.forEach(f => body.append(buildField(f, it, refreshTitle)));
        d.append(body); box.append(d);
      });
      if (!def.fixed) {
        const add = el('button', 'btn sm', '+ Tambah'); add.type = 'button';
        add.onclick = () => { const n = def.newItem ? def.newItem() : {}; arr.push(n); openSet.add(n); setDirty(); draw(); };
        box.append(add);
      }
    };
    draw();
    return box;
  }

  // ---------- custom sections ----------
  async function mediaPicker(imagesOnly) {
    const files = (await api('/api/uploads')).filter(f => !imagesOnly || /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(f.name));
    return new Promise(res => {
      const m = el('div', 'modal'), card = el('div', 'modal-card');
      const head = el('div', 'modal-head', '<b>Pilih file</b>'), close = el('button', 'btn sm ghost', '✕');
      const body = el('div', 'modal-body'), grid = el('div', 'media-grid');
      const done = v => { m.remove(); res(v); };
      close.onclick = () => done(null); m.onclick = e => e.target === m && done(null);
      if (!files.length) body.append(el('p', 'sec-desc', 'Belum ada file. Gunakan tombol Upload.'));
      files.forEach(f => { const c = mediaCard(f, true); c.onclick = () => done(f.url); grid.append(c); });
      head.append(close); body.append(grid); card.append(head, body); m.append(card); document.body.append(m);
    });
  }
  function mediaCard(f, pick) {
    const c = el('div', 'media-card' + (pick ? ' pick' : ''));
    const isImg = /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(f.name);
    c.append(el('div', 'pv', isImg ? `<img src="${esc(f.url)}" alt="" loading="lazy">` : esc(f.name.split('.').pop().toUpperCase())));
    const meta = el('div', 'meta', `<span>${esc(f.name)}</span><span style="color:var(--muted)">${(f.size / 1024).toFixed(0)} KB</span>`);
    c.append(meta);
    return c;
  }
  async function renderMedia(root) {
    const drop = el('div', 'drop', 'Tarik & lepas file ke sini, atau klik untuk upload<br><small>PNG, JPG, WEBP, SVG, GIF, GLB, PDF, MP4 — maks 18 MB</small>');
    const grid = el('div', 'media-grid');
    const load = async () => {
      grid.innerHTML = '';
      const files = await api('/api/uploads');
      if (!files.length) grid.append(el('p', 'sec-desc', 'Belum ada file.'));
      files.forEach(f => {
        const c = mediaCard(f), row = el('div');
        const copy = el('button', 'btn sm', 'Salin URL'), del = el('button', 'btn sm danger', 'Hapus');
        copy.onclick = () => { navigator.clipboard?.writeText(f.url); toast('URL disalin: ' + f.url); };
        del.onclick = async () => { if (confirm('Hapus ' + f.name + '? Pastikan file tidak dipakai di konten.')) { await api('/api/uploads/' + encodeURIComponent(f.name), { method: 'DELETE' }); load(); } };
        row.append(copy, del); c.querySelector('.meta').append(row); grid.append(c);
      });
    };
    const handle = async list => { for (const f of list) { try { await upload(f); } catch (e) { toast(e.message, true); } } load(); };
    drop.onclick = async () => { const f = await pickFile(); if (f) handle([f]); };
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); handle([...e.dataTransfer.files]); };
    root.append(drop, grid); load();
  }
  async function renderBackup(root) {
    const c1 = el('div', 'card', '<h3>Ekspor / Impor</h3><p class="sec-desc">Simpan seluruh konten sebagai file JSON, atau muat dari file JSON.</p>');
    const row = el('div', 'media-row');
    const ex = el('button', 'btn', '⬇ Ekspor JSON'), im = el('button', 'btn', '⬆ Impor JSON'), rs = el('button', 'btn danger', 'Reset ke contoh awal');
    ex.onclick = () => {
      const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
      a.download = `portfolio-content-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    };
    im.onclick = async () => {
      const f = await pickFile('application/json,.json'); if (!f) return;
      try { const data = JSON.parse(await f.text()); if (!data.site) throw new Error('File bukan konten portfolio'); content = data; setDirty(); go(current); toast('Diimpor — klik Simpan untuk menerapkan'); }
      catch (e) { toast(e.message, true); }
    };
    rs.onclick = async () => { if (confirm('Kembalikan semua konten ke contoh awal? (Konten sekarang otomatis di-backup)')) { await api('/api/content/reset', { method: 'POST' }); await loadContent(); toast('Konten direset'); } };
    row.append(ex, im, rs); c1.append(row);

    const c2 = el('div', 'card', '<h3>Riwayat backup otomatis</h3><p class="sec-desc">Dibuat setiap kali kamu menyimpan (30 terakhir).</p>');
    const list = el('div', 'list');
    const backups = await api('/api/backups');
    if (!backups.length) list.append(el('p', 'sec-desc', 'Belum ada backup.'));
    backups.forEach(b => {
      const r = el('div', 'media-row'); r.style.alignItems = 'center';
      const when = b.name.replace('content-', '').replace('.json', '').replace(/T(\d\d)-(\d\d)-(\d\d)-\d+Z/, ' $1:$2:$3 UTC');
      r.append(el('span', '', esc(when)));
      const btn = el('button', 'btn sm', 'Pulihkan'); btn.style.marginLeft = 'auto';
      btn.onclick = async () => { if (confirm('Pulihkan backup ' + when + '?')) { await api('/api/backups/restore', { method: 'POST', body: { name: b.name } }); await loadContent(); toast('Backup dipulihkan'); } };
      r.append(btn); list.append(r);
    });
    c2.append(list); root.append(c1, c2);
  }
  function renderAccount(root) {
    const f = el('form', 'card', `<h3>Ganti password</h3>
      <div class="fld"><div class="lbl">Password lama</div><input type="password" name="current" required autocomplete="current-password"></div>
      <div class="fld"><div class="lbl">Password baru (min. 6 karakter)</div><input type="password" name="next" required minlength="6" autocomplete="new-password"></div>
      <div class="fld"><div class="lbl">Ulangi password baru</div><input type="password" name="next2" required autocomplete="new-password"></div>
      <div><button class="btn primary">Simpan password</button></div>`);
    f.onsubmit = async e => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f));
      if (d.next !== d.next2) return toast('Password baru tidak sama', true);
      try { await api('/api/password', { method: 'POST', body: d }); f.reset(); $('#pw-banner').hidden = true; toast('Password diganti'); }
      catch (err) { toast(err.message, true); }
    };
    root.append(f);
  }

  // ---------- navigation ----------
  function renderNav() {
    const nav = $('#side-nav'); nav.innerHTML = '';
    SCHEMA.forEach(s => {
      if (s.grp) return nav.append(el('div', 'grp', esc(s.grp)));
      const a = el('a', s.id === current ? 'on' : '', `<span class="ic">${s.icon}</span>${esc(s.label)}`);
      a.href = '#' + s.id; nav.append(a);
    });
  }
  function go(id) {
    const sec = SECTIONS.find(s => s.id === id) || SECTIONS[0];
    current = sec.id; renderNav();
    $('#sec-title').textContent = sec.label;
    const ed = $('#editor'); ed.innerHTML = ''; ed.scrollTop = 0;
    const inner = el('div', 'editor-inner');
    inner.append(el('p', 'sec-desc', esc(sec.desc || '')));
    if (sec.custom) sec.custom(inner);
    else {
      content[sec.id] ||= {};
      const card = el('div', 'card');
      sec.fields.forEach(f => card.append(buildField(f, content[sec.id])));
      inner.append(card);
    }
    ed.append(inner);
    $('.side').classList.remove('open');
  }

  // ---------- boot ----------
  async function loadContent() {
    content = await (await fetch('/api/content', { cache: 'no-store' })).json();
    setDirty(false); go(current);
    try { localStorage.setItem('portfolio_draft', JSON.stringify(content)); } catch {}
    pushPreview();
  }
  function showLogin() { $('#app').hidden = true; $('#login').hidden = false; }
  async function showApp(isDefault) {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#pw-banner').hidden = !isDefault;
    current = location.hash.slice(1) || 'site';
    await loadContent();
  }

  $('#login-form').onsubmit = async e => {
    e.preventDefault();
    try { const r = await api('/api/login', { method: 'POST', body: { password: e.target.password.value } }); $('#login-err').textContent = ''; showApp(r.isDefault); }
    catch (err) { $('#login-err').textContent = err.message; }
  };
  $('#logout').onclick = async () => { await api('/api/logout', { method: 'POST' }); location.reload(); };
  $('#save').onclick = save;
  $('#menu-btn').onclick = () => $('.side').classList.toggle('open');
  $('#toggle-preview').onclick = () => {
    const ws = $('.workspace');
    if (innerWidth <= 1100) ws.classList.toggle('show-preview');
    else { previewOn = !previewOn; ws.classList.toggle('no-preview', !previewOn); if (previewOn) pushPreview(); }
  };
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => {
    document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b));
    $('#frame').style.width = b.dataset.w;
  });
  addEventListener('hashchange', () => content && go(location.hash.slice(1)));
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (content) save(); } });
  addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  api('/api/me').then(r => r.authed ? showApp(r.isDefault) : showLogin()).catch(showLogin);
})();
