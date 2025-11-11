// app/admin/pengguna/page.tsx
"use client";

import { Users, Clock } from "lucide-react";

//dummy 
// Nanti, data ini akan dihapus dan diganti dengan data dari API Backend
const dummyActiveUsers = [
  { id: 1, username: "darrel88", email: "darrel@example.com", lastSeen: "Baru saja" },
  { id: 2, username: "admin_ponti", email: "admin@pontijaya.com", lastSeen: "2 menit lalu" },
  { id: 3, username: "budi_santoso", email: "budi@gmail.com", lastSeen: "5 menit lalu" },
  { id: 4, username: "siti_ceria", email: "siti@yahoo.com", lastSeen: "8 menit lalu" },
];

export default function PenggunaPage() {
  return (
    <>
      {/* Judul & Kartu Ringkasan */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Manajemen Pengguna</h5>
      </div>

      {/* Kartu 'Total Pengguna Aktif' */}
      <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ maxWidth: '450px' }}>
        <div className="card-body p-4 d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
            <Users size={28} />
          </div>
          <div>
            <h2 className="fw-bolder mb-0">{dummyActiveUsers.length}</h2>
            <p className="text-muted mb-0">Pengguna Aktif (10 Menit Terakhir)</p>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Pengguna Aktif */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-borderless align-middle mb-0">
              
              <thead className="table-light">
                <tr>
                  <th scope="col" className="p-3" style={{minWidth: '150px'}}>Kode User (Username)</th>
                  <th scope="col" className="p-3" style={{minWidth: '200px'}}>Email</th>
                  <th scope="col" className="p-3" style={{minWidth: '150px'}}>Terakhir Dilihat</th>
                </tr>
              </thead>

              <tbody>
                {dummyActiveUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="p-3 fw-medium text-dark">{user.username}</td>
                    <td className="p-3 text-muted">{user.email}</td>
                    <td className="p-3 text-muted">
                      <Clock size={14} className="me-2" style={{ marginTop: '-2px' }} />
                      {user.lastSeen}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </>
  );
}