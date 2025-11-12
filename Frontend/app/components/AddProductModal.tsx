// app/components/AddProductModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Package, DollarSign, Archive, FileText } from "lucide-react";

// Tipe data untuk produk BARU
// Kita pakai tipe data yang sama dengan modal edit Anda untuk konsistensi
interface NewProductData {
  name: string;
  price: string;
  stock: number;
  imageUrl: string; // Akan diisi oleh preview URL
  imageFile?: File | null; // Untuk file gambar aslinya
  description: string;
}

interface AddProductModalProps {
  show: boolean; 
  onClose: () => void; // Fungsi untuk menutup modal
  onSave: (newProduct: NewProductData) => void; // Fungsi untuk menyimpan
}

// Data awal (kosong) saat modal dibuka
const initialState: NewProductData = {
  name: '',
  price: '',
  stock: 0,
  imageUrl: '', // Kosong, karena belum ada gambar
  imageFile: null,
  description: '',
};

export default function AddProductModal({ show, onClose, onSave }: AddProductModalProps) {
  const [formData, setFormData] = useState<NewProductData>(initialState);

  // Setiap kali modal dibuka (prop 'show' berubah), reset form-nya
  useEffect(() => {
    if (show) {
      setFormData(initialState);
    }
  }, [show]);

  // Handle input form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'stock') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle upload gambar
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        imageFile: file, // Simpan file-nya
        imageUrl: URL.createObjectURL(file), // Buat preview URL
      }));
    }
  };

  // Handle simpan
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageFile) {
        alert("Harap upload gambar produk."); // Validasi gambar wajib ada
        return;
    }
    // Kirim data baru ke halaman Produk
    onSave(formData);
  };

  if (!show) {
    return null; // Jangan tampilkan apa-apa jika show=false
  }

  return (
    // Backdrop Modal
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3 animate-fade-in" 
      style={{ zIndex: 9998, backdropFilter: 'blur(5px)' }}
      onClick={onClose} // Klik di luar modal akan menutup modal
    >
      <div 
        className="card border-0 shadow-lg rounded-4 overflow-hidden animate-pop-in" 
        style={{ width: '100%', maxWidth: '600px' }}
        onClick={e => e.stopPropagation()} // Mencegah klik di dalam modal menutupnya
      >
        <div className="modal-header border-0 pb-0 p-4 d-flex justify-content-between align-items-center">
          <h5 className="modal-title fw-bold text-dark">Tambah Produk Baru</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        
        <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              {/* Kolom Kiri: Gambar Produk */}
              <div className="col-md-5">
                <label className="form-label small fw-bold text-muted">Gambar Produk (Wajib)</label>
                <div 
                  className="bg-light rounded-3 d-flex align-items-center justify-content-center position-relative overflow-hidden mb-2 border" 
                  style={{ height: '180px', cursor: 'pointer' }}
                  onClick={() => document.getElementById('imageUploadAdd')?.click()}
                >
                  {/* Tampilkan preview atau ikon upload */}
                  {formData.imageUrl ? (
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      className="w-100 h-100 object-fit-cover" 
                    />
                  ) : (
                    <div className="text-center text-muted">
                      <Upload size={32} />
                      <small className="d-block mt-1">Upload Gambar</small>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  id="imageUploadAdd"
                  className="d-none" 
                  accept="image/png, image/jpeg"
                  onChange={handleImageChange}
                  required // HTML5 validation
                />
                <small className="text-muted d-block text-center">Klik kotak untuk upload</small>
              </div>

              {/* Kolom Kanan: Info */}
              <div className="col-md-7">
                {/* Nama Produk */}
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                    <Package size={14} /> Nama Produk
                  </label>
                  <input 
                    type="text" 
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Misal: Busi Iridium"
                    required
                  />
                </div>
                <div className="row g-3">
                  {/* Harga */}
                  <div className="col-sm-6 mb-3">
                    <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                      <DollarSign size={14} /> Harga
                    </label>
                    <input 
                      type="text" // Sesuai tipe data Anda (string)
                      className="form-control"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Misal: 150.000"
                      required
                    />
                  </div>
                  {/* Stok */}
                  <div className="col-sm-6 mb-3">
                    <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                      <Archive size={14} /> Stok
                    </label>
                    <input 
                      type="number" 
                      className="form-control"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="Misal: 25"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="col-12">
                <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                  <FileText size={14} /> Deskripsi
                </label>
                <textarea 
                  className="form-control" 
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Deskripsi singkat produk..."
                ></textarea>
              </div>
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button type="button" className="btn btn-light fw-bold rounded-pill px-4" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-success fw-bold rounded-pill px-4">
                Simpan Produk Baru
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}