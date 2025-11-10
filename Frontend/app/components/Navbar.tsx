// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark py-3 sticky-top">
      <div className="container">
        {/* Logo */}
        <Link href="/" className="navbar-brand fw-bold fs-4">
          PONTI JAYA MOTOR
        </Link>
        
        {/* Tombol Toggler untuk Mobile */}
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu Navigasi */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center gap-3">
            
            <li className="nav-item">
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active fw-bold' : ''}`}>
                Home
              </Link>
            </li>
            
            <li className="nav-item">
              <Link href="/jasa" className={`nav-link ${pathname === '/jasa' ? 'active fw-bold' : ''}`}>
                Jasa
              </Link>
            </li>
            
            <li className="nav-item">
              <Link href="/sparepart" className={`nav-link ${pathname === '/sparepart' ? 'active fw-bold' : ''}`}>
                Sparepart
              </Link>
            </li>
            
            <li className="nav-item">
              <Link href="/hubungi-kami" className={`nav-link ${pathname === '/hubungi-kami' ? 'active fw-bold' : ''}`}>
                Hubungi Kami
              </Link>
            </li>
            
            {/* Tombol Masuk (Login) */}
            <li className="nav-item ms-lg-2">
              <Link href="/login" className="btn btn-primary px-4 fw-bold rounded-3" style={{backgroundColor: '#0d6efd'}}>
                Masuk
              </Link>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
}