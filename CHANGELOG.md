# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) dan [Semantic Versioning](https://semver.org/lang/id/).

## [1.2.0] — 2026-11-06

### Added
- `.htaccess` untuk **mode statis** di shared hosting cPanel (Apache/LiteSpeed): repo di-deploy utuh ke `public_html` lewat Git Deploy; `/` dan aset dilayani dari `public/`, `/api/content` dibaca dari `data/content.json`, `/uploads/` tetap bisa diakses.
- Akses langsung ke `data/`, `admin/`, `.git/`, `server.js`, `package.json`, `sync.bat`, dan file `.md` diblokir (404).

## [1.1.0] — 2026-11-06

### Added
- `sync.bat`: satu klik untuk init repo (jika belum), set remote `https://github.com/lordbyaku/trisnait`, commit semua perubahan, dan push ke `main`. Pesan commit opsional: `sync.bat "pesan"`.

## [1.0.1] — 2026-10-31

### Changed
- Petunjuk field model .glb tidak lagi menyebut Ready Player Me (layanan publiknya tutup sejak 31 Januari 2026); diganti dengan alternatif yang masih aktif.

### Fixed
- Model .glb yang berisi beberapa animasi kini hanya memutar animasi pertama, tidak semua animasi sekaligus.

## [1.0.0] — 2026-10-31

### Added
- Situs portofolio satu halaman terinspirasi moncy.dev: loader, kursor custom, navbar, ikon sosial melayang, tombol resume.
- Hero dengan nama besar, peran bergantian, dan objek 3D Three.js (5 bentuk bawaan atau model `.glb` sendiri) yang mengikuti mouse.
- Section About (teks menyala saat di-scroll), What I Do (kartu layanan + tag), Career (timeline dengan garis bercahaya), Work (carousel horizontal ter-pin), Tech Stack (bola 3D dengan fisika, bisa didorong kursor), Contact & footer.
- Dashboard CMS di `/admin`: login password, editor berbasis schema untuk semua teks/gambar/warna/font/urutan section, live preview desktop/tablet/mobile, Ctrl+S untuk simpan.
- Media Library (upload drag & drop, salin URL, hapus) dan pemilih media di setiap field gambar/file.
- Backup otomatis setiap simpan (30 terakhir), pulihkan backup, ekspor/impor JSON, reset ke contoh awal.
- Ganti password, rate-limit login, cookie HttpOnly, proteksi path traversal.
- Deep link ke section (`/#projects`).
