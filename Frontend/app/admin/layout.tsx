// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/Sidebar"; 
import { Store } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const loginStatus = localStorage.getItem("isAdminLoggedIn");
    if (loginStatus !== "true") {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6c757d" }}>
        Memeriksa akses...
      </div>
    );
  }

  return (
    <div 
      style={{ 
        minHeight: "100vh", 
        background: "linear-gradient(to bottom, #3b82f6 0%, #a7d3fd 30%, #ffffff 70%, #ffffff 100%)", 
        paddingTop: "2.5rem", 
        paddingBottom: "2.5rem",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
      }} 
      className="pb-5" 
    >
      <div className="container-fluid" style={{ maxWidth: "1400px" }}>
        
        {/* Header admin */}
        <header className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 className="fw-bolder text-dark mb-0">PONTI JAYA MOTOR</h2>
            <p className="text-muted fs-5 mb-0">Admin</p> 
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold shadow-sm border-0" style={{backgroundColor: '#0d6efd'}}>
            <Store size={18} />
            Tutup Toko
          </button>
        </header>

        <div className="row g-4">
          <div className="col-lg-3 d-none d-lg-block">
             <div className="sticky-top" style={{ top: "2rem", zIndex: 1 }}>
               <AdminSidebar /> 
             </div>
          </div>

          <main className="col-lg-9">
            {children} 
          </main>
        </div>
      </div>
    </div>
  );
}