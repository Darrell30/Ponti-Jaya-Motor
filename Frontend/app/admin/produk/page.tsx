// app/admin/produk/page.tsx
"use client";

import { useState } from "react";
import { Edit, Plus, Upload, Package, DollarSign, Archive, FileText } from "lucide-react";

// Data Dummy
const initialProducts = [
  { id: 1, name: "Busi", imageUrl: "/images/mastercentral.jpg", price: 35000, stock: 20, description: "Busi standar berkualitas tinggi untuk performa mesin optimal." },
  { id: 2, name: "Tensioner", imageUrl: "/images/mastercentral.jpg", price: 150000, stock: 5, description: "Tensioner rantai keteng otomatis." },
  { id: 3, name: "As Roda Depan", imageUrl: "/images/mastercentral.jpg", price: 250000, stock: 8, description: "As roda depan lengkap dengan mur dan baut." },
  { id: 4, name: "Kabel Kopling", imageUrl: "/images/mastercentral.jpg", price: 40000, stock: 12, description: "Kabel kopling kualitas OEM, responsif." },
  { id: 5, name: "Selang Rem", imageUrl: "/images/mastercentral.jpg", price: 60000, stock: 18, description: "Selang rem hidrolik tahan panas." },
  { id: 6, name: "Bearing Roda", imageUrl: "https://placehold.co/200x200/png?text=IMG", price: 80000, stock: 7, description: "Bearing roda belakang, kuat dan awet." },
];

// Tipe data untuk form
type ProductFormState = {
  id: number | null;
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string; 
  imageFile?: File | null; 
};

const newProductInitialState: ProductFormState = {
  id: null,
  name: '',
  price: 0,
  stock: 0,
  description: '',
  imageUrl: '', 
  imageFile: null,
};

export default function ProdukPage() {
  const [products, setProducts] = useState(initialProducts);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<ProductFormState>(newProductInitialState);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFormData, setNewFormData] = useState<ProductFormState>(newProductInitialState);

  
  const handleOpenEditModal = (product: typeof initialProducts[0]) => {
    setEditFormData({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      imageUrl: product.imageUrl,
      imageFile: null,
    });
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => setShowEditModal(false);

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'stock') {
      setEditFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditFormData(prev => ({
        ...prev,
        imageFile: file,
        imageUrl: URL.createObjectURL(file),
      }));
    }
  };

  const handleSimpanPerubahan = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Data LAMA Siap Dikirim ke Backend:", editFormData);
    setProducts(products.map(product => {
      if (product.id === editFormData.id) {
        return {
          id: editFormData.id!, 
          name: editFormData.name,
          price: editFormData.price,
          stock: editFormData.stock,
          description: editFormData.description,
          imageUrl: editFormData.imageUrl,
        };
      }
      return product;
    }));
    handleCloseEditModal();
  };

  const handleOpenAddModal = () => {
    setNewFormData(newProductInitialState); 
    setShowAddModal(true);
  };
  const handleCloseAddModal = () => setShowAddModal(false);

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'stock') {
      setNewFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setNewFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFormData(prev => ({
        ...prev,
        imageFile: file,
        imageUrl: URL.createObjectURL(file),
      }));
    }
  };

  // PENTING UNTUK TIM BACKEND
  const handleSimpanProdukBaru = (e: React.FormEvent) => {
    e.preventDefault();
    // Validasi: Pastikan gambar sudah di-upload
    if (!newFormData.imageFile) {
        alert("Harap upload gambar produk.");
        return;
    }

    console.log("Data BARU Siap Dikirim ke Backend:", newFormData);
    
    const newProduct = {
      id: Math.floor(Math.random() * 10000),
      name: newFormData.name,
      price: newFormData.price,
      stock: newFormData.stock,
      description: newFormData.description,
      imageUrl: newFormData.imageUrl, 
    };
    setProducts(prevProducts => [newProduct, ...prevProducts]); // Tambah di depan
    
    handleCloseAddModal();
  };


  return (
    <>
      {/* Tombol "Tambah Produk" sekarang berfungsi */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Daftar Produk</h5>
        <button 
          onClick={handleOpenAddModal}
          className="btn btn-success btn-sm d-flex align-items-center gap-2 rounded-3 fw-bold px-3"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>
      
      {/* Grid Produk */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-4">
        {products.map((product) => (
          <div className="col" key={product.id}>
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3">
              <div className="bg-light rounded-3 mb-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '180px' }}>
                 <img 
                   src={product.imageUrl} 
                   alt={product.name}
                   className="w-100 h-100 object-fit-cover" 
                 />
              </div>
              <div className="text-center">
                <h6 className="fw-bold text-dark mb-3">{product.name}</h6>
                <button 
                  onClick={() => handleOpenEditModal(product)}
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-2 rounded-3" 
                  style={{backgroundColor: '#0d6efd'}}
                >
                  <Edit size={16} />
                  Ubah
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showEditModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" 
          style={{ zIndex: 9998, backdropFilter: 'blur(5px)' }}
          onClick={handleCloseEditModal}
        >
          <div 
            className="card border-0 shadow-lg rounded-4 overflow-hidden" 
            style={{ width: '100%', maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header bg-light border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Ubah Detail Produk</h5>
              <button onClick={handleCloseEditModal} className="btn-close"></button>
            </div>
            
            <form onSubmit={handleSimpanPerubahan}>
              <div className="card-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-3">
                  {/* Kolom Kiri: Gambar */}
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted">Gambar Produk</label>
                    <div 
                      className="bg-light rounded-3 d-flex align-items-center justify-content-center position-relative overflow-hidden mb-2" 
                      style={{ height: '180px', cursor: 'pointer' }}
                      onClick={() => document.getElementById('imageUploadEdit')?.click()}
                    >
                      <img 
                        src={editFormData.imageUrl} 
                        alt="Preview" 
                        className="w-100 h-100 object-fit-cover" 
                      />
                      <div className="position-absolute text-white bg-dark bg-opacity-50 p-2 rounded-3" style={{ transition: 'all 0.2s' }}>
                        <Upload size={20} />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      id="imageUploadEdit"
                      className="d-none" 
                      accept="image/png, image/jpeg"
                      onChange={handleEditImageChange}
                    />
                    <small className="text-muted d-block text-center">Klik gambar untuk mengganti</small>
                  </div>
                  {/* Kolom Kanan: Info */}
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                        <Package size={14} /> Nama Produk
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="name"
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    <div className="row g-3">
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <DollarSign size={14} /> Harga
                        </label>
                        <input 
                          type="number" 
                          className="form-control"
                          name="price"
                          value={editFormData.price}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <Archive size={14} /> Stok
                        </label>
                        <input 
                          type="number" 
                          className="form-control"
                          name="stock"
                          value={editFormData.stock}
                          onChange={handleEditInputChange}
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
                      value={editFormData.description}
                      onChange={handleEditInputChange}
                    ></textarea>
                  </div>
                </div>
              </div>
              {/* Footer Modal Edit */}
              <div className="card-footer bg-light border-0 p-3 text-end">
                <button type="button" className="btn btn-light fw-bold rounded-3 me-2" onClick={handleCloseEditModal}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary fw-bold rounded-3 px-4" style={{backgroundColor: '#0d6efd'}}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {showAddModal && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" 
          style={{ zIndex: 9998, backdropFilter: 'blur(5px)' }}
          onClick={handleCloseAddModal}
        >
          <div 
            className="card border-0 shadow-lg rounded-4 overflow-hidden" 
            style={{ width: '100%', maxWidth: '600px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="card-header bg-light border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Tambah Produk Baru</h5>
              <button onClick={handleCloseAddModal} className="btn-close"></button>
            </div>
            
            <form onSubmit={handleSimpanProdukBaru}>
              <div className="card-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="row g-3">
                  {/* Kolom Kiri: Gambar */}
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted">Gambar Produk (Wajib)</label>
                    <div 
                      className="bg-light rounded-3 d-flex align-items-center justify-content-center position-relative overflow-hidden mb-2 border" 
                      style={{ height: '180px', cursor: 'pointer' }}
                      onClick={() => document.getElementById('imageUploadAdd')?.click()}
                    >
                      {/* Tampilkan preview atau placeholder */}
                      {newFormData.imageUrl ? (
                        <img 
                          src={newFormData.imageUrl} 
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
                      onChange={handleNewImageChange}
                      required // Validasi HTML5
                    />
                    <small className="text-muted d-block text-center">Klik kotak untuk upload</small>
                  </div>
                  {/* Kolom Kanan: Info */}
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                        <Package size={14} /> Nama Produk
                      </label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="name"
                        value={newFormData.name}
                        onChange={handleNewInputChange}
                        placeholder="Misal: Kampas Rem Tipe X"
                        required
                      />
                    </div>
                    <div className="row g-3">
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <DollarSign size={14} /> Harga
                        </label>
                        <input 
                          type="number" 
                          className="form-control"
                          name="price"
                          value={newFormData.price}
                          onChange={handleNewInputChange}
                          placeholder="Misal: 50000"
                          required
                        />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <Archive size={14} /> Stok
                        </label>
                        <input 
                          type="number" 
                          className="form-control"
                          name="stock"
                          value={newFormData.stock}
                          onChange={handleNewInputChange}
                          placeholder="Misal: 10"
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
                      value={newFormData.description}
                      onChange={handleNewInputChange}
                      placeholder="Deskripsi singkat produk..."
                    ></textarea>
                  </div>
                </div>
              </div>
              {/* Footer Modal Tambah */}
              <div className="card-footer bg-light border-0 p-3 text-end">
                <button type="button" className="btn btn-light fw-bold rounded-3 me-2" onClick={handleCloseAddModal}>
                  Batal
                </button>
                <button type="submit" className="btn btn-success fw-bold rounded-3 px-4">
                  Simpan Produk Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}