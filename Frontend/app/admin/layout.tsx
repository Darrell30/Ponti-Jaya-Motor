// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/Sidebar"; 
import { Store, Loader2, AlertTriangle } from "lucide-react"; // Tambah icon AlertTriangle

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
    fetch('http://localhost:5000/api/store/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) setIsStoreOpen(data.isStoreOpen);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoadingStatus(false));
  }, [isAuthorized]);

  // 1. FUNGSI KLIK TOMBOL (Hanya Buka Modal)
  const handleToggleClick = () => {
    setShowConfirmModal(true);
  };

  // 2. FUNGSI EKSEKUSI NYATA (Dipanggil tombol "Ya" di modal)
  const confirmToggleStore = async () => {
    if (isLoadingStatus) return;
    
    // Tutup modal dulu biar UI responsif
    setShowConfirmModal(false);
    setIsLoadingStatus(true); 

    const newState = !isStoreOpen; 

    try {
      const response = await fetch('http://localhost:5000/api/store/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStoreOpen: newState })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsStoreOpen(data.isStoreOpen);
        // Opsional: Bisa ganti alert ini dengan Toast notification nanti
        // alert(newState ? "✅ Toko BERHASIL DIBUKA" : "⛔ Toko BERHASIL DITUTUP");
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
            <div>
              <h2 className="fw-bolder text-dark mb-0">PONTI JAYA MOTOR</h2>
              <p className="text-muted fs-5 mb-0">Admin</p> 
            </div>
            
            {/* TOMBOL HEADER (Memanggil Modal) */}
            <button 
              onClick={handleToggleClick} // <-- Panggil fungsi buka modal
              disabled={isLoadingStatus} 
              className={`btn ${isStoreOpen ? 'btn-primary' : 'btn-danger'} d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold shadow-sm border-0`}
              style={{backgroundColor: isStoreOpen ? '#0d6efd' : '#dc3545', transition: 'all 0.3s'}}
            >
              {isLoadingStatus ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Store size={18} />
              )}
              
              {isLoadingStatus 
                ? "Memuat..." 
                : (isStoreOpen ? "Tutup Toko" : "Buka Toko")
              }
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

      {/* --- 3. MODAL KONFIRMASI TOKO (MODERN STYLE) --- */}
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
              {/* Ikon Peringatan */}
              <div className="mb-3 d-flex justify-content-center">
                <div className={`p-3 rounded-circle ${isStoreOpen ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                  <AlertTriangle size={48} />
                </div>
              </div>
              
              {/* Judul & Deskripsi Dinamis */}
              <h5 className="fw-bold text-dark mb-2">
                {isStoreOpen ? "Tutup Toko?" : "Buka Toko?"}
              </h5>
              <p className="text-muted mb-4 small">
                {isStoreOpen 
                  ? "Apakah Anda yakin ingin menutup toko? Pengguna tidak akan bisa melakukan checkout pembelian." 
                  : "Apakah Anda yakin ingin membuka toko kembali? Pengguna akan bisa berbelanja seperti biasa."
                }
              </p>
              
              {/* Tombol Aksi */}
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