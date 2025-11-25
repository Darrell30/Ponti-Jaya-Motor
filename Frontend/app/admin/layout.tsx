// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/Sidebar"; 
import { Store, Loader2, AlertTriangle, Menu, X } from "lucide-react"; // Tambah Menu dan X

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [isStoreOpen, setIsStoreOpen] = useState(true); 
  const [isLoadingStatus, setIsLoadingStatus] = useState(true); 

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // --- STATE BARU: Untuk Mobile Sidebar ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const loginStatus = localStorage.getItem("isAdminLoggedIn");
    if (loginStatus !== "true") {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;
    setIsLoadingStatus(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setIsStoreOpen(data.isStoreOpen);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoadingStatus(false));
  }, [isAuthorized]);

  const handleToggleClick = () => {
    setShowConfirmModal(true);
  };

  const confirmToggleStore = async () => {
    if (isLoadingStatus) return;
    
    setShowConfirmModal(false);
    setIsLoadingStatus(true); 

    const newState = !isStoreOpen; 

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/store/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoreOpen: newState })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsStoreOpen(data.isStoreOpen);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Gagal update:", error);
      alert("Gagal mengubah status toko. Cek server backend.");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#6c757d" }}>
        Memeriksa akses...
      </div>
    );
  }

  return (
    <>
      <div 
        style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 0, 
          background: "linear-gradient(to bottom, #3b82f6 0%, #a7d3fd 30%, #ffffff 70%, #ffffff 100%)",
          pointerEvents: "none" 
        }}
      />

      <div style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", position: "relative", zIndex: 1 }} className="pb-5">
        <div className="container-fluid" style={{ maxWidth: "1400px" }}>
          
          <header className="d-flex justify-content-between align-items-center mb-5">
            {/* GRUP KIRI: Tombol Menu (HP Only) + Judul */}
            <div className="d-flex align-items-center gap-3">
              {/* TOMBOL HAMBURGER (Hanya muncul di Layar Kecil / d-lg-none) */}
              <button 
                className="btn btn-light shadow-sm d-lg-none p-2 rounded-circle"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu size={24} className="text-primary" />
              </button>

              <div>
                <h2 className="fw-bolder text-dark mb-0 fs-3 fs-md-2">PONTI JAYA MOTOR</h2>
                <p className="text-muted fs-6 fs-md-5 mb-0">Admin</p> 
              </div>
            </div>
            
            {/* TOMBOL KANAN: Buka/Tutup Toko */}
            <button 
              onClick={handleToggleClick} 
              disabled={isLoadingStatus} 
              className={`btn ${isStoreOpen ? 'btn-primary' : 'btn-danger'} d-flex align-items-center gap-2 px-3 px-md-4 py-2 rounded-pill fw-bold shadow-sm border-0`}
              style={{backgroundColor: isStoreOpen ? '#0d6efd' : '#dc3545', transition: 'all 0.3s', fontSize: '0.9rem'}}
            >
              {isLoadingStatus ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Store size={18} />
              )}
              
              <span className="d-none d-sm-inline"> 
                {isLoadingStatus 
                  ? "Memuat..." 
                  : (isStoreOpen ? "Tutup Toko" : "Buka Toko")
                }
              </span>
            </button>
          </header>

          <div className="row g-4">
            {/* SIDEBAR DESKTOP (Hanya muncul di Layar Besar / d-none d-lg-block) */}
            <div className="col-lg-3 d-none d-lg-block">
               <div className="sticky-top" style={{ top: "2rem", zIndex: 1 }}>
                 <AdminSidebar /> 
               </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="col-12 col-lg-9">
              {children} 
            </main>
          </div>
        </div>
      </div>

      {/* --- TAMBAHAN BARU: MOBILE SIDEBAR OVERLAY --- */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-[9999] d-lg-none" 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000 }}
        >
          {/* Backdrop Gelap */}
          <div 
            className="bg-dark bg-opacity-50 w-100 h-100 position-absolute"
            onClick={() => setIsMobileSidebarOpen(false)}
            style={{ backdropFilter: 'blur(2px)' }}
          ></div>

          {/* Panel Sidebar */}
          <div 
            className="bg-white h-100 position-relative shadow-lg overflow-y-auto"
            style={{ width: '280px', maxWidth: '80%' }}
          >
            <div className="p-3 d-flex justify-content-between align-items-center border-bottom">
              <span className="fw-bold text-primary">Menu Admin</span>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="btn btn-sm btn-light rounded-circle p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-3">
              {/* Panggil Sidebar Component di sini */}
              <AdminSidebar />
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI TOKO --- */}
      {showConfirmModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" 
          style={{ zIndex: 9999, backdropFilter: 'blur(5px)' }}
        >
          <div 
            className="card border-0 shadow-lg rounded-4 overflow-hidden animate-pop-in" 
            style={{ maxWidth: '400px', width: '100%', backgroundColor: 'white' }}
          >
            <div className="card-body p-4 text-center">
              <div className="mb-3 d-flex justify-content-center">
                <div className={`p-3 rounded-circle ${isStoreOpen ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                  <AlertTriangle size={48} />
                </div>
              </div>
              
              <h5 className="fw-bold text-dark mb-2">
                {isStoreOpen ? "Tutup Toko?" : "Buka Toko?"}
              </h5>
              <p className="text-muted mb-4 small">
                {isStoreOpen 
                  ? "Apakah Anda yakin ingin menutup toko? Pengguna tidak akan bisa melakukan checkout pembelian." 
                  : "Apakah Anda yakin ingin membuka toko kembali? Pengguna akan bisa berbelanja seperti biasa."
                }
              </p>
              
              <div className="d-flex gap-2 justify-content-center">
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="btn btn-light fw-bold rounded-pill px-4 flex-fill"
                >
                  Batal
                </button>
                
                <button 
                  onClick={confirmToggleStore} 
                  className={`btn fw-bold rounded-pill px-4 flex-fill ${isStoreOpen ? 'btn-danger' : 'btn-success'}`}
                >
                  {isStoreOpen ? "Ya, Tutup Toko" : "Ya, Buka Toko"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </>
  );
}
