// app/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // 1. Import useRouter
import { Home, Package, ShoppingCart, LogOut } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter(); 

  // Fungsi Logout yang sudah diperbarui
  const handleLogout = () => {
    // Hapus tanda login
    localStorage.removeItem("isAdminLoggedIn");
    // Pindah ke halaman utama
    router.push("/");
  };

  return (
    <>
      <h5 className="fw-bold mb-3 text-dark">Menu</h5>

      <div className="card border-0 shadow-sm p-3 rounded-4">
        <div className="card-body p-0">
          
          <div className="nav flex-column nav-pills">
            
            {/* Home */}
            <Link
              href="/admin/dashboard"
              className={`nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 nav-link-custom ${
                pathname === "/admin/dashboard" ? "active" : ""
              }`}
            >
              <Home size={20} />
              Home
            </Link>

            {/* produk*/}
            <Link
              href="/admin/produk"
              className={`nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 nav-link-custom ${
                pathname === "/admin/produk" ? "active" : ""
              }`}
            >
              <Package size={20} />
              Produk
            </Link>

            {/* pesanan*/}
            <Link
              href="/admin/pesanan"
              className={`nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 nav-link-custom ${
                pathname === "/admin/pesanan" ? "active" : ""
              }`}
            >
              <ShoppingCart size={20} />
              Pesanan
            </Link>

            {/* tombol keluar*/}
            <button 
              onClick={handleLogout} 
              className="nav-link d-flex align-items-center gap-3 px-3 py-3 mt-4 fw-medium rounded-3 w-100 text-start nav-link-logout border-0 bg-transparent"
            >
               <LogOut size={20} />
               Keluar
            </button>
            
          </div>
        </div>
      </div>
    </>
  );
}