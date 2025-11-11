// app/daftar/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Key, User } from "lucide-react";

export default function DaftarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [kodeUser, setKodeUser] = useState(""); // Ini akan jadi 'username'
  const [password, setPassword] = useState(""); 
  
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // fungsi dummy kirim otp
  const handleKirimOtp = async () => {
    setIsSendingOtp(true);
    setError("");
    setMessage("");

    console.log("DUMMY: Mengirim OTP ke:", email);
    
    // Simulasi pengiriman 1 detik
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    
    // dummy
    setMessage("DUMMY: OTP (123456) telah dikirim ke " + email);
    setIsSendingOtp(false);
  };

  // --- FUNGSI DAFTAR (ASLI) ---
  const handleDaftar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setError("");
    setMessage("");

    // --- (Bagian ini dari kode lama Anda, kita pertahankan) ---
    // Cek "dummy" OTP di sisi frontend
    if (otp !== "123456") {
      setError("Kode OTP salah. (Hint: coba 123456)");
      setIsRegistering(false);
      return; // Berhenti jika OTP salah
    }
    // --- (Akhir bagian kode lama) ---


    // --- INI BAGIAN BARU YANG MENGIRIM KE BACKEND ---
    try {
      // Pastikan URL-nya benar (http://localhost:5000)
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Mengirim data yang bersih ke backend
        // Perhatikan: kita memetakan 'kodeUser' ke 'username'
        body: JSON.stringify({
          username: kodeUser, 
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Gagal, tampilkan pesan error dari backend
        setError(data.message || 'Terjadi kesalahan saat registrasi.');
      } else {
        // Sukses!
        setMessage("Pendaftaran berhasil! Mengalihkan ke halaman login...");
        setTimeout(() => router.push("/login"), 2000);
      }

    } catch (error) {
      // Ini terjadi jika backend (port 5000) mati atau tidak bisa dijangkau
      console.error('Fetch error:', error);
      setError('Tidak dapat terhubung ke server. Coba lagi nanti.');
    }

    setIsRegistering(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)" }} className="d-flex align-items-center justify-content-center p-4">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="card-body p-5">
          
          <div className="text-center mb-4">
            <h4 className="fw-bold text-dark">Buat Akun Baru</h4>
            <p className="text-muted small">Daftar untuk mulai mengelola</p>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {message && <div className="alert alert-success py-2 small">{message}</div>}

          <form onSubmit={handleDaftar}>
            {/* 1. Input Email & Tombol OTP */}
            <label className="form-label small fw-bold text-muted">Email</label>
            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-0"><Mail size={16} /></span>
              <input 
                type="email" 
                className="form-control bg-light border-0"
                placeholder="contoh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={handleKirimOtp}
                disabled={isSendingOtp || !email}
              >
                {isSendingOtp ? "..." : "Kirim OTP"}
              </button>
            </div>

            {/* 2. Input OTP */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Kode OTP</label>
              <input 
                type="text" 
                className="form-control bg-light border-0"
                placeholder="Masukkan 6 digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            
            {/* 3. Input Kode User (Username) */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted">Username</label>
              <input 
                type="text" 
                className="form-control bg-light border-0"
                placeholder="Buat username unik Anda"
                value={kodeUser}
                onChange={(e) => setKodeUser(e.target.value)}
                required
              />
            </div>
            
            {/* Input Password */}
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">Password</label>
              <input 
                type="password" 
                className="form-control bg-light border-0"
                placeholder="Buat password aman"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 py-3 fw-bold rounded-3"
              disabled={isRegistering}
            >
              {isRegistering ? "Memproses..." : "Daftar Sekarang"}
            </button>
          </form>
        </div>
        <div className="card-footer bg-light border-0 text-center py-3">
           <Link href="/login" className="text-decoration-none small text-muted fw-medium">
             Sudah punya akun? Kembali ke Login
           </Link>
        </div>
      </div>
    </div>
  );
}