// pages/customer/index.js — Portal Self-Service Pelanggan
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const STATUS_BADGE = {
  UNPAID: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export default function CustomerPortal({ session, customer, invoices }) {
  const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE');

  return (
    <Layout title="Portal Pelanggan">
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TCU Platform</h1>
            <p className="text-xs text-gray-500">Portal Pelanggan</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-red-600">Keluar</Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto mt-6 px-4 pb-12 space-y-6">
          {/* Profile Card */}
          {customer && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Informasi Akun</h2>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Nama</dt>
                  <dd className="font-medium text-gray-900">{customer.fullName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status Layanan</dt>
                  <dd>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      customer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{customer.status}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Paket</dt>
                  <dd className="font-medium text-gray-900">{customer.plan?.name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Kecepatan</dt>
                  <dd className="font-medium text-gray-900">{customer.plan ? `${customer.plan.speedMbps} Mbps` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Telepon</dt>
                  <dd className="text-gray-700">{customer.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Alamat</dt>
                  <dd className="text-gray-700">{customer.address || '—'}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Unpaid Invoices Alert */}
          {unpaidInvoices.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-800">Tagihan Belum Dibayar</div>
                <div className="text-sm text-yellow-700 mt-1">
                  Anda memiliki {unpaidInvoices.length} tagihan yang belum dilunasi.
                  Segera lakukan pembayaran untuk menghindari pemutusan layanan.
                </div>
              </div>
            </div>
          )}

          {/* Invoice History */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Riwayat Tagihan</h2>
            </div>
            <div className="divide-y">
              {invoices.map(inv => (
                <div key={inv.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{formatRupiah(inv.amountIdr)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Periode: {new Date(inv.periodStart).toLocaleDateString('id-ID')} — {new Date(inv.periodEnd).toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-xs text-gray-500">Jatuh Tempo: {new Date(inv.dueDate).toLocaleDateString('id-ID')}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] || ''}`}>
                    {inv.status === 'UNPAID' ? 'Belum Bayar' : inv.status === 'PAID' ? 'Lunas' : inv.status === 'OVERDUE' ? 'Terlambat' : inv.status}
                  </span>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">Belum ada riwayat tagihan</div>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-gray-400">
            Hubungi support jika ada kendala: support@tcu-platform.local
          </div>
        </main>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };

  let customer = null, invoices = [];

  try {
    const apiBase = process.env.BACKEND_API_URL || 'http://localhost:3000';
    const headers = { Authorization: `Bearer ${session.accessToken || ""}` };

    // Fetch customer profile linked to this user
    const customerRes = await fetch(`${apiBase}/api/customers?userId=${session.user.id}&limit=1`, { headers });
    if (customerRes.ok) {
      const data = await customerRes.json();
      customer = data.data?.[0] || null;
    }

    if (customer) {
      const invoiceRes = await fetch(`${apiBase}/api/billing/invoices?customerId=${customer.id}&limit=12`, { headers });
      if (invoiceRes.ok) {
        const data = await invoiceRes.json();
        invoices = data.data || [];
      }
    }
  } catch {}

  return { props: { session, customer, invoices } };
}
