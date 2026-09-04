// components/Layout.js — shared layout wrapper
import Head from 'next/head';

export default function Layout({ title, children }) {
  return (
    <>
      <Head>
        <title>{title ? `${title} — TCU Platform` : 'TCU Platform'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      {children}
    </>
  );
}
