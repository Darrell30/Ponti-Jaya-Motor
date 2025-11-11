// app/layout.tsx

import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
// 1. Hapus import NavbarGuest dan FooterGuest
// 2. Import LayoutRenderer yang baru
import LayoutRenderer from './components/LayoutRenderer';

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
  return (
    <html lang="id">
      <body 
        className={roboto.className} 
        suppressHydrationWarning={true}
      >
        {/* 3. Panggil LayoutRenderer di sini.
             Dia yang akan memutuskan apakah Navbar/Footer perlu tampil.
        */}
        <LayoutRenderer>
          {children}
        </LayoutRenderer>
      </body>
    </html>
  );
}