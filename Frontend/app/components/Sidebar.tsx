// app/components/Sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Package, ShoppingCart, LogOut, AlertTriangle } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    router.push("/");
  };

  return (
    <>
      <h5 className="fw-bold mb-3 text-dark">Menu</h5>

      <div className="card border-0 shadow-sm p-3 rounded-4">
        <div className="card-body p-0">
          <div className="nav flex-column nav-pills">
            <Link
              href="/admin/dashboard"
              className={`nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 nav-link-custom ${
                pathname === "/admin/dashboard" ? "active" : ""
              }`}
            >
              <Home size={20} />
              Home
            </Link>

            <Link
              href="/admin/produk"
              className={`nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 nav-link-custom ${
                pathname === "/admin/produk" ? "active" : ""
              }`}
            >
              <Package size={20} />
              Produk
            </Link>

            <Link
              href="/admin/pesanan"
              className={`nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 nav-link-custom ${
                pathname === "/admin/pesanan" ? "active" : ""
              }`}
            >
              <ShoppingCart size={20} />
              Pesanan
            </Link>

            {/* tombol exit */}
            <button 
              onClick={handleLogoutClick} 
              className="nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 w-100 text-start nav-link-logout border-0 bg-transparent"
            >
               <LogOut size={20} />
               Keluar
            </button>
          </div>
        </div>
      </div>

  
      {showLogoutModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" 
          style={{ zIndex: 9999, left: 0, top: 0 }}
        >
          <div className="card border-0 shadow-lg rounded-4 p-4 text-center" style={{ maxWidth: '320px', width: '90%' }}>
            <div className="card-body p-2">
              <div className="mb-3 text-warning">
                <AlertTriangle size={48} />
              </div>
              <h5 className="fw-bold text-dark mb-2">Konfirmasi Keluar</h5>
              <p className="text-muted mb-4">Apakah Anda yakin ingin keluar?</p>
              <div className="d-flex gap-2 justify-content-center">
                <button onClick={handleCancelLogout} className="btn btn-light fw-bold rounded-pill px-4 flex-fill">
                  Batal
                </button>
                <button onClick={handleConfirmLogout} className="btn btn-danger fw-bold rounded-pill px-4 flex-fill">
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}