// pages/admin/devices.js — Manajemen Perangkat (Admin)
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const STATUS_BADGE = {
  ONLINE: 'bg-green-100 text-green-700',
  OFFLINE: 'bg-gray-100 text-gray-500',
  DEGRADED: 'bg-yellow-100 text-yellow-700',
  PROVISIONING: 'bg-blue-100 text-blue-700',
};

const TYPE_BADGE = {
  ONU: 'bg-indigo-50 text-indigo-700',
  OLT: 'bg-purple-50 text-purple-700',
  CPE: 'bg-teal-50 text-teal-700',
  SWITCH: 'bg-orange-50 text-orange-700',
};

export default function AdminDevices({ session, devices, total, page, limit }) {
  return (
    <Layout title="Manajemen Perangkat">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-500 hover:text-blue-600 text-sm">← Admin</Link>
            <h1 className="text-xl font-bold text-gray-900">Perangkat</h1>
          </div>
          <span className="text-sm text-gray-500">{session?.user?.email}</span>
        </header>

        <main className="max-w-6xl mx-auto mt-6 px-4 pb-12">
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <span className="text-sm text-gray-500">Total: {total} perangkat</span>
              <div className="flex gap-2">
                <Link href="?status=ONLINE" className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full hover:bg-green-100">Online</Link>
                <Link href="?status=OFFLINE" className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100">Offline</Link>
                <Link href="?status=DEGRADED" className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full hover:bg-yellow-100">Degraded</Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Serial</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pelanggan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Terakhir Terlihat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devices.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-700 text-xs">{d.serialNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[d.type] || ''}`}>{d.type}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{d.model || '—'}</td>
                      <td className="px-4 py-3 font-mono text-gray-600 text-xs">{d.ipAddress || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{d.customer?.fullName || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[d.status] || ''}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString('id-ID') : '—'}
                      </td>
                    </tr>
                  ))}
                  {devices.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Belum ada perangkat terdaftar</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              {page > 1 && (
                <Link href={`/admin/devices?page=${page - 1}`} className="text-blue-600 text-sm hover:underline">← Sebelumnya</Link>
              )}
              <span className="text-xs text-gray-400 mx-auto">Halaman {page}</span>
              {devices.length === limit && (
                <Link href={`/admin/devices?page=${page + 1}`} className="text-blue-600 text-sm hover:underline">Berikutnya →</Link>
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
  const status = context.query.status || '';
  let devices = [], total = 0;

  try {
    const apiBase = process.env.BACKEND_API_URL || 'http://localhost:3000';
    const qs = new URLSearchParams({ page, limit, ...(status && { status }) }).toString();
    const res = await fetch(
      `${apiBase}/api/devices?${qs}`,
      { headers: { Authorization: `Bearer ${session.accessToken || ""}` } }
    );
    if (res.ok) {
      const data = await res.json();
      devices = data.data || [];
      total = data.total || 0;
    }
  } catch {}

  return { props: { session, devices, total, page, limit } };
}
