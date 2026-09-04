// pages/admin/customers.js — Manajemen Pelanggan (Admin)
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const STATUS_BADGE = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-yellow-100 text-yellow-700',
  TERMINATED: 'bg-red-100 text-red-700',
};

export default function AdminCustomers({ session, customers, total, page, limit }) {
  return (
    <Layout title="Manajemen Pelanggan">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-blue-600 text-sm">← Admin</Link>
            <h1 className="text-xl font-bold text-gray-900">Pelanggan</h1>
          </div>
          <span className="text-sm text-gray-500">{session?.user?.email}</span>
        </header>

        <main className="max-w-6xl mx-auto mt-6 px-4 pb-12">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <span className="text-sm text-gray-500">Total: {total} pelanggan</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paket</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bergabung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.fullName}</td>
                      <td className="px-4 py-3 text-gray-600">{c.user?.email || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.plan?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[c.status] || ''}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada data pelanggan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              {page > 1 && (
                <Link href={`/admin/customers?page=${page - 1}`} className="text-blue-600 text-sm hover:underline">← Sebelumnya</Link>
              )}
              <span className="text-xs text-gray-400 mx-auto">Halaman {page}</span>
              {customers.length === limit && (
                <Link href={`/admin/customers?page=${page + 1}`} className="text-blue-600 text-sm hover:underline">Berikutnya →</Link>
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
  if (!['ADMIN', 'NOC', 'TECHNICIAN'].includes(session.user.role)) {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }

  const page = parseInt(context.query.page || '1', 10);
  const limit = 20;
  let customers = [], total = 0;

  try {
    const apiBase = process.env.BACKEND_API_URL || 'http://localhost:3000';
    const res = await fetch(
      `${apiBase}/api/customers?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${session.accessToken || ""}` } }
    );
    if (res.ok) {
      const data = await res.json();
      customers = data.data || [];
      total = data.total || 0;
    }
  } catch {}

  return { props: { session, customers, total, page, limit } };
}
