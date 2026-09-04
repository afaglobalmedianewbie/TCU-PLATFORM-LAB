// pages/admin/billing.js — Manajemen Billing (Admin)
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

export default function AdminBilling({ session, invoices, total, page, limit }) {
  return (
    <Layout title="Manajemen Billing">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-blue-600 text-sm">← Admin</Link>
            <h1 className="text-xl font-bold text-gray-900">Billing</h1>
          </div>
          <span className="text-sm text-gray-500">{session?.user?.email}</span>
        </header>

        <main className="max-w-6xl mx-auto mt-6 px-4 pb-12">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <span className="text-sm text-gray-500">Total: {total} invoice</span>
              <div className="flex gap-2">
                <Link href="?status=UNPAID" className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-100">Belum Bayar</Link>
                <Link href="?status=OVERDUE" className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full hover:bg-red-100">Terlambat</Link>
                <Link href="?status=PAID" className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-100">Lunas</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pelanggan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paket</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jatuh Tempo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{inv.customer?.fullName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.plan?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-900 font-mono">{formatRupiah(inv.amountIdr)}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(inv.dueDate).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] || ''}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada invoice</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              {page > 1 && (
                <Link href={`/admin/billing?page=${page - 1}`} className="text-blue-600 text-sm hover:underline">← Sebelumnya</Link>
              )}
              <span className="text-xs text-gray-400 mx-auto">Halaman {page}</span>
              {invoices.length === limit && (
                <Link href={`/admin/billing?page=${page + 1}`} className="text-blue-600 text-sm hover:underline">Berikutnya →</Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
  if (!['ADMIN', 'NOC'].includes(session.user.role)) {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  const page = parseInt(context.query.page || '1', 10);
  const limit = 20;
  const status = context.query.status || '';
  let invoices = [], total = 0;

  try {
    const apiBase = process.env.BACKEND_API_URL || 'http://localhost:3000';
    const qs = new URLSearchParams({ page, limit, ...(status && { status }) }).toString();
    const res = await fetch(
      `${apiBase}/api/billing/invoices?${qs}`,
      { headers: { Authorization: `Bearer ${session.accessToken || ""}` } }
    );
    if (res.ok) {
      const data = await res.json();
      invoices = data.data || [];
      total = data.total || 0;
    }
  } catch {}

  return { props: { session, invoices, total, page, limit } };
}
