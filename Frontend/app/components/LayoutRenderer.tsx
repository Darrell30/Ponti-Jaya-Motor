// app/components/LayoutRenderer.tsx
'use client'; // <-- Wajib, karena kita menggunakan hook

import { usePathname } from 'next/navigation';
import NavbarGuest from './NavbarGuest';
import FooterGuest from './FooterGuest';

export default function LayoutRenderer({ children }: { children: React.ReactNode }) {
  // 1. Dapatkan path URL saat ini
  const pathname = usePathname();

  // 2. Cek apakah ini halaman admin
  //    startsWith() akan cocok untuk /admin, /admin/dashboard, /admin/products, dll.
  const isAdminPage = pathname.startsWith('/admin');

  // 3. Logika Render Bersyarat
  if (isAdminPage) {
    // Jika ini halaman admin, JANGAN tampilkan Navbar/Footer.
    // Cukup render {children} (yaitu halaman adminnya)
    return <>{children}</>;
  }

  // 4. Jika BUKAN halaman admin, render layout publik yang lengkap
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <NavbarGuest />
      <main className="flex-grow-1">
        {children}
      </main>
      <FooterGuest />
    </div>
  );
}