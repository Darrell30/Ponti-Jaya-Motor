// app/components/LayoutRenderer.tsx
'use client'; 

import { usePathname } from 'next/navigation';
import NavbarGuest from './NavbarGuest';
import FooterGuest from './FooterGuest';
import NavbarProdukGuest from './NavbarProdukGuest'; // <-- 1. IMPORT NAVBAR PRODUK

export default function LayoutRenderer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  
  // 2. TAMBAHKAN PENGECEKAN BARU INI
  const isProdukPage = pathname.startsWith('/produk');

  if (isAdminPage) {
    // 3. Jika admin, jangan tampilkan layout
    return <>{children}</>;
  }

  // 4. LOGIKA BARU UNTUK RENDER BERSYARAT
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      
      {/* Jika ini halaman produk, tampilkan NavbarProdukGuest.
        Jika tidak (misal: homepage), tampilkan NavbarGuest.
      */}
      {isProdukPage ? <NavbarProdukGuest /> : <NavbarGuest />}

      <main className="flex-grow-1">
        {children}
      </main>
      
      <FooterGuest />
    </div>
  );
}