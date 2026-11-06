# PRD — Portfolio CMS

## Latar belakang
Pengguna ingin portofolio pribadi yang berkesan seperti **moncy.dev** (dark, 3D, animasi scroll) tapi bisa mengelola isi dan wording sendiri tanpa ngoding.

## Tujuan
1. Situs portofolio satu halaman yang interaktif, cepat, dan responsif.
2. **Semua** konten yang terlihat bisa diedit lewat dashboard CMS.
3. Mudah dijalankan: tanpa database dan tanpa dependency npm.

## Pengguna
- **Pemilik:** mengedit konten di `/admin`.
- **Pengunjung:** recruiter atau klien yang melihat portofolio.

## Kebutuhan fungsional
| ID | Kebutuhan |
|---|---|
| F1 | Section: Hero, About, What I Do, Career, Work, Tech Stack, Contact, dengan urutan dan visibilitas yang bisa diatur |
| F2 | Hero 3D: bentuk bawaan atau model .glb upload, mengikuti mouse |
| F3 | Tema: 6 warna, 2 font Google, radius, grain, custom CSS |
| F4 | SEO: title, description, favicon, OG image |
| F5 | Editor list: tambah, hapus, duplikat, urutkan item |
| F6 | Upload media + media library |
| F7 | Live preview draft sebelum simpan (desktop/tablet/mobile) |
| F8 | Backup otomatis, restore, ekspor/impor JSON, reset |
| F9 | Login password (hash scrypt), ganti password, rate-limit login |

## Non-fungsional
- Node.js 18+, tanpa npm dependency; data disimpan di file JSON.
- Situs tetap berfungsi tanpa WebGL (canvas 3D di-skip) dan menghormati `prefers-reduced-motion`.
- Layout aman di lebar 360px ke atas.

## Di luar cakupan (v1)
Multi-user, blog/halaman detail proyek, multi-bahasa, formulir kontak dengan pengiriman email.
