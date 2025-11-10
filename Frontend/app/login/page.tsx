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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (username === "admin" && password === "123") {
      // Berhasil login
      localStorage.setItem("isAdminLoggedIn", "true");
      
      // Arahkan ke dashboard
      router.push("/admin/dashboard/page");
    } else {
      // Gagal login
      setError("Username atau password salah!");
      setIsLoading(false);
    }
    
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)" }} className="d-flex align-items-center justify-content-center p-4">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: "400px", width: "100%" }}>
        <div className="card-body p-5">
          
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <Lock size={28} />
            </div>
            <h4 className="fw-bold text-dark">Admin Login</h4>
            <p className="text-muted small">Masuk untuk mengelola bengkel</p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 small text-center rounded-3 border-0 bg-danger bg-opacity-10 text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Username</label>
              <input 
                type="text" 
                className="form-control form-control-lg fs-6 bg-light border-0"
                placeholder="Masukkan username"
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
            <button 
              type="submit" 
              className="btn btn-primary w-100 py-3 fw-bold rounded-3"
              style={{ backgroundColor: '#0d6efd' }}
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk Dashboard"}
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