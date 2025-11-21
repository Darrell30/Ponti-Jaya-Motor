// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState(""); // Ini akan dikirim sebagai 'identifier'
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Hubungi Backend (Alamat ini sudah benar sesuai server.js Anda)
      const response = await fetch('${process.env.NEXT_PUBLIC_API_URL}/api/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Backend Anda mengharapkan 'identifier', bukan 'username'
        body: JSON.stringify({ identifier: username, password: password }) 
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login Gagal. Cek kembali data Anda.');
      }

      // 2. Cek data 'role' yang dikirim backend
      const userRole = data.data.role; // Sesuai struktur data di server.js

      if (userRole === "admin") {
        // 3. JIKA ADMIN:
        localStorage.setItem("isAdminLoggedIn", "true");
        // Simpan info admin jika perlu
        localStorage.setItem("adminInfo", JSON.stringify(data.data)); 
        router.push("/admin/dashboard"); // Lempar ke Dashboard Admin

      } else {
        // 4. JIKA USER BIASA:
        localStorage.setItem("isUserLoggedIn", "true"); // Gunakan key yang BEDA
        // Simpan info user jika perlu
        localStorage.setItem("userInfo", JSON.stringify(data.data)); 
        router.push("/"); // Lempar ke Halaman Utama (Homepage)
      }

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)" }} className="d-flex align-items-center justify-content-center p-4">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: "400px", width: "100%", border: '1px solid #F0F3F7'}}>
        <div className="card-body p-5">
          
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <Lock size={28} />
            </div>
            {/* Ubah judul agar lebih umum */}
            <h4 className="fw-bold text-dark">Login Akun</h4> 
            <p className="text-muted small">Masuk ke akun Ponti Jaya Motor</p>
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