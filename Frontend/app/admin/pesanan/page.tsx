// app/admin/pesanan/page.tsx
"use client";

import { useState } from "react";

// Dummy Data (disesuaikan dengan gambar referensi)
const initialOrders = [
  { id: 1, productName: "Master Central", quantity: 4, price: "175.000", status: "Selesai", imageUrl: "https://placehold.co/100x100/png?text=IMG" },
  { id: 2, productName: "Master Central", quantity: 4, price: "175.000", status: "Selesai", imageUrl: "https://placehold.co/100x100/png?text=IMG" },
  { id: 3, productName: "Master Central", quantity: 4, price: "175.000", status: "Selesai", imageUrl: "https://placehold.co/100x100/png?text=IMG" },
  { id: 4, productName: "Master Central", quantity: 4, price: "175.000", status: "Selesai", imageUrl: "https://placehold.co/100x100/png?text=IMG" },
  { id: 5, productName: "Master Central", quantity: 4, price: "175.000", status: "Selesai", imageUrl: "https://placehold.co/100x100/png?text=IMG" },
  { id: 6, productName: "Kampas Rem", quantity: 2, price: "50.000", status: "Diproses", imageUrl: "https://placehold.co/100x100/png?text=IMG" },
  { id: 7, productName: "Oli Mesin", quantity: 1, price: "45.000", status: "Dibatalkan", imageUrl: "https://placehold.co/100x100/png?text=IMG" },
];

export default function PesananPage() {
  const [filterStatus, setFilterStatus] = useState("Semua");
  const filteredOrders = initialOrders.filter((order) => {
    if (filterStatus === "Semua") return true;
    return order.status === filterStatus;
  });

  // Helper untuk warna status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Selesai": return "text-success";
      case "Diproses": return "text-warning";
      case "Dibatalkan": return "text-danger";
      default: return "text-dark";
    }
  };

  return (
    <>
      {/* Header & Filter */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Pesanan</h5>
        
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold text-dark small mb-0">Filter:</label>
          <select 
            className="form-select form-select-sm rounded-3 border-0 shadow-sm fw-medium" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Selesai">Pesanan Selesai</option>
            <option value="Diproses">Diproses</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Tabel Header (Baris Putih di atas) */}
      <div className="bg-white p-3 rounded-3 shadow-sm d-flex fw-bold text-muted small mb-3 text-center">
         <div style={{flex: 3, textAlign: 'left', paddingLeft: '1rem'}}>Nama Produk</div>
         <div style={{flex: 1}}>Jumlah</div>
         <div style={{flex: 1}}>Harga</div>
         <div style={{flex: 1}}>Status</div>
      </div>

      {/* Daftar Kartu Pesanan */}
      <div className="d-flex flex-column gap-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-3 rounded-4 shadow-sm d-flex align-items-center text-center">
               
               {/* Kolom Kiri: Gambar & Nama */}
               <div style={{flex: 3, textAlign: 'left'}} className="d-flex align-items-center gap-3 ps-3">
                  <img 
                    src={order.imageUrl} 
                    alt={order.productName} 
                    className="rounded-3 bg-light border" 
                    style={{width: '64px', height: '64px', objectFit: 'cover'}} 
                  />
                  <span className="fw-bold text-dark fs-6">{order.productName}</span>
               </div>

               {/* Kolom Tengah & Kanan */}
               <div style={{flex: 1}} className="fw-bold text-dark fs-5">{order.quantity}</div>
               <div style={{flex: 1}} className="fw-bold text-dark fs-5">{order.price}</div>
               <div style={{flex: 1}} className={`fw-bold ${getStatusColor(order.status)}`}>
                  {order.status}
               </div>

            </div>
          ))
        ) : (
          <div className="text-center py-5 text-muted">
            Tidak ada pesanan dengan filter ini.
          </div>
        )}
      </div>
    </>
  );
}