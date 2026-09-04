// pages/admin/index.js — Admin Control Portal
import { getSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../../components/Layout';

const adminMenus = [
  { label: 'Pelanggan', href: '/admin/customers', icon: '👥', desc: 'Manajemen data pelanggan' },
  { label: 'Billing', href: '/admin/billing', icon: '💰', desc: 'Invoice & pembayaran' },
  { label: 'Perangkat', href: '/admin/devices', icon: '📡', desc: 'OLT/ONU/CPE/Switch' },
  { label: 'Jaringan', href: '/network', icon: '🌐', desc: 'Sesi RADIUS & statistik' },
  { label: 'Monitoring', href: '/monitoring', icon: '📊', desc: 'Prometheus & Grafana' },
  { label: 'Audit Log', href: '/admin/audit', icon: '🔍', desc: 'Riwayat aktivitas sistem' },
];

export default function AdminPortal({ session, stats }) {
  return (
    <Layout title="Admin Portal">
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TCU Platform — Admin Portal</h1>
            <p className="text-xs text-gray-500 mt-0.5">Integrated ISP Operations Platform v10</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">ADMIN</span>
            <Link href="/api/auth/signout" className="text-sm text-gray-500 hover:text-red-600">Keluar</Link>
          </div>
        </header>

        {stats && (
          <div className="max-w-6xl mx-auto mt-6 px-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Pelanggan Aktif" value={stats.activeCustomers} color="blue" />
            <StatCard label="Invoice Belum Bayar" value={stats.unpaidInvoices} color="yellow" />
            <StatCard label="Device Online" value={stats.onlineDevices} color="green" />
            <StatCard label="Sesi RADIUS Aktif" value={stats.activeSessions} color="purple" />
          </div>
        )}

        <main className="max-w-6xl mx-auto mt-6 px-4 grid grid-cols-2 sm:grid-cols-3 gap-4 pb-12">
          {adminMenus.map(item => (
            <Link key={item.href} href={item.href}
              className="bg-white rounded-xl shadow p-6 hover:shadow-md transition group">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-semibold text-gray-900 group-hover:text-blue-600 text-lg">{item.label}</div>
              <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
            </Link>
          ))}
        </main>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.blue}`}>
      <div className="text-2xl font-bold">{value ?? '—'}</div>
      <div className="text-xs mt-1 opacity-80">{label}</div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
  if (session.user.role !== 'ADMIN') return { redirect: { destination: '/dashboard', permanent: false } };

  let stats = null;
  try {
    const apiBase = process.env.BACKEND_API_URL || 'http://localhost:3000';
    const headers = { Authorization: `Bearer ${session.accessToken || ""}` };
    const res = await fetch(`${apiBase}/api/network/stats`, { headers });
    if (res.ok) stats = await res.json();
  } catch {}

  return { props: { session, stats } };
}
