# Panduan Lengkap: Integrasi Payment Gateway & Pusat Notifikasi Multi-Channel
## TCU-PLATFORM-LAB — PT TOP CLASS UNIVERSAL

Dokumen ini adalah panduan operasional langkah demi langkah (*step-by-step*) untuk mengintegrasikan **Midtrans, Xendit, WhatsApp, Email SMTP, Telegram Bot, dan Google Chat** ke dalam satu Dashboard Web Terpadu.

---

## 1. Arsitektur Alur Transaksi & Notifikasi

`
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PELANGGAN                                                                │
│    Menerima Tagihan H-3 via WhatsApp & Email (Ada Link Bayar Cepat)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PEMBAYARAN ONLINE (MIDTRANS SNAP / XENDIT)                               │
│    Pelanggan Scan QRIS (BCA, GoPay, OVO, Dana) atau bayar Virtual Account   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼ Webhook Callback Instan
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. TCU-PLATFORM BACKEND ENGINE                                              │
│    ├─ 1. Validasi Hash Signature (Anti-Manipulasi Pembayaran)              │
│    ├─ 2. Update Status Invoice menjadi PAID                              │
│    ├─ 3. Kirim Struk Pelunasan ke WhatsApp Pelanggan                        │
│    ├─ 4. Kirim Laporan Uang Masuk ke Telegram Grup Finance                  │
│    └─ 5. Tembak RADIUS CoA (Port 3799) ke MikroTik CCR: UN-ISOLIR INSTAN!  │
└─────────────────────────────────────────────────────────────────────────────┘
`

---

## 2. Integrasi Midtrans Payment Gateway (QRIS & VA)

### Langkah 1: Dapatkan Kredensial API Midtrans
1. Login ke [dashboard.midtrans.com](https://dashboard.midtrans.com).
2. Pastikan Anda berada di mode yang diinginkan: **Sandbox** (untuk tes) atau **Production** (untuk transaksi uang nyata).
3. Buka menu **Settings > Access Keys**.
4. Salin tiga nilai berikut:
   * **Merchant ID**
   * **Client Key**
   * **Server Key**

### Langkah 2: Masukkan Kredensial ke Dashboard TCU
1. Buka Dashboard Admin: http://localhost:3001/admin/settings/integrations.
2. Pilih tab **Payment Gateway**.
3. Masukkan *Server Key*, *Client Key*, dan *Merchant ID*.
4. Pilih mode: **Sandbox** atau **Production**.
5. Klik **Simpan Pengaturan**.

### Langkah 3: Konfigurasi Webhook Callback di Midtrans
1. Pada halaman Dashboard TCU tab Payment Gateway, cari kotak **Midtrans Notification URL**.
2. Klik tombol **[Salin]** (URL: https://<domain-anda>/api/billing/webhook/midtrans).
3. Kembali ke dashboard Midtrans, buka menu **Settings > Configuration**.
4. Tempelkan URL tersebut pada kolom **Payment Notification URL**.
5. Biarkan *Payment Notification Version* pada versi **2**.
6. Klik tombol **Update** di bagian bawah halaman Midtrans. Selesai!

---

## 3. Integrasi WhatsApp Notification Gateway

Notifikasi WhatsApp digunakan untuk mengirimkan rincian invoice tagihan, tautan QRIS bayar cepat, struk pembayaran lunas, dan peringatan isolir.

### Opsi Populer & Termudah: Fonnte Gateway
1. Daftar akun di [fonnte.com](https://fonnte.com).
2. Buka menu **Device**, scan QR Code menggunakan WhatsApp nomor kantor / helpdesk TCU.
3. Buka menu **API Token**, salin token API Anda.
4. Buka Dashboard TCU tab **WhatsApp Gateway**:
   * Pilih Driver: **Fonnte Gateway**.
   * API Endpoint: https://api.fonnte.com/send.
   * Masukkan Token API ke kolom **API Key**.
5. Uji coba dengan memasukkan nomor WhatsApp Anda di kolom tes, lalu klik **Kirim Test WA**.
6. Pesan konfirmasi akan langsung masuk ke WhatsApp Anda!

### Opsi Resmi Enterprise: Meta Cloud API (WhatsApp Business)
1. Buka [developers.facebook.com](https://developers.facebook.com).
2. Buat App jenis *Business*, tambahkan produk *WhatsApp*.
3. Salin **Phone Number ID** dan **Permanent System User Access Token**.
4. Masukkan ke Dashboard TCU tab **WhatsApp Gateway** (Pilih Driver: *Meta Cloud API*).

---

## 4. Integrasi Telegram Bot (Khusus Tim NOC & Finance)

Telegram Bot adalah saluran **100% gratis, tanpa kuota, dan berkecepatan tinggi** untuk memberi tahu tim internal jika ada gangguan jaringan atau uang masuk.

### Langkah 1: Buat Bot via @BotFather
1. Buka aplikasi Telegram di HP atau PC Anda.
2. Cari akun resmi **@BotFather** (ada centang biru).
3. Kirim pesan: /newbot.
4. Beri nama bot (contoh: *TopClass NOC Bot*), lalu buat username yang berakhiran bot (contoh: *TopClass_NOC_Bot*).
5. @BotFather akan membalas dengan memberikan **HTTP API Token** (format: 123456789:ABCdefGhIJKlmNoPQRstuvWXyz).
6. Salin token tersebut ke Dashboard TCU tab **Telegram Bot**.

### Langkah 2: Dapatkan Chat ID Grup Telegram
1. Buat grup Telegram baru, misalnya bernama **TCU - NOC Network Alerts** atau **TCU - Finance Alerts**.
2. Masukkan Bot yang baru saja Anda buat ke dalam grup tersebut.
3. Masukkan bot pembantu **@RawDataBot** ke dalam grup tersebut sebentar.
4. @RawDataBot akan menampilkan data JSON. Cari baris id: -100xxxxxxxxxx. Angka minus panjang tersebut adalah **Chat ID Grup Anda**.
5. Hapus @RawDataBot dari grup.
6. Masukkan Chat ID tersebut ke kolom **Chat ID Grup NOC** atau **Chat ID Grup Finance** di dashboard TCU.
7. Klik tombol **Kirim Test Telegram** untuk memverifikasi!

---

## 5. Integrasi Google Chat Space (Helpdesk & Manajemen)

Jika kantor PT Top Class Universal menggunakan Google Workspace:
1. Buka **Google Chat** (mail.google.com/chat).
2. Masuk ke Ruang (*Space*) koordinasi tim Anda (contoh: *#NOC-Helpdesk*).
3. Klik judul Space di bagian atas > pilih **Apps & Integrations**.
4. Pilih **Manage webhooks** > klik **Add webhook**.
5. Beri nama webhook (misal: *TCU Alert Engine*), lalu klik **Save**.
6. Salin link Webhook URL yang dihasilkan.
7. Masukkan ke Dashboard TCU tab **Google Chat**, lalu klik **Kirim Pesan Uji Coba**.

---

## 6. Integrasi Server Email (SMTP)

Digunakan untuk mengirimkan tanda terima resmi berformat PDF ke email pelanggan dan arsip accounting.

| Parameter | Mail Server Lokal (Postfix) | Google Workspace / Gmail |
| :--- | :--- | :--- |
| **SMTP Host** | 10.0.10.10 atau mail.topclassuniversal.com | smtp.gmail.com |
| **SMTP Port** | 587 (STARTTLS) atau 465 (SSL) | 587 |
| **Username** | illing@topclassuniversal.com | email kantor Anda |
| **Password** | Password mailbox email | *App Password* (Dibuat dari Akun Google > Security) |
| **From Name** | PT Top Class Universal <billing@...> | PT Top Class Universal |

---

## 7. Matriks Distribusi Event Notifikasi

Di tab **Matriks Notifikasi**, Anda dapat mencentang saluran mana saja yang aktif untuk tiap skenario:

* **Tagihan Baru Terbit & Pengingat H-3:** $\rightarrow$ Dikirim ke **WhatsApp** & **Email** Pelanggan.
* **Pembayaran Diterima (Lunas):** $\rightarrow$ Dikirim ke **WhatsApp Pelanggan** (Struk) dan **Telegram Grup Finance** (Info Kasir).
* **NOC Alert (Laser Drop / OLT Loss / Baterai DC < 46.5V):** $\rightarrow$ Dikirim ke **Telegram Grup NOC** dan **Google Chat Space**.
