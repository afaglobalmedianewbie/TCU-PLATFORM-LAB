// pages/dashboard.js — dashboard utama
import { getSession } from 'next-auth/react';
import Link from 'next/link';

export default function Dashboard({ session }) {
  const role = session?.user?.role || 'CUSTOMER';

  const portalLink = {
    ADMIN: '/admin',
    NOC: '/admin',
    TECHNICIAN: '/technician',
    CUSTOMER: '/customer',
  }[role] || '/customer';

  const menuItems = [
    { label: 'Admin Portal', href: '/admin', roles: ['ADMIN'] },
    { label: 'Portal Teknisi', href: '/technician', roles: ['TECHNICIAN'] },
    { label: 'Pelanggan', href: '/admin/customers', roles: ['ADMIN', 'NOC', 'TECHNICIAN'] },
    { label: 'Billing', href: '/admin/billing', roles: ['ADMIN', 'NOC'] },
    { label: 'Perangkat', href: '/admin/devices', roles: ['ADMIN', 'NOC', 'TECHNICIAN'] },
    { label: 'Jaringan', href: '/network', roles: ['ADMIN', 'NOC'] },
    { label: 'Layanan Saya', href: '/customer', roles: ['CUSTOMER'] },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">TCU Platform</h1>
        <span className="text-sm text-gray-600">{session?.user?.email} — <strong>{role}</strong></span>
      </header>
      <main className="max-w-4xl mx-auto mt-8 px-4">
        <div className="mb-4">
          <Link href={portalLink}
            className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition font-medium">
            Buka Portal {role === 'CUSTOMER' ? 'Pelanggan' : role === 'TECHNICIAN' ? 'Teknisi' : 'Admin'}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {menuItems
            .filter(item => item.roles.includes(role))
            .map(item => (
              <Link key={item.href} href={item.href}
                className="bg-white rounded-xl shadow p-6 text-center hover:shadow-md transition font-medium text-gray-800 hover:text-blue-600">
                {item.label}
              </Link>
            ))}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: '/auth/login', permanent: false } };
  return { props: { session } };
}
