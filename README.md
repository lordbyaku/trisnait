# Portfolio CMS

Website portofolio interaktif bergaya **moncy.dev** (Three.js + GSAP) dengan **dashboard CMS bawaan**. Semua teks, gambar, warna, font, objek 3D, dan urutan section bisa diubah dari `/admin`, tanpa menyentuh kode.

| Versi | Tanggal | Catatan |
|---|---|---|
| 1.1.0 | 2026-11-06 | Tambah `sync.bat` untuk push ke GitHub |
| 1.0.1 | 2026-10-31 | Petunjuk sumber model 3D diperbarui; model .glb hanya memutar animasi pertama |
| 1.0.0 | 2026-10-31 | Rilis pertama |

## Menjalankan

Butuh **Node.js 18+**. Tidak ada `npm install`, karena proyek ini tanpa dependency.

```bash
cd portfolio-cms
npm start          # atau: node server.js
```

- Situs: http://localhost:3000
- Dashboard: http://localhost:3000/admin, password awal **`admin123`** (segera ganti di menu *Akun & Keamanan*)

Opsi environment: `PORT=8080`, `ADMIN_PASSWORD=rahasia` (hanya dipakai saat `data/auth.json` belum ada).

> Three.js, GSAP, dan Google Fonts dimuat dari CDN, jadi browser pengunjung butuh internet.

## Sync ke GitHub

Butuh [Git](https://git-scm.com) terpasang. Jalankan `sync.bat` (klik dua kali, atau `sync.bat "pesan commit"`). Script akan init repo bila belum ada, mengarahkan remote ke `https://github.com/lordbyaku/trisnait`, commit semua perubahan, lalu push ke branch `main`. Login GitHub diminta saat push pertama.

## Fitur

**Situs:** loading screen, kursor custom, efek grain, hero dengan nama besar, peran yang bergantian, objek 3D yang mengikuti mouse (blob, torus knot, donat, kristal, bola, atau **model .glb sendiri**), About dengan teks yang menyala saat di-scroll, kartu What I Do, timeline Career, carousel Work horizontal, bola Tech Stack 3D yang bisa didorong kursor, Contact & footer. Responsif sampai ukuran HP.

**Dashboard CMS:**
- Editor untuk setiap section: Situs & SEO, Tema & Warna, Urutan Section, Navigasi, Hero, About, What I Do, Career, Work, Tech Stack, Contact
- Daftar item bisa ditambah, dihapus, diduplikat, dan diurutkan (▲▼)
- Upload gambar/PDF/GLB, plus Media Library
- Live preview (desktop/tablet/mobile) sebelum disimpan
- `Ctrl+S` untuk simpan; backup otomatis setiap kali simpan; ekspor/impor JSON
- Custom CSS untuk kustomisasi lanjutan
- Tulis `**kata**` di teks panjang untuk memberi warna aksen

## Struktur

```
server.js                 server HTTP + API (Node bawaan saja)
public/                   situs publik (index.html, style.css, app.js)
admin/                    dashboard CMS (index.html, admin.css, admin.js)
data/content.default.json konten contoh
data/content.json         konten live (dibuat otomatis)
data/auth.json            hash password (dibuat otomatis, jangan di-commit)
data/backups/             backup otomatis
uploads/                  file yang di-upload dari dashboard
```

## API

| Method | Endpoint | Login | Fungsi |
|---|---|---|---|
| GET | `/api/content` | – | Ambil konten |
| PUT | `/api/content` | ✓ | Simpan konten (otomatis backup) |
| POST | `/api/login` / `/api/logout` | – | Sesi (cookie HttpOnly) |
| POST | `/api/upload` | ✓ | Upload `{name, data(base64)}` |
| GET/DELETE | `/api/uploads[/:name]` | ✓ | Media library |
| GET | `/api/backups` · POST `/api/backups/restore` | ✓ | Backup |
| POST | `/api/content/reset` | ✓ | Kembali ke konten contoh |
| POST | `/api/password` | ✓ | Ganti password |

## Deploy

Butuh hosting yang menjalankan Node.js **dan** punya disk persisten (konten & upload disimpan sebagai file): VPS (DigitalOcean, IDCloudHost, Biznet Gio), Railway/Render dengan volume, atau shared hosting cPanel yang punya "Setup Node.js App". Pasang di belakang HTTPS (Nginx/Caddy/Cloudflare). Vercel/Netlify tidak cocok tanpa modifikasi, karena filesystem-nya read-only.

## Menambah field baru

1. Tambah nilai default di `data/content.default.json` (dan `data/content.json` jika sudah ada)
2. Tambah definisi field di `SCHEMA` (`admin/admin.js`); form langsung muncul di dashboard
3. Tampilkan di renderer yang sesuai di `public/app.js`
