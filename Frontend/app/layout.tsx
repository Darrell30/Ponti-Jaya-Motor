// app/layout.tsx

import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import LayoutRenderer from './components/LayoutRenderer';
import Script from 'next/script'; 

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'] 
});

export const metadata: Metadata = {
  title: 'Ponti Jaya Motor',
  description: 'Aplikasi Bengkel & Sparepart',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

  return (
    <html lang="id">
      <body 
        className={roboto.className} 
        suppressHydrationWarning={true}
      >
        {/* 2. TAMBAHKAN SCRIPT MIDTRANS DI SINI */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          strategy="beforeInteractive"
          data-client-key={midtransClientKey}
        />
        {/* ------------------------------- */}
        
        <LayoutRenderer>
          {children}
        </LayoutRenderer>
      </body>
    </html>
  );
}