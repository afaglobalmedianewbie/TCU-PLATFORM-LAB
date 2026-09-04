# TCU-PLATFORM-LAB: Quickstart Guide

Panduan cepat untuk menjalankan seluruh platform dari PC AMD Ryzen 7 Windows 11 menggunakan Antigravity Desktop / CLI dan Docker.

---

### Langkah 1: Flash Konfigurasi Awal ke Perangkat Fisik

1. **Konfigurasi MikroTik CCR**:
   - Buka **Winbox** di PC Anda.
   - Login ke CCR melalui MAC Address.
   - Buka menu **New Terminal**.
   - Buka file device-configs/01-mikrotik-ccr-init.rsc, salin seluruh isinya dan tempel (*paste*) ke Terminal Winbox. Tekan Enter.

2. **Konfigurasi OLT ZTE C320**:
   - Hubungkan kabel USB-to-Serial Console ke port CLI ZTE C320.
   - Buka **PuTTY**, pilih Serial, Baud rate 9600 (atau 115200).
   - Login dengan user: zte / pass: zte (ketik enable, pass: zxr10).
   - Buka file device-configs/02-zte-c320-init.cfg, salin seluruh isinya dan tempel ke PuTTY.

---

### Langkah 2: Jalankan Software Stack di PC Ryzen 7

1. Pastikan **Docker Desktop** sudah berjalan di Windows 11.
2. Buka folder repositori ini di **Antigravity Desktop** atau PowerShell:
   `powershell
   cd TCU-PLATFORM-LAB
   `
3. Salin file environment:
   `powershell
   copy .env.example .env
   `
4. Jalankan seluruh container stack:
   `powershell
   docker compose up -d
   `
   *(Atau cukup klik dua kali file scripts/start-lab.bat)*.

---

### Langkah 3: Akses Web UI Command Center

Setelah container berjalan:
* **Dashboard Command Center**: [http://localhost:3001](http://localhost:3001)
* **Backend REST API**: [http://localhost:3000](http://localhost:3000)
* **Grafana Network NOC**: [http://localhost:3002](http://localhost:3002) (Login: dmin / 	cu_grafana_2026)
* **FreeRADIUS Engine**: Berjalan di port UDP 1812 & 1813 (siap melayani MikroTik CCR).

---

### Langkah 4: Uji Coba Pasang Modem Pelanggan (ONT)

1. Tancapkan 1 unit modem ONT ke salah satu port PON OLT ZTE C320.
2. Buka Dashboard Web di [http://localhost:3001](http://localhost:3001).
3. Anda akan melihat kartu notifikasi **New Unconfigured ONU Found** dengan Serial Number modem tersebut.
4. Klik tombol **[Aktivasi]**, masukkan nama pelanggan, dan internet pelanggan langsung menyala secara otomatis!
