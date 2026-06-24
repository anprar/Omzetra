# Panduan Instalasi & Deploy Omzetra Dashboard ke VPS Ubuntu

Dokumentasi ini berisi langkah-langkah lengkap untuk melakukan inisialisasi Git, push ke GitHub, hingga deployment di server VPS Ubuntu Anda. Semua informasi sensitif (IP Address, username, path) telah disensor demi keamanan.

---

## Bagian 1: Konfigurasi Git di Komputer Lokal

Lakukan langkah-langkah ini di dalam folder proyek lokal Anda menggunakan terminal (PowerShell / Git Bash).

### 1. Inisialisasi Git & Cabang (Branch) Utama
```bash
# Inisialisasi repositori Git kosong
git init

# Buat dan pindah ke cabang main
git checkout -b main
```

### 2. Konfigurasi `.gitignore`
Buat file bernama `.gitignore` di folder utama (root) proyek Anda untuk mencegah file berukuran besar terunggah ke GitHub:
```text
# Dependency directories
dashboard-app/node_modules/

# Next.js build output
dashboard-app/.next/
dashboard-app/out/
dashboard-app/build/

# System & debug files
.DS_Store
npm-debug.log*
yarn-debug.log*
.env*
```

### 3. Stage & Commit Pertama
```bash
# Tambahkan semua file proyek ke staging area
git add .

# Buat commit pertama
git commit -m "Initial commit: Rebranded to Omzetra and added sample CSV data"
```

### 4. Hubungkan dan Push ke GitHub
Buat repositori kosong di GitHub (disarankan Private), kemudian hubungkan dan unggah:
```bash
# Tambahkan remote origin (ganti <GITHUB_USERNAME> & <REPO_NAME> dengan akun Anda)
git remote add origin https://github.com/<GITHUB_USERNAME>/<REPO_NAME>.git

# Push ke repositori GitHub
git push -u origin main
```

---

## Bagian 2: Panduan Deployment di VPS Ubuntu

Masuk ke server VPS Anda melalui SSH:
```bash
ssh <VPS_USER>@<VPS_IP_ADDRESS>
```

### Langkah 1: Persiapan Environment Ubuntu
Perbarui sistem paket Ubuntu dan instal komponen pendukung:

```bash
# 1. Update paket sistem
sudo apt update && sudo apt upgrade -y

# 2. Tambahkan repositori Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 3. Instal Node.js dan build-essential (penting untuk compile SQLite)
sudo apt-get install -y nodejs build-essential
```

### Langkah 2: Kloning Repositori dari GitHub
Pindah ke direktori web server (buat folder jika belum ada) dan kloning kode Anda:

```bash
# Buat folder tujuan (opsional)
mkdir -p /var/www
cd /var/www/

# Kloning kode proyek (Ganti URL dengan repositori Anda)
git clone https://github.com/<GITHUB_USERNAME>/<REPO_NAME>.git

# Masuk ke folder aplikasi
cd <REPO_NAME>/dashboard-app
```

### Langkah 3: Instalasi Dependencies & Build Project
```bash
# 1. Instal semua dependensi Node.js (SQLite akan otomatis ter-compile)
npm install

# 2. Build aplikasi untuk mode produksi
npm run build
```

### Langkah 4: Menjalankan Aplikasi Secara Terus Menerus (PM2)
Gunakan PM2 agar aplikasi Next.js terus berjalan di latar belakang (background) meskipun koneksi SSH ditutup:

```bash
# 1. Instal PM2 secara global di sistem
sudo npm install -g pm2

# 2. Jalankan server Next.js dengan nama service 'omzetra-dashboard'
pm2 start npm --name "omzetra-dashboard" -- start

# 3. Konfigurasi agar PM2 menyala otomatis setelah VPS reboot
pm2 startup
```
*Catatan: Jalankan perintah hasil keluaran dari `pm2 startup` di terminal Anda.*

```bash
# 4. Simpan daftar proses PM2 saat ini
pm2 save
```

---

## Bagian 3: Konfigurasi Firewall & Akses Publik

### 1. Buka Port di Firewall Internal Ubuntu (UFW)
```bash
# Izinkan akses masuk pada port 3000
sudo ufw allow 3000

# Periksa status firewall
sudo ufw status
```

### 2. Buka Port di Panel Web Cloud Provider (Lighthouse / AWS Security Group)
Akses ke port `3000` harus diizinkan di konsol manajemen cloud provider Anda:
1. Buka halaman panel kontrol VPS Anda (misalnya konsol Tencent Cloud Lighthouse).
2. Pilih instance VPS Anda, kemudian klik tab **Firewall** atau **Security Group**.
3. Klik **Add Rule** (Tambahkan Aturan).
4. Konfigurasikan aturan baru:
   - **Type / Template**: Custom
   - **Protocol**: `TCP`
   - **Port**: `3000`
   - **Action / Policy**: `Allow` (Izinkan)
   - **Source**: `0.0.0.0/0` (Agar bisa diakses oleh semua IP)
5. Klik **OK** / **Save**.

### 3. Akses Aplikasi
Aplikasi sekarang dapat diakses melalui browser dengan alamat:
```text
http://<VPS_IP_ADDRESS>:3000
```
