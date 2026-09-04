// pages/technician/index.js — Portal Teknisi
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const STATUS_BADGE = {
  ONLINE: 'bg-green-100 text-green-700',
  OFFLINE: 'bg-gray-100 text-gray-500',
  DEGRADED: 'bg-yellow-100 text-yellow-700',
  PROVISIONING: 'bg-blue-100 text-blue-700',
};

export default function TechnicianPortal({ session, devices }) {
  const degraded = devices.filter(d => d.status === 'DEGRADED');
  const offline = devices.filter(d => d.status === 'OFFLINE');

  return (
    <Layout title="Portal Teknisi">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TCU Platform — Portal Teknisi</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">TECHNICIAN</span>
            <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-red-600">Keluar</Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto mt-6 px-4 pb-12">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-700">{degraded.length}</div>
              <div className="text-xs text-yellow-600 mt-1">Perangkat Degraded</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-700">{offline.length}</div>
              <div className="text-xs text-red-600 mt-1">Perangkat Offline</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-700">{devices.filter(d => d.status === 'ONLINE').length}</div>
              <div className="text-xs text-green-600 mt-1">Perangkat Online</div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Link href="/admin/devices" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
              <div className="text-2xl mb-2">📡</div>
              <div className="font-semibold text-gray-800">Semua Perangkat</div>
              <div className="text-sm text-gray-500 mt-1">Lihat & kelola OLT/ONU/CPE</div>
            </Link>
            <Link href="/admin/customers" className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
              <div className="text-2xl mb-2">👥</div>
              <div className="font-semibold text-gray-800">Pelanggan</div>
              <div className="text-sm text-gray-500 mt-1">Cari & lihat data pelanggan</div>
            </Link>
          </div>

          {/* Devices needing attention */}
          {(degraded.length > 0 || offline.length > 0) && (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-gray-800">⚠️ Perangkat Perlu Perhatian</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Serial</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pelanggan</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...degraded, ...offline].slice(0, 20).map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{d.serialNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{d.type}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{d.ipAddress || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{d.customer?.fullName || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[d.status] || ''}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

  let devices = [];
  try {
    const apiBase = process.env.BACKEND_API_URL || 'http://localhost:3000';
    const res = await fetch(
      `${apiBase}/api/devices?limit=100`,
      { headers: { Authorization: `Bearer ${session.accessToken || ""}` } }
    );
    if (res.ok) {
      const data = await res.json();
      devices = data.data || [];
    }
  } catch {}

  return { props: { session, devices } };
}
