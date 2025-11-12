'use client'; 

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react'; // <-- IMPORT HOOK BARU

// Import SEMUA versi komponen
import NavbarGuest from './NavbarGuest';
import FooterGuest from './FooterGuest';
import NavbarProdukGuest from './NavbarProdukGuest';
import NavbarUser from './NavbarUser';
import FooterUser from './FooterUser';
import NavbarProdukUser from './NavbarProdukUser';

// HAPUS FUNGSI MOCK "getAuthStatus()"

export default function LayoutRenderer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // State untuk status login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // <-- State loading

  // Cek localStorage HANYA di client-side (setelah 'mount')
  useEffect(() => {
    // Kita cek flag "isUserLoggedIn" yang di-set oleh halaman login
    const userStatus = localStorage.getItem("isUserLoggedIn") === "true";
    setIsLoggedIn(userStatus);
    setIsAuthLoading(false); // Selesai loading
    
    // Cek ulang setiap kali URL berubah (misal: setelah login/logout)
  }, [pathname]);

  // Cek kondisi halaman
  const isAdminPage = pathname.startsWith('/admin');
  const isProdukPage = pathname.startsWith('/produk');

  // Saat sedang cek status auth, jangan render apa-apa
  // Ini mencegah "hydration mismatch"
  if (isAuthLoading) {
    return null;
  }
  
  // 1. Jika halaman ADMIN
  if (isAdminPage) {
    // Jangan tampilkan layout apa pun
    return <>{children}</>;
  }

  // 2. Jika SUDAH LOGIN (User)
  if (isLoggedIn) {
    return (
      <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
        {isProdukPage ? <NavbarProdukUser /> : <NavbarUser />}
        <main className="flex-grow-1">
          {children}
        </main>
        <FooterUser />
      </div>
    );
  }

  // 3. Jika BELUM LOGIN (Guest)
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {isProdukPage ? <NavbarProdukGuest /> : <NavbarGuest />}
      <main className="flex-grow-1">
        {children}
      </main>
      <FooterGuest />
    </div>
  );
}