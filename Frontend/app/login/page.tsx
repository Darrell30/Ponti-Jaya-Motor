// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ===================================
  // === FUNGSI LOGIN DENGAN FETCH ASLI ===
  // ===================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("[FRONTEND] Mencoba login dengan:", username); // <-- DEBUG BARU DI FRONTEND

    try {
      // 1. Kirim data login ke backend Anda
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 'username' di sini bisa berisi username ATAU email
        body: JSON.stringify({ username, password }), 
      });

      console.log("[FRONTEND] Menerima respons dari server:", response.status); // <-- DEBUG BARU DI FRONTEND

      const data = await response.json();

      if (!response.ok) {
        // Jika server merespons dengan error (misal: 401, 404, 500)
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      // 2. Jika login SUKSES (backend mengirim { success: true, ... })
      if (data.success) {
        const userRole = data.user.role; // Dapatkan role dari backend

        // 3. Cek Role (Peran)
        if (userRole === 'admin') {
          localStorage.setItem("isAdminLoggedIn", "true");
          localStorage.removeItem("isUserLoggedIn");
          router.push("/admin/dashboard");
        
        } else if (userRole === 'user') {
          localStorage.setItem("isUserLoggedIn", "true");
          localStorage.removeItem("isAdminLoggedIn");
          router.push("/"); // Arahkan ke homepage
        
        } else {
          throw new Error('Peran pengguna tidak dikenal.');
        }

      } else {
        // Jika backend mengirim { success: false, message: '...' }
        setError(data.message || "Username atau password salah!");
      }

    } catch (err: any) {
      // 4. Tangkap error (jaringan gagal, server mati, dll)
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              className="btn btn-primary w-100 py-3 fw-bold rounded-3"
              style={{ backgroundColor: '#0d6efd' }}
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
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