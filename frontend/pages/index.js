// pages/index.js — portal utama TCU Platform
import { getSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home({ session }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TCU Platform</h1>
        <p className="text-gray-500 mb-8">Integrated ISP Operations Platform v10</p>

        {session ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">Selamat datang, <strong>{session.user.email}</strong></p>
            <Link href="/dashboard" className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
              Masuk ke Dashboard
            </Link>
          </div>
        ) : (
          <Link href="/auth/login" className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  return { props: { session: session || null } };
}
