// app/components/admin/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, LogOut } from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", href: "/admin/dashboard", icon: Home },
    { name: "Produk", href: "/admin/produk", icon: Package },
    { name: "Pesanan", href: "/admin/pesanan-produk", icon: ShoppingCart },
  ];

  return (
    <>
      {/* CSS Kustom untuk efek Hover Biru */}
      <style jsx>{`
        .nav-link-custom {
          transition: all 0.2s ease-in-out;
          color: #495057; /* Warna teks default (abu gelap) */
        }
        /* Saat di-hover, jadi biru backgroundnya dan teks putih */
        .nav-link-custom:hover {
          background-color: #0d6efd !important; /* Biru Bootstrap Primary */
          color: white !important;
        }
        /* State aktif (sedang dibuka) */
        .nav-link-custom.active {
          background-color: #0d6efd !important;
          color: white !important;
        }
        
        /* Khusus tombol keluar, default merah, tapi hover biru sesuai request */
        .nav-link-logout {
           color: #dc3545; /* Merah default */
           transition: all 0.2s ease-in-out;
        }
        .nav-link-logout:hover {
           background-color: #0d6efd !important; /* Biru saat hover sesuai request */
           color: white !important;
        }
      `}</style>

      <div className="card border-0 shadow-sm p-3 rounded-4">
        <div className="card-body p-0">
          <h6 className="fw-bold mb-3 px-3">Menu</h6>
          
          <div className="nav flex-column nav-pills" aria-orientation="vertical">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link d-flex align-items-center gap-3 px-3 py-3 mb-2 fw-medium rounded-3 nav-link-custom ${
                    isActive ? "active" : ""
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}

            {/* Tombol Keluar */}
            <button className="nav-link d-flex align-items-center gap-3 px-3 py-3 mt-4 fw-medium rounded-3 w-100 text-start nav-link-logout">
               <LogOut size={20} />
               Keluar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}