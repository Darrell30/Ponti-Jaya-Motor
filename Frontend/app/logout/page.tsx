// app/logout/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Hapus SEMUA flag login dari localStorage
    localStorage.removeItem('isUserLoggedIn');
    localStorage.removeItem('isAdminLoggedIn');
    // Hapus juga token jika Anda menyimpannya
    // localStorage.removeItem('token');

    // 2. Arahkan pengguna kembali ke homepage
    // Kita beri sedikit delay agar pengguna tahu sesuatu terjadi
    const timer = setTimeout(() => {
      router.push('/');
    }, 1000); // 1 detik delay

    // Membersihkan timer jika komponen unmount
    return () => clearTimeout(timer);
    
  }, [router]); // Jalankan sekali saat halaman dimuat

  // Tampilkan pesan "sedang keluar"
  return (
    <div 
      className="d-flex flex-column align-items-center justify-content-center" 
      style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}
    >
      <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      <h3 className="mt-3 fw-bold text-dark">Anda sedang keluar...</h3>
    </div>
  );
}