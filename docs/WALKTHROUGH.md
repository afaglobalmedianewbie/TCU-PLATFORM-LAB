# Walkthrough: Dynamic Integrations Management & Multi-Channel Notification Hub

**Platform:** TCU-PLATFORM-LAB  
**Status:** Selesai Diimplementasikan & Tervalidasi  
**Commit Git:** `7d38c75`  
**Tanggal:** 5 September 2026

---

## 1. Komponen yang Telah Selesai Dibangun

### A. Frontend Web Admin Form: [integrations.js](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/frontend/pages/admin/settings/integrations.js)
Antarmuka web modern dengan 6 Tab Navigasi terpadu:
1. **💳 Tab Payment Gateway (Midtrans & Xendit):**
   * Saklar Gateway Aktif: Midtrans (Snap QRIS & VA) / Xendit (Invoice & e-Wallet) / Manual.
   * Saklar Environment: **Sandbox (Uji Coba)** vs **Production (Live)**.
   * Input Kredensial: Server Key, Client Key, Merchant ID (Midtrans) & Secret Key, Webhook Verification Token (Xendit).
   * **Kotak Webhook Callbacks 1-Click Copy:**
     * Midtrans Notification URL: `https://<domain>/api/billing/webhook/midtrans`
     * Xendit Webhook URL: `https://<domain>/api/billing/webhook/xendit`
   * **Panduan Step-by-Step Interaktif** tersemat langsung di samping form.
2. **💬 Tab WhatsApp Gateway:**
   * Pilihan driver: **Fonnte Gateway** (paling mudah & populer di ISP lokal), **Meta Cloud API** (resmi WhatsApp Business), atau Generic Webhook (Waha/Baileys).
   * Input API Endpoint & API Key.
   * Kotak Uji Coba: Masukkan nomor HP dan klik **[Kirim Test WA]** untuk verifikasi instan.
   * Panduan integrasi Fonnte lengkap.
3. **✉️ Tab Email (SMTP):**
   * Konfigurasi Host, Port (587 TLS / 465 SSL), Username, Password, dan Sender Email.
   * Kotak Uji Coba: Masukkan email penerima dan klik **[Kirim Test Email]**.
   * Panduan SMTP untuk Postfix lokal maupun Google Workspace / Gmail App Password.
4. **✈️ Tab Telegram Bot:**
   * Konfigurasi Bot Token (dari `@BotFather`), Chat ID Grup NOC, dan Chat ID Grup Finance.
   * Kotak Uji Coba: Masukkan Chat ID dan klik **[Kirim Test Telegram]**.
   * Panduan pembuatan bot dan cara mendapatkan Group Chat ID via `@RawDataBot`.
5. **🏢 Tab Google Chat:**
   * Konfigurasi Incoming Webhook URL Google Chat Space.
   * Kotak Uji Coba: Klik **[Kirim Pesan Uji Coba]** ke ruang obrolan Google Workspace.
   * Panduan pembuatan webhook di Google Chat Space.
6. **🔀 Tab Matriks Notifikasi:**
   * Checkbox penentu saluran penerima untuk:
     * Tagihan Baru & Pengingat H-3 $\rightarrow$ WhatsApp & Email Pelanggan.
     * Pembayaran Diterima (Lunas) $\rightarrow$ WhatsApp Pelanggan & Telegram Finance.
     * Alarm Jaringan NOC (Laser Drop / OLT Loss / Baterai DC Drop) $\rightarrow$ Telegram NOC & Google Chat Space.

---

### B. Backend Modules & Engine

1. **[midtrans.js](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/backend/modules/midtrans.js):**
   * `createSnapTransaction()`: Mengenerate Snap token dan URL pembayaran QRIS/VA dinamis.
   * `verifySignature()`: Memvalidasi kalkulasi hash SHA-512 dari Midtrans untuk mencegah manipulasi data.
2. **[xendit.js](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/backend/modules/xendit.js):**
   * `createXenditInvoice()`: Mengenerate invoice pembayaran Xendit.
   * `verifyXenditCallback()`: Validasi header `x-callback-token`.
3. **[notifier.js](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/backend/modules/notifier.js):**
   * Multi-channel dispatcher untuk WhatsApp, Nodemailer SMTP, Telegram Bot, dan Google Chat webhook.
   * Template pesan otomatis untuk `notifyInvoiceCreated()` dan `notifyPaymentSuccess()`.
4. **[radius-coa.js](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/backend/modules/radius-coa.js):**
   * Mengirimkan paket UDP Disconnect-Request RFC 3576 ke MikroTik CCR Port 3799 untuk meng-un-isolir pelanggan secara instan begitu webhook pembayaran sukses diterima.
5. **[settings.js](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/backend/routes/settings.js):**
   * API endpoints untuk mengambil, menyimpan, dan mengetes koneksi ke seluruh saluran integrasi.
6. **[billing.js](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/backend/routes/billing.js):**
   * Ditambahkan endpoint `POST /api/billing/invoices/:id/checkout`.
   * Ditambahkan webhook callback `/webhook/midtrans` dan `/webhook/xendit`.

---

### C. Dokumentasi Operasional: [INTEGRATION-GUIDE.md](file:///C:/Users/Andi_Law/.gemini/antigravity/scratch/TCU-PLATFORM-LAB/docs/INTEGRATION-GUIDE.md)
Dokumentasi langkah demi langkah (*step-by-step*) lengkap yang menjelaskan alur transaksi dari awal hingga akhir, kredensial yang dibutuhkan, serta panduan praktis konfigurasi di dashboard penyedia layanan.

---

## 2. Hasil Pengujian & Validasi

| Komponen yang Diuji | Metode Pengujian | Hasil |
| :--- | :--- | :--- |
| **Sintaks Backend (7 File)** | `node -c` pada server, billing, settings, midtrans, xendit, notifier, radius-coa | ✅ **PASS** (Exit code 0, nol error sintaks). |
| **Keseimbangan Tag JSX Frontend** | Analisis parser brace `{}` dan parens `()` | ✅ **PASS** (166 Braces & 180 Parens seimbang sempurna). |
| **Routing Admin Portal** | Pengecekan tautan navigasi di `admin/index.js` | ✅ **PASS** (Tautan `/admin/settings/integrations` aktif). |
| **Database DDL** | Verifikasi schema `system_settings` di `radius-init.sql` & Prisma | ✅ **PASS** (Tabel dan kolom terdefinisi rapi). |
| **Git Version Control** | `git status` & `git commit` | ✅ **PASS** (Commit `7d38c75` bersih). |

---

## 3. Cara Mengakses dan Menggunakan

1. Jalankan aplikasi via `scripts\start-lab.bat`.
2. Buka browser: `http://localhost:3001/admin/settings/integrations`.
3. Pilih tab yang ingin dikonfigurasi, ikuti panduan step-by-step di samping form, masukkan kunci API, dan klik **Simpan Pengaturan**.
