// app/daftar/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Key, User as UserIcon, ShieldCheck } from "lucide-react";

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
  
  const [otpSent, setOtpSent] = useState(false); // <-- BARU: Menandai OTP sudah dikirim

  // --- FUNGSI KIRIM OTP (ASLI) ---
  const handleKirimOtp = async () => {
    setIsSendingOtp(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Gagal mengirim OTP');
      } else {
        setMessage(data.message); // "OTP telah dikirim ke emailanda@gmail.com"
        setOtpSent(true); // <-- Tampilkan sisa form
      }
    } catch (err) {
      console.error(err);
      setError('Tidak dapat terhubung ke server untuk mengirim OTP.');
    }

    setIsSendingOtp(false);
  };

  // --- FUNGSI DAFTAR (ASLI) ---
  const handleDaftar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    setError("");
    setMessage("");

    // Cek frontend sederhana (backend akan cek ulang)
    if (!otp || !kodeUser || !password) {
        setError("Harap isi semua field.");
        setIsRegistering(false);
        return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Mengirim SEMUA data ke backend untuk verifikasi
        body: JSON.stringify({
          username: kodeUser,
          email: email,
          password: password,
          otp: otp // <-- MENGIRIM OTP ASLI
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Gagal, tampilkan pesan error dari backend (mis: "Kode OTP salah")
        setError(data.message || 'Terjadi kesalahan saat registrasi.');
      } else {
        // Sukses!
        setMessage("Pendaftaran berhasil! Mengalihkan ke halaman login...");
        setTimeout(() => router.push("/login"), 2000); 
      }

    } catch (error) {
      console.error('Fetch error:', error);
      setError('Tidak dapat terhubung ke server. Pastikan server backend berjalan.');
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

          {/* --- Form Daftar (onSubmit SEKARANG di handleDaftar) --- */}
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
                disabled={otpSent} // <-- Nonaktifkan setelah OTP dikirim
                required
              />
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={handleKirimOtp}
                disabled={isSendingOtp || !email || otpSent}
              >
                {isSendingOtp ? "..." : (otpSent ? "Terkirim" : "Kirim OTP")}
              </button>
            </div>

            {/* --- KONTEN INI HANYA MUNCUL SETELAH OTP DIKIRIM --- */}
            {otpSent && (
              <>
                {/* 2. Input OTP */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Kode OTP</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><ShieldCheck size={16} /></span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0"
                      placeholder="Masukkan 6 digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                {/* 3. Input Kode User (Username) */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Username</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><UserIcon size={16} /></span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0"
                      placeholder="Buat username unik Anda"
                      value={kodeUser}
                      onChange={(e) => setKodeUser(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                {/* Input Password */}
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-0"><Key size={16} /></span>
                    <input 
                      type="password" 
                      className="form-control bg-light border-0"
                      placeholder="Buat password aman"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-3 fw-bold rounded-3"
                  disabled={isRegistering}
                >
                  {isRegistering ? "Memproses..." : "Daftar Sekarang"}
                </button>
              </>
            )}
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