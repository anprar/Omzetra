# Panduan Meluncurkan Update Sistem Baru di VPS Ubuntu

Dokumentasi ini mencatat langkah-langkah teknis untuk melakukan sinkronisasi pembaruan besar (fitur filter multidimensi, validasi data unggah, growth comparator, dan pemisahan top produk) dari repositori GitHub ke server VPS Ubuntu produksi Anda.

---

## Prasyarat
Perubahan kode terbaru telah dikompilasi tanpa kesalahan secara lokal dan telah di-push ke cabang utama (`main`) repositori GitHub Anda.

---

## Langkah-Langkah Sinkronisasi di VPS

Jalankan perintah-perintah berikut secara berurutan di terminal VPS Anda (akses via SSH):

### 1. Masuk ke Direktori Proyek
```bash
cd /var/www/Omzetra
```

### 2. Selesaikan Konflik File Database Lokal
Karena file database `sales.db` di VPS mungkin mengalami modifikasi lokal saat pengujian, buang perubahan lokal tersebut agar proses penarikan kode (`git pull`) berjalan lancar:
```bash
git checkout dashboard-app/sales.db
```

### 3. Tarik Kode Pembaruan Terbaru
Unduh semua pembaruan fitur analisis bisnis terintegrasi dan modul validasi data dari GitHub:
```bash
git pull
```

### 4. Bersihkan Database Lama
Hapus file database lama untuk memicu inisialisasi ulang skema tabel baru yang mencakup tabel metadata sistem (`system_metadata`) serta indeks kueri relasional (`idx_sales_*`):
```bash
rm dashboard-app/sales.db
```

### 5. Masuk ke Folder Aplikasi Dashboard
```bash
cd dashboard-app
```

### 6. Instalasi Dependensi Baru
Pastikan seluruh paket pustaka pendukung terbaru (seperti SheetJS/xlsx) terinstal dengan benar:
```bash
npm install
```

### 7. Lakukan Kompilasi Produksi Baru (Next.js Build)
Build ulang proyek Next.js untuk mengoptimalkan performa halaman dinamis dan static-rendering versi terbaru:
```bash
npm run build
```

### 8. Muat Ulang Layanan PM2
Restart proses latar belakang server Next.js Anda agar PM2 menjalankan versi produksi terbaru yang baru saja di-build:
```bash
pm2 restart omzetra-dashboard
```

---

## Verifikasi Pasca Update
1. Buka browser Anda dan akses aplikasi: `http://<VPS_IP_ADDRESS>:3000` (atau IP VPS Tencent Cloud Lighthouse Anda).
2. Lakukan login menggunakan akun admin (`admin` / `adminomzetra`).
3. Akses **Unggah Excel/CSV** dan pilih beberapa file CSV penjualan 2025 secara bersamaan (fitur *multiple upload*).
4. Verifikasi munculnya **Panel Validasi & Integritas Data** yang memuat audit baris data terperinci.
5. Uji tombol filter **Periode, Sales, Customer, dan Produk** di bagian atas, dan pastikan grafik tren memperbarui datanya secara instan sesuai filter dimensi yang Anda pilih.
6. Verifikasi visualisasi kartu KPI utama yang kini menampilkan badge persentase pertumbuhan (`▲` / `▼`) vs periode sebelumnya.
