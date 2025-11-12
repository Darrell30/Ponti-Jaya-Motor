// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react"; // <-- Menambahkan Loader2

export default function LoginPage() {
  const router = useRouter();
  // 'identifier' akan menyimpan username atau email
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ===================================
  // === FUNGSI LOGIN (DIPERBAIKI) ===
  // ===================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("[FRONTEND] Mencoba login dengan:", identifier); 

    try {
      // 1. Kirim data login ke backend Anda
      // --- PERBAIKAN: Endpoint diubah ke /api/login ---
      const response = await fetch('http://localhost:5000/api/login', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 'identifier' dikirim (sesuai harapan backend)
        body: JSON.stringify({ identifier, password }), 
      });

      console.log("[FRONTEND] Menerima respons dari server:", response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      // 2. Jika login SUKSES
      if (data.success) {
        // --- PERBAIKAN: Jalur data disesuaikan menjadi data.data.role ---
        const userRole = data.data.role; 

        // 3. Cek Role (Peran)
        if (userRole === 'admin') {
          // localStorage.setItem("isAdminLoggedIn", "true");
          // localStorage.removeItem("isUserLoggedIn");
          console.log("Admin login berhasil, mengalihkan ke dashboard...");
          router.push("/admin/dashboard");
        
        } else if (userRole === 'user') {
          // localStorage.setItem("isUserLoggedIn", "true");
          // localStorage.removeItem("isAdminLoggedIn");
          console.log("User login berhasil, mengalihkan ke home...");
          router.push("/"); // Arahkan ke homepage
        
        } else {
          throw new Error('Peran pengguna tidak dikenal.');
        }

      } else {
        setError(data.message || "Username atau password salah!");
      }

    } catch (err: any) {
      console.error("[FRONTEND] Login fetch error:", err);
      setError(err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  };
  // ===================================

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)" }} className="d-flex align-items-center justify-content-center p-4">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="card-body p-5">
          
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <Lock size={28} />
            </div>
            <h4 className="fw-bold text-dark">Login</h4>
            <p className="text-muted small">Masuk ke akun Anda</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small text-center rounded-3 border-0 bg-danger bg-opacity-10 text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Username atau Email</label>
              <input 
                type="text" 
                className="form-control form-control-lg fs-6 bg-light border-0"
                placeholder="Masukkan username atau email"
                value={identifier} // <-- Diubah dari username
                onChange={(e) => setIdentifier(e.target.value)} // <-- Diubah dari setUsername
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">Password</label>
              <input 
                type="password" 
                className="form-control form-control-lg fs-6 bg-light border-0"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="text-center mb-3">
              <span className="text-muted small">Belum punya akun? </span>
              <Link href="/daftar" className="fw-bold small text-decoration-none" style={{ color: '#0d6efd' }}>
                Silahkan Daftar
              </Link>
            </div>
          
            <button 
              type="submit" 
              className="btn btn-primary w-100 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center"
              style={{ backgroundColor: '#0d6efd' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin me-2" />
                  Memproses...
                </>
              ) : "Masuk"}
            </button>
          </form>
        </div>
        <div className="card-footer bg-light border-0 text-center py-3">
           <Link href="/" className="text-decoration-none small text-muted fw-medium">
             ← Kembali ke Halaman Utama
           </Link>
        </div>
      </div>
    </div>
  );
}