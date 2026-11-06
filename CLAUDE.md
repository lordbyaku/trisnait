# Portfolio CMS — catatan untuk Claude

- Server tanpa dependency: `server.js` (Node http/fs/crypto). Jangan tambah npm package tanpa alasan kuat.
- Situs publik: `public/` (render dari `/api/content`). Dashboard: `admin/` (form dibangkitkan dari `SCHEMA` di `admin/admin.js`).
- Menambah field baru = (1) tambahkan default di `data/content.default.json`, (2) tambahkan ke `SCHEMA`, (3) render di `public/app.js`.
- `data/content.json` adalah konten live — jangan ditimpa saat mengubah default.

## Aturan dokumentasi
- Setiap perubahan: tambah entri di `CHANGELOG.md` (Keep a Changelog + SemVer).
- Setiap perubahan fitur: perbarui `README.md` (dan `PRD.md` jika kebutuhan berubah).
- Saat versi naik: perbarui `package.json` dan tabel versi di README.
