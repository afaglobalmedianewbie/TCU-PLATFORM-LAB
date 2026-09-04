// pages/admin/settings/integrations.js — Dynamic Integration & Webhook Hub with Step-by-Step Guides
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import axios from 'axios';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('payment');
  const [copiedKey, setCopiedKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  // Form State
  const [settings, setSettings] = useState({
    // Payment Midtrans
    MIDTRANS_SERVER_KEY: '',
    MIDTRANS_CLIENT_KEY: '',
    MIDTRANS_MERCHANT_ID: '',
    MIDTRANS_IS_PROD: 'false',
    // Payment Xendit
    XENDIT_SECRET_KEY: '',
    XENDIT_WEBHOOK_TOKEN: '',
    ACTIVE_PAYMENT_GATEWAY: 'MIDTRANS',
    // WhatsApp
    WA_PROVIDER: 'FONNTE',
    WA_API_URL: 'https://api.fonnte.com/send',
    WA_API_KEY: '',
    WA_META_PHONE_ID: '',
    // SMTP
    SMTP_HOST: '',
    SMTP_PORT: '587',
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: 'billing@topclassuniversal.com',
    // Telegram
    TELEGRAM_BOT_TOKEN: '',
    TELEGRAM_CHAT_ID_NOC: '',
    TELEGRAM_CHAT_ID_FINANCE: '',
    // Google Chat
    GOOGLE_CHAT_WEBHOOK_URL: '',
    // Routing toggles
    NOTIF_CUSTOMER_WA: 'true',
    NOTIF_CUSTOMER_EMAIL: 'true',
    NOTIF_FINANCE_TELEGRAM: 'true',
    NOTIF_NOC_TELEGRAM: 'true',
    NOTIF_NOC_GOOGLE_CHAT: 'true'
  });

  const [webhooks, setWebhooks] = useState({
    midtrans: 'http://localhost:3000/api/billing/webhook/midtrans',
    xendit: 'http://localhost:3000/api/billing/webhook/xendit'
  });

  const [testTarget, setTestTarget] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings/integrations');
      if (res.data.settings) {
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      }
      if (res.data.webhooks) {
        setWebhooks(res.data.webhooks);
      }
    } catch (err) {
      console.warn('Gagal memuat settings (menggunakan default)', err.message);
    }
  };

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);
    try {
      await axios.post('/api/settings/integrations', settings);
      setSaveStatus({ success: true, message: 'Semua pengaturan integrasi berhasil disimpan ke database!' });
    } catch (err) {
      setSaveStatus({ success: false, message: 'Gagal menyimpan pengaturan: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (channel) => {
    setTestStatus({ loading: true, message: 'Mengirim pesan uji coba...' });
    try {
      const res = await axios.post('/api/settings/integrations/test', {
        channel,
        target: testTarget
      });
      setTestStatus({ success: res.data.success, message: res.data.message });
    } catch (err) {
      setTestStatus({ success: false, message: 'Gagal: ' + (err.response?.data?.error || err.message) });
    }
  };

  return (
    <Layout title=Pengaturan Integrasi & Webhook>
      <div className=min-h-screen bg-gray-50 pb-16>
        {/* Header */}
        <header className=bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm>
          <div className=flex items-center gap-4>
            <Link href=/admin className=text-gray-500 hover:text-gray-700>
              ← Kembali ke Dashboard
            </Link>
            <span className=text-gray-300>|</span>
            <div>
              <h1 className=text-xl font-bold text-gray-900>Pusat Integrasi & Notifikasi Dinamis</h1>
              <p className=text-xs text-gray-500>Konfigurasi Gateway, Webhook Callbacks, dan Kanal Notifikasi</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className=bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition flex items-center gap-2
          >
            {loading ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
          </button>
        </header>

        {saveStatus && (
          <div className={max-w-6xl mx-auto mt-4 px-4 py-3 rounded-lg text-sm font-medium }>
            {saveStatus.message}
          </div>
        )}

        <div className=max-w-6xl mx-auto mt-6 px-4>
          {/* Navigation Tabs */}
          <div className=flex border-b border-gray-200 gap-2 overflow-x-auto bg-white p-2 rounded-xl shadow-sm mb-6>
            <TabBtn id=payment label=💳 Payment Gateway active={activeTab} set={setActiveTab} />
            <TabBtn id=whatsapp label=💬 WhatsApp Gateway active={activeTab} set={setActiveTab} />
            <TabBtn id=email label=✉️ Email (SMTP) active={activeTab} set={setActiveTab} />
            <TabBtn id=telegram label=✈️ Telegram Bot active={activeTab} set={setActiveTab} />
            <TabBtn id=googlechat label=🏢 Google Chat active={activeTab} set={setActiveTab} />
            <TabBtn id=routing label=🔀 Matriks Notifikasi active={activeTab} set={setActiveTab} />
          </div>

          {/* TAB 1: PAYMENT GATEWAY */}
          {activeTab === 'payment' && (
            <div className=space-y-6>
              {/* Webhook Callback Banner */}
              <div className=bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg>
                <h3 className=text-lg font-bold flex items-center gap-2>🔗 Webhook Callback URLs (Salin ke Portal Gateway)</h3>
                <p className=text-sm text-blue-200 mt-1>
                  Tempelkan URL di bawah ini ke dashboard Midtrans atau Xendit agar pelunasan tagihan otomatis terverifikasi detik itu juga dan mengaktifkan kembali koneksi pelanggan.
                </p>
                <div className=mt-4 grid grid-cols-1 md:grid-cols-2 gap-4>
                  <div className=bg-white/10 p-4 rounded-xl border border-white/20>
                    <div className=text-xs text-blue-300 font-semibold uppercase>Midtrans Notification URL</div>
                    <div className=mt-1 flex items-center justify-between font-mono text-xs bg-black/40 p-2 rounded border border-white/10>
                      <span className=truncate>{webhooks.midtrans}</span>
                      <button
                        onClick={() => handleCopy('midtrans', webhooks.midtrans)}
                        className=ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-sans whitespace-nowrap
                      >
                        {copiedKey === 'midtrans' ? '✓ Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                  <div className=bg-white/10 p-4 rounded-xl border border-white/20>
                    <div className=text-xs text-blue-300 font-semibold uppercase>Xendit Webhook URL</div>
                    <div className=mt-1 flex items-center justify-between font-mono text-xs bg-black/40 p-2 rounded border border-white/10>
                      <span className=truncate>{webhooks.xendit}</span>
                      <button
                        onClick={() => handleCopy('xendit', webhooks.xendit)}
                        className=ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-sans whitespace-nowrap
                      >
                        {copiedKey === 'xendit' ? '✓ Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Settings */}
              <div className=bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6>
                <div>
                  <h4 className=font-bold text-gray-900 mb-4 flex items-center gap-2>⚙️ Gateway Aktif & Mode</h4>
                  <div className=space-y-4>
                    <div>
                      <label className=block text-sm font-medium text-gray-700>Pilih Payment Gateway Utama</label>
                      <select
                        value={settings.ACTIVE_PAYMENT_GATEWAY}
                        onChange={(e) => handleChange('ACTIVE_PAYMENT_GATEWAY', e.target.value)}
                        className=mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border
                      >
                        <option value=MIDTRANS>Midtrans (Snap QRIS & Virtual Account)</option>
                        <option value=XENDIT>Xendit (Invoice & e-Wallet)</option>
                        <option value=MANUAL>Manual Transfer Saja</option>
                      </select>
                    </div>
                    <div>
                      <label className=block text-sm font-medium text-gray-700>Environment Mode Midtrans</label>
                      <select
                        value={settings.MIDTRANS_IS_PROD}
                        onChange={(e) => handleChange('MIDTRANS_IS_PROD', e.target.value)}
                        className=mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border
                      >
                        <option value=false>Sandbox (Uji Coba)</option>
                        <option value=true>Production (Live Transaksi Nyata)</option>
                      </select>
                    </div>
                  </div>

                  <h4 className=font-bold text-gray-900 mt-6 mb-4>🔑 Kredensial Midtrans</h4>
                  <div className=space-y-3>
                    <Field label=Server Key val={settings.MIDTRANS_SERVER_KEY} set={(v) => handleChange('MIDTRANS_SERVER_KEY', v)} placeholder=SB-Mid-server-... secret />
                    <Field label=Client Key val={settings.MIDTRANS_CLIENT_KEY} set={(v) => handleChange('MIDTRANS_CLIENT_KEY', v)} placeholder=SB-Mid-client-... />
                    <Field label=Merchant ID val={settings.MIDTRANS_MERCHANT_ID} set={(v) => handleChange('MIDTRANS_MERCHANT_ID', v)} placeholder=M123456 />
                  </div>
                </div>

                <div>
                  <h4 className=font-bold text-gray-900 mb-4>🔑 Kredensial Xendit</h4>
                  <div className=space-y-3>
                    <Field label=Secret API Key val={settings.XENDIT_SECRET_KEY} set={(v) => handleChange('XENDIT_SECRET_KEY', v)} placeholder=xnd_development_... secret />
                    <Field label=Webhook Verification Token val={settings.XENDIT_WEBHOOK_TOKEN} set={(v) => handleChange('XENDIT_WEBHOOK_TOKEN', v)} placeholder=Token verifikasi xendit callback secret />
                  </div>

                  {/* Step by step guide */}
                  <div className=mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100>
                    <h5 className=font-bold text-blue-900 text-sm mb-2>📖 Panduan Step-by-Step Integrasi Midtrans:</h5>
                    <ol className=text-xs text-blue-800 space-y-1.5 list-decimal list-inside>
                      <li>Buka portal <strong>dashboard.midtrans.com</strong> dan login.</li>
                      <li>Pilih menu <strong>Settings &gt; Access Keys</strong> untuk menyalin Server Key & Client Key.</li>
                      <li>Pilih menu <strong>Settings &gt; Configuration</strong>.</li>
                      <li>Tempelkan URL Midtrans Webhook di atas ke kolom <strong>Payment Notification URL</strong>.</li>
                      <li>Simpan perubahan di portal Midtrans. Selesai!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP GATEWAY */}
          {activeTab === 'whatsapp' && (
            <div className=bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6>
              <div>
                <h4 className=font-bold text-gray-900 mb-4>💬 Konfigurasi WhatsApp Engine</h4>
                <div className=space-y-4>
                  <div>
                    <label className=block text-sm font-medium text-gray-700>Driver WhatsApp</label>
                    <select
                      value={settings.WA_PROVIDER}
                      onChange={(e) => handleChange('WA_PROVIDER', e.target.value)}
                      className=mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border
                    >
                      <option value=FONNTE>Fonnte Gateway (Sangat Mudah & Populer)</option>
                      <option value=META>Meta Cloud API (Official WhatsApp Business)</option>
                      <option value=GENERIC>Generic HTTP Webhook (Waha / Baileys)</option>
                    </select>
                  </div>
                  <Field label=API Endpoint URL val={settings.WA_API_URL} set={(v) => handleChange('WA_API_URL', v)} placeholder=https://api.fonnte.com/send />
                  <Field label=API Key / Token val={settings.WA_API_KEY} set={(v) => handleChange('WA_API_KEY', v)} placeholder=Token API WhatsApp secret />
                  {settings.WA_PROVIDER === 'META' && (
                    <Field label=Meta Phone Number ID val={settings.WA_META_PHONE_ID} set={(v) => handleChange('WA_META_PHONE_ID', v)} placeholder=1234567890 />
                  )}
                </div>

                <div className=mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200>
                  <h5 className=font-bold text-sm text-gray-800 mb-2>🧪 Uji Coba Kirim Pesan</h5>
                  <div className=flex gap-2>
                    <input
                      type=text
                      placeholder=Nomor WA Tujuan (cth: 081234567890)
                      value={testTarget}
                      onChange={(e) => setTestTarget(e.target.value)}
                      className=flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                    />
                    <button
                      onClick={() => handleTest('whatsapp')}
                      className=bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm
                    >
                      Kirim Test WA
                    </button>
                  </div>
                  {testStatus && <p className=text-xs mt-2 text-gray-600>{testStatus.message}</p>}
                </div>
              </div>

              <div>
                <div className=p-4 bg-green-50 rounded-xl border border-green-100>
                  <h5 className=font-bold text-green-900 text-sm mb-2>📖 Panduan Step-by-Step WhatsApp Gateway (Fonnte):</h5>
                  <ol className=text-xs text-green-800 space-y-2 list-decimal list-inside>
                    <li>Daftar akun gratis di <strong>fonnte.com</strong>.</li>
                    <li>Hubungkan nomor WhatsApp kantor TCU dengan scan QR code di menu Device.</li>
                    <li>Salin <strong>API Token</strong> dari dashboard Fonnte ke kolom API Key di samping.</li>
                    <li>Masukkan nomor HP Anda di kotak uji coba lalu klik <strong>Kirim Test WA</strong>.</li>
                    <li>Jika pesan masuk di WhatsApp Anda, integrasi 100% aktif!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL (SMTP) */}
          {activeTab === 'email' && (
            <div className=bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6>
              <div>
                <h4 className=font-bold text-gray-900 mb-4>✉️ Pengaturan Server Email (SMTP)</h4>
                <div className=space-y-3>
                  <Field label=SMTP Host val={settings.SMTP_HOST} set={(v) => handleChange('SMTP_HOST', v)} placeholder=mail.topclassuniversal.com atau smtp.gmail.com />
                  <Field label=SMTP Port val={settings.SMTP_PORT} set={(v) => handleChange('SMTP_PORT', v)} placeholder=587 (TLS) atau 465 (SSL) />
                  <Field label=Username / Email Akun val={settings.SMTP_USER} set={(v) => handleChange('SMTP_USER', v)} placeholder=billing@topclassuniversal.com />
                  <Field label=Password Akun val={settings.SMTP_PASS} set={(v) => handleChange('SMTP_PASS', v)} placeholder=Password atau App Password secret />
                  <Field label=Alamat Pengirim (From) val={settings.SMTP_FROM} set={(v) => handleChange('SMTP_FROM', v)} placeholder=PT Top Class Universal <billing@topclassuniversal.com> />
                </div>

                <div className=mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200>
                  <h5 className=font-bold text-sm text-gray-800 mb-2>🧪 Uji Coba Kirim Email</h5>
                  <div className=flex gap-2>
                    <input
                      type=email
                      placeholder=Email Penerima Uji Coba
                      value={testTarget}
                      onChange={(e) => setTestTarget(e.target.value)}
                      className=flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                    />
                    <button
                      onClick={() => handleTest('email')}
                      className=bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm
                    >
                      Kirim Test Email
                    </button>
                  </div>
                  {testStatus && <p className=text-xs mt-2 text-gray-600>{testStatus.message}</p>}
                </div>
              </div>

              <div>
                <div className=p-4 bg-blue-50 rounded-xl border border-blue-100>
                  <h5 className=font-bold text-blue-900 text-sm mb-2>📖 Panduan Step-by-Step Server Email:</h5>
                  <ol className=text-xs text-blue-800 space-y-2 list-decimal list-inside>
                    <li><strong>Mail Server Sendiri (Postfix):</strong> Masukkan Host 10.0.10.10 atau mail.topclassuniversal.com, Port 587.</li>
                    <li><strong>Google Workspace / Gmail:</strong> Masukkan Host smtp.gmail.com, Port 587. Wajib gunakan <em>App Password</em> (bukan password login biasa).</li>
                    <li>Email ini akan digunakan untuk mengirim tagihan PDF resmi dan kwitansi pelunasan.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEGRAM BOT */}
          {activeTab === 'telegram' && (
            <div className=bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6>
              <div>
                <h4 className=font-bold text-gray-900 mb-4>✈️ Konfigurasi Telegram Bot (NOC & Finance)</h4>
                <div className=space-y-3>
                  <Field label=Bot Token (dari @BotFather) val={settings.TELEGRAM_BOT_TOKEN} set={(v) => handleChange('TELEGRAM_BOT_TOKEN', v)} placeholder=123456789:ABCdefGhIJKlmNoPQRstuvWXyz secret />
                  <Field label=Chat ID Grup NOC (Alert Gangguan/Redaman) val={settings.TELEGRAM_CHAT_ID_NOC} set={(v) => handleChange('TELEGRAM_CHAT_ID_NOC', v)} placeholder=-1001234567890 />
                  <Field label=Chat ID Grup Finance (Alert Uang Masuk) val={settings.TELEGRAM_CHAT_ID_FINANCE} set={(v) => handleChange('TELEGRAM_CHAT_ID_FINANCE', v)} placeholder=-1009876543210 />
                </div>

                <div className=mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200>
                  <h5 className=font-bold text-sm text-gray-800 mb-2>🧪 Uji Coba Kirim Telegram</h5>
                  <div className=flex gap-2>
                    <input
                      type=text
                      placeholder=Chat ID Target (atau biarkan kosong untuk default)
                      value={testTarget}
                      onChange={(e) => setTestTarget(e.target.value)}
                      className=flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                    />
                    <button
                      onClick={() => handleTest('telegram')}
                      className=bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg text-sm
                    >
                      Kirim Test Telegram
                    </button>
                  </div>
                  {testStatus && <p className=text-xs mt-2 text-gray-600>{testStatus.message}</p>}
                </div>
              </div>

              <div>
                <div className=p-4 bg-sky-50 rounded-xl border border-sky-100>
                  <h5 className=font-bold text-sky-900 text-sm mb-2>📖 Panduan Step-by-Step Telegram Bot (Gratis & Cepat):</h5>
                  <ol className=text-xs text-sky-800 space-y-2 list-decimal list-inside>
                    <li>Buka aplikasi Telegram, cari kontak <strong>@BotFather</strong>.</li>
                    <li>Kirim pesan <code>/newbot</code> dan ikuti petunjuk untuk memberi nama bot (misal: <em>TopClass_NOC_Bot</em>).</li>
                    <li>Salin <strong>HTTP API Token</strong> yang diberikan @BotFather ke kolom Bot Token di samping.</li>
                    <li>Buat Grup Telegram baru bersama tim teknisi/NOC, lalu masukkan Bot tersebut ke dalam grup.</li>
                    <li>Cari bot <strong>@RawDataBot</strong>, masukkan ke grup untuk melihat angka <strong>Chat ID</strong> grup (biasanya diawali tanda minus <code>-100...</code>).</li>
                    <li>Salin Chat ID ke kolom di samping dan klik <strong>Kirim Test Telegram</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE CHAT */}
          {activeTab === 'googlechat' && (
            <div className=bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6>
              <div>
                <h4 className=font-bold text-gray-900 mb-4>🏢 Konfigurasi Google Chat Space (Workspace)</h4>
                <div className=space-y-3>
                  <Field label=Incoming Webhook URL val={settings.GOOGLE_CHAT_WEBHOOK_URL} set={(v) => handleChange('GOOGLE_CHAT_WEBHOOK_URL', v)} placeholder=https://chat.googleapis.com/v1/spaces/.../messages?key=... secret />
                </div>

                <div className=mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200>
                  <h5 className=font-bold text-sm text-gray-800 mb-2>🧪 Uji Coba Kirim Google Chat</h5>
                  <button
                    onClick={() => handleTest('google_chat')}
                    className=bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm w-full
                  >
                    Kirim Pesan Uji Coba ke Space Google Chat
                  </button>
                  {testStatus && <p className=text-xs mt-2 text-gray-600>{testStatus.message}</p>}
                </div>
              </div>

              <div>
                <div className=p-4 bg-emerald-50 rounded-xl border border-emerald-100>
                  <h5 className=font-bold text-emerald-900 text-sm mb-2>📖 Panduan Step-by-Step Google Chat Webhook:</h5>
                  <ol className=text-xs text-emerald-800 space-y-2 list-decimal list-inside>
                    <li>Buka <strong>Google Chat</strong> (mail.google.com/chat) dengan akun Google Workspace kantor.</li>
                    <li>Buka Ruang (*Space*) tim Anda (misal: <em>#Helpdesk-TCU</em>).</li>
                    <li>Klik nama ruang di bagian atas &gt; pilih <strong>Apps & Integrations</strong>.</li>
                    <li>Pilih <strong>Manage webhooks</strong> &gt; klik <strong>Add webhook</strong>.</li>
                    <li>Beri nama (misal: <em>TCU Bot</em>) lalu klik <strong>Save</strong>.</li>
                    <li>Salin link webhook yang terbentuk ke kolom di samping. Selesai!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATION ROUTING */}
          {activeTab === 'routing' && (
            <div className=bg-white p-6 rounded-2xl shadow-sm border border-gray-200>
              <h4 className=font-bold text-gray-900 mb-2>🔀 Matriks Distribusi Notifikasi (Siapa Menerima Apa)</h4>
              <p className=text-sm text-gray-500 mb-6>Tentukan saluran mana yang aktif untuk setiap peristiwa sistem.</p>

              <div className=space-y-4 max-w-2xl>
                <CheckboxRow
                  title=Tagihan Baru Diterbitkan & Pengingat H-3
                  desc=Kirim rincian invoice dan tautan QRIS bayar cepat langsung ke kontak pelanggan
                  activeWa={settings.NOTIF_CUSTOMER_WA === 'true'}
                  setWa={(v) => handleChange('NOTIF_CUSTOMER_WA', v ? 'true' : 'false')}
                  activeEmail={settings.NOTIF_CUSTOMER_EMAIL === 'true'}
                  setEmail={(v) => handleChange('NOTIF_CUSTOMER_EMAIL', v ? 'true' : 'false')}
                />
                <CheckboxRow
                  title=Notifikasi Pembayaran Masuk (Lunas)
                  desc=Kirim struk pelunasan ke pelanggan serta notifikasi instan ke grup Telegram Finance
                  activeWa={true}
                  activeTelegram={settings.NOTIF_FINANCE_TELEGRAM === 'true'}
                  setTelegram={(v) => handleChange('NOTIF_FINANCE_TELEGRAM', v ? 'true' : 'false')}
                />
                <CheckboxRow
                  title=Gangguan Jaringan & Redaman Optik Drop (NOC Alert)
                  desc=Kirim alarm darurat jika OLT kehilangan sinyal PON, link CCR terputus, atau baterai 48V drop
                  activeTelegram={settings.NOTIF_NOC_TELEGRAM === 'true'}
                  setTelegram={(v) => handleChange('NOTIF_NOC_TELEGRAM', v ? 'true' : 'false')}
                  activeGchat={settings.NOTIF_NOC_GOOGLE_CHAT === 'true'}
                  setGchat={(v) => handleChange('NOTIF_NOC_GOOGLE_CHAT', v ? 'true' : 'false')}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function TabBtn({ id, label, active, set }) {
  const isSelected = active === id;
  return (
    <button
      onClick={() => set(id)}
      className={px-4 py-2.5 text-sm font-semibold rounded-lg transition whitespace-nowrap }
    >
      {label}
    </button>
  );
}

function Field({ label, val, set, placeholder, secret }) {
  return (
    <div>
      <label className=block text-xs font-semibold text-gray-700 uppercase tracking-wider>{label}</label>
      <input
        type={secret ? 'password' : 'text'}
        value={val || ''}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        className=mt-1 block w-full rounded-lg border-gray-300 shadow-sm p-2 text-sm border focus:ring-blue-500 focus:border-blue-500 font-mono
      />
    </div>
  );
}

function CheckboxRow({ title, desc, activeWa, setWa, activeEmail, setEmail, activeTelegram, setTelegram, activeGchat, setGchat }) {
  return (
    <div className=p-4 bg-gray-50 rounded-xl border border-gray-200>
      <div className=font-semibold text-gray-900 text-sm>{title}</div>
      <div className=text-xs text-gray-500 mt-0.5 mb-3>{desc}</div>
      <div className=flex flex-wrap gap-4 text-xs>
        {setWa && (
          <label className=flex items-center gap-1.5 cursor-pointer>
            <input type=checkbox checked={activeWa} onChange={(e) => setWa(e.target.checked)} className=rounded text-blue-600 />
            <span>WhatsApp</span>
          </label>
        )}
        {setEmail && (
          <label className=flex items-center gap-1.5 cursor-pointer>
            <input type=checkbox checked={activeEmail} onChange={(e) => setEmail(e.target.checked)} className=rounded text-blue-600 />
            <span>Email</span>
          </label>
        )}
        {setTelegram && (
          <label className=flex items-center gap-1.5 cursor-pointer>
            <input type=checkbox checked={activeTelegram} onChange={(e) => setTelegram(e.target.checked)} className=rounded text-blue-600 />
            <span>Telegram</span>
          </label>
        )}
        {setGchat && (
          <label className=flex items-center gap-1.5 cursor-pointer>
            <input type=checkbox checked={activeGchat} onChange={(e) => setGchat(e.target.checked)} className=rounded text-blue-600 />
            <span>Google Chat</span>
          </label>
        )}
      </div>
    </div>
  );
}
