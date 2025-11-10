// app/layout.tsx

// 1. IMPORT SEMUA YANG KITA PERLUKAN
import type { Metadata } from 'next';
import { Roboto } from 'next/font/google'; // <-- FONT ROBOTO
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // <-- ICON BOOTSTRAP
import NavbarGuest from './components/NavbarGuest'; // <-- IMPORT NAVBAR
import FooterGuest from './components/FooterGuest'; // <-- IMPORT FOOTER
import './globals.css';

// 2. INISIASI FONT ROBOTO
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
      {/* 3. TERAPKAN FONT & SUPPRESS WARNING */}
      <body 
        className={roboto.className} 
        suppressHydrationWarning={true}
      >
        {/* 4. BUAT STRUKTUR STICKY FOOTER */}
        <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
          
          {/* 5. LETAKKAN NAVBAR DI SINI (DI ATAS) */}
          <NavbarGuest />
          
          {/* 6. {children} ADALAH KONTEN HALAMAN ANDA (app/page.tsx)
               Biarkan ini di tengah, dibungkus <main>
          */}
          <main className="flex-grow-1">
            {children}
          </main>
          
          {/* 7. LETAKKAN FOOTER DI SINI (DI BAWAH) */}
          <FooterGuest />

        </div>
      </body>
    </html>
  );
}