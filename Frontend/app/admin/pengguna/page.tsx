// app/admin/pengguna/page.tsx
"use client";

import { useState, useEffect } from "react"; // <-- 1. Impor Hooks
import { Users, Clock, Loader2 } from "lucide-react"; // <-- 2. Impor Ikon Loading

// --- 3. Definisikan Tipe data sesuai Skema MongoDB ---
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string; // MongoDB mengirim tanggal sebagai string ISO
}

export default function PenggunaPage() {
  
  // --- 4. Siapkan State ---
  const [users, setUsers] = useState<User[]>([]); // Mulai dengan array kosong
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 5. Logika Fetch Data ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        if (!response.ok) {
          throw new Error('Gagal mengambil data dari server');
        }
        const data = await response.json();
        if (data.success) {
          setUsers(data.data); // Set state dengan data dari database
        } else {
          throw new Error(data.message || 'Gagal memuat data pengguna');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // [] = Jalankan sekali saat halaman dimuat

  // Fungsi kecil untuk memformat tanggal
  const formatTanggal = (tanggalISO: string) => {
    return new Date(tanggalISO).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      {/* Judul & Kartu Ringkasan */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Manajemen Pengguna</h5>
      </div>

      {/* Kartu 'Total Pengguna' (Diubah dari 'Aktif') */}
      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ maxWidth: '450px' }}>
        <div className="card-body p-4 d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
            <Users size={28} />
          </div>
          <div>
            {/* Tampilkan jumlah dari state */}
            <h2 className="fw-bolder mb-0">{loading ? '...' : users.length}</h2>
            {/* Mengganti 'Aktif' menjadi 'Total' agar sesuai data */}
            <p className="text-muted mb-0">Total Pengguna Terdaftar</p>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          
          {/* --- 6. Tampilkan Status Loading / Error --- */}
          {loading && (
            <div className="text-center p-5">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="mt-2 text-muted">Memuat data pengguna...</p>
            </div>
          )}
          {error && (
            <div className="alert alert-danger m-3">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* --- 7. Tabel Data (hanya tampil jika tidak loading & tidak error) --- */}
          {!loading && !error && (
            <div className="table-responsive">
              <table className="table table-hover table-borderless align-middle mb-0">
                
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="p-3" style={{minWidth: '150px'}}>Kode User (Username)</th>
                    <th scope="col" className="p-3" style={{minWidth: '200px'}}>Email</th>
                    {/* Mengganti 'Terakhir Dilihat' menjadi 'Tanggal Bergabung' */}
                    <th scope="col" className="p-3" style={{minWidth: '150px'}}>Tanggal Bergabung</th>
                  </tr>
                </thead>

                <tbody>
                  {/* Loop dari state 'users' */}
                  {users.map((user) => (
                    <tr key={user._id}> {/* <-- Gunakan _id */}
                      <td className="p-3 fw-medium text-dark">{user.username}</td>
                      <td className="p-3 text-muted">{user.email}</td>
                      <td className="p-3 text-muted">
                        <Clock size={14} className="me-2" style={{ marginTop: '-2px' }} />
                        {/* Tampilkan tanggal join (createdAt) yang diformat */}
                        {formatTanggal(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
          
        </div>
      </div>
    </>
  );
}