// app/admin/produk/page.tsx
"use client";

import { useState, useEffect } from "react";
// Impor SEMUA ikon yang kita butuhkan
import { Edit, Plus, Upload, Package, DollarSign, Archive, FileText, Loader2, Check, X } from "lucide-react";

// --- Tipe data Produk (Sesuai Skema MongoDB) ---
interface Product {
  _id: string; // MongoDB menggunakan _id (string)
  nama: string;
  harga: number;
  stok: number;
  deskripsi: string;
  imageUrl: string; 
};

// Tipe data untuk form
type ProductFormState = {
  _id: string | null;
  nama: string;
  harga: number;
  stok: number;
  deskripsi: string;
  imageUrl: string; 
  imageFile?: File | null; // File gambar sementara
};

// State awal untuk form produk baru
const newProductInitialState: ProductFormState = {
  _id: null,
  nama: '',
  harga: 0,
  stok: 0,
  deskripsi: '',
  imageUrl: '', 
  imageFile: null,
};

export default function ProdukPage() {
  // --- State Halaman Utama ---
  const [products, setProducts] = useState<Product[]>([]); // Mulai dengan array kosong
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- State Modal ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<ProductFormState>(newProductInitialState);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFormData, setNewFormData] = useState<ProductFormState>(newProductInitialState);

  // State untuk status kirim (loading) di dalam modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);


  // --- Logika Fetch Data (READ) ---
  useEffect(() => {
    fetchProducts();
  }, []); // [] = Jalankan sekali saat halaman dimuat

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/spareparts');
      if (!response.ok) {
        throw new Error('Gagal mengambil data dari server');
      }
      const data = await response.json();
      if (data.success) {
        setProducts(data.data); // Set state dengan data dari database
      } else {
        throw new Error(data.message || 'Gagal memuat data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  // --- Logika Modal Edit (TERHUBUNG KE BACKEND) ---
  const handleOpenEditModal = (product: Product) => {
    setEditFormData({
      _id: product._id,
      nama: product.nama,
      harga: product.harga,
      stok: product.stok,
      deskripsi: product.deskripsi,
      imageUrl: product.imageUrl,
      imageFile: null, // Reset file
    });
    setModalError(null);
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => setShowEditModal(false);

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'harga' || name === 'stok') {
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
        imageUrl: URL.createObjectURL(file), // Tampilkan preview
      }));
    }
  };

  // --- FUNGSI UTAMA: SIMPAN PERUBAHAN (UPDATE) ---
  const handleSimpanPerubahan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData._id) {
        setModalError("ID Produk tidak ditemukan.");
        return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
        let finalImageUrl = editFormData.imageUrl; // Default: gambar lama

        // --- LANGKAH 1 (Opsional): Upload gambar JIKA ada file baru ---
        if (editFormData.imageFile) {
            console.log("Edit: Mengupload gambar baru...");
            const imageFormData = new FormData();
            imageFormData.append('file', editFormData.imageFile);

            const uploadResponse = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                body: imageFormData,
            });

            const uploadData = await uploadResponse.json();
            if (!uploadResponse.ok || !uploadData.success) {
                throw new Error(uploadData.message || 'Gagal meng-upload gambar baru');
            }
            finalImageUrl = uploadData.url; // Gunakan URL gambar baru
            console.log("Edit: Gambar baru terupload:", finalImageUrl);
        }

        // --- LANGKAH 2: Update data ke MongoDB ---
        console.log("Edit: Menyimpan data ke MongoDB...");
        
        // Siapkan data untuk dikirim (tanpa _id dan imageFile)
        const productData = {
            nama: editFormData.nama,
            harga: editFormData.harga,
            stok: editFormData.stok,
            deskripsi: editFormData.deskripsi,
            imageUrl: finalImageUrl, // Kirim URL yang benar (lama atau baru)
        };

        const updateResponse = await fetch(`http://localhost:5000/api/spareparts/${editFormData._id}`, { // <-- Perhatikan :id
            method: 'PUT', // <-- Gunakan PUT
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData),
        });

        const updateData = await updateResponse.json();
        if (!updateResponse.ok || !updateData.success) {
            throw new Error(updateData.message || 'Gagal memperbarui produk');
        }

        // --- LANGKAH 3: Sukses ---
        console.log("Edit: Berhasil disimpan:", updateData.data);
        
        // Perbarui UI: Ganti data produk di state
        setProducts(products.map(product => 
            product._id === updateData.data._id ? updateData.data : product
        ));
        handleCloseEditModal(); // Tutup modal

    } catch (err: any) {
        console.error("Kesalahan saat menyimpan perubahan:", err);
        setModalError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  
  // --- Logika Modal Tambah (TERHUBUNG KE BACKEND) ---
  const handleOpenAddModal = () => {
    setNewFormData(newProductInitialState); 
    setModalError(null);
    setShowAddModal(true);
  };
  const handleCloseAddModal = () => setShowAddModal(false);

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'harga' || name === 'stok') { 
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

  // --- FUNGSI UTAMA: SIMPAN PRODUK BARU (CREATE) ---
  const handleSimpanProdukBaru = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFormData.imageFile) {
        setModalError("Harap upload gambar produk.");
        return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      // --- LANGKAH 1: Upload Gambar ke /api/upload ---
      console.log("Langkah 1: Mengupload gambar...");
      const imageFormData = new FormData();
      imageFormData.append('file', newFormData.imageFile); 

      const uploadResponse = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: imageFormData, 
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.message || 'Gagal meng-upload gambar');
      }

      const newImageUrl = uploadData.url; 
      console.log("Langkah 1 Berhasil. URL Gambar:", newImageUrl);

      // --- LANGKAH 2: Simpan Data Teks + URL Gambar ke /api/spareparts ---
      console.log("Langkah 2: Menyimpan data ke MongoDB...");
      
      const productData = {
        nama: newFormData.nama,
        harga: newFormData.harga,
        stok: newFormData.stok,
        deskripsi: newFormData.deskripsi,
        imageUrl: newImageUrl,
      };

      const createResponse = await fetch('http://localhost:5000/api/spareparts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const createData = await createResponse.json();
      if (!createResponse.ok || !createData.success) {
        throw new Error(createData.message || 'Gagal menyimpan produk ke database');
      }

      // --- LANGKAH 3: Sukses ---
      console.log("Langkah 2 Berhasil. Produk baru dibuat:", createData.data);
      
      // Perbarui UI: Tambahkan produk baru (dari respons backend) ke daftar
      setProducts(prevProducts => [createData.data, ...prevProducts]);
      handleCloseAddModal(); // Tutup modal

    } catch (err: any) {
      console.error("Kesalahan saat menyimpan produk baru:", err);
      setModalError(err.message); // Tampilkan error di dalam modal
    } finally {
      setIsSubmitting(false); // Selesai loading
    }
  };


  return (
    <>
      {/* Tombol "Tambah Produk" */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Daftar Produk</h5>
        <button 
          onClick={handleOpenAddModal}
          className="btn btn-success btn-sm d-flex align-items-center gap-2 rounded-3 fw-bold px-3"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>
      
      {/* Status Loading / Error Halaman Utama */}
      {loading && (
        <div className="text-center py-5">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="mt-2 text-muted">Memuat produk dari database...</p>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">
          <strong>Error Halaman:</strong> {error}
        </div>
      )}

      {/* Grid Produk */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-4">
        {!loading && !error && products.map((product) => (
          <div className="col" key={product._id}>
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3">
              <div className="bg-light rounded-3 mb-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '180px' }}>
                 <img 
                   src={product.imageUrl} 
                   alt={product.nama}
                   className="w-100 h-100 object-fit-cover" 
                 />
              </div>
              <div className="text-center">
                <h6 className="fw-bold text-dark mb-3">{product.nama}</h6>
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

      {/* --- MODAL EDIT (TERHUBUNG) --- */}
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
              <button onClick={handleCloseEditModal} className="btn-close" disabled={isSubmitting}></button>
            </div>
            
            <form onSubmit={handleSimpanPerubahan}>
              <div className="card-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {modalError && (
                  <div className="alert alert-danger small py-2">{modalError}</div>
                )}
                
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted">Gambar Produk</label>
                    <div 
                      className="bg-light rounded-3 d-flex align-items-center justify-content-center position-relative overflow-hidden mb-2" 
                      style={{ height: '180px', cursor: 'pointer' }}
                      onClick={() => !isSubmitting && document.getElementById('imageUploadEdit')?.click()}
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
                      type="file" id="imageUploadEdit" className="d-none" 
                      accept="image/png, image/jpeg" onChange={handleEditImageChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                        <Package size={14} /> Nama Produk
                      </label>
                      <input 
                        type="text" className="form-control"
                        name="nama"
                        value={editFormData.nama}
                        onChange={handleEditInputChange} required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="row g-3">
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <DollarSign size={14} /> Harga
                        </label>
                        <input 
                          type="number" className="form-control"
                          name="harga"
                          value={editFormData.harga}
                          onChange={handleEditInputChange} required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <Archive size={14} /> Stok
                        </label>
                        <input 
                          type="number" className="form-control"
                          name="stok"
                          value={editFormData.stok}
                          onChange={handleEditInputChange} required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                      <FileText size={14} /> Deskripsi
                    </label>
                    <textarea 
                      className="form-control" rows={4}
                      name="deskripsi"
                      value={editFormData.deskripsi}
                      onChange={handleEditInputChange}
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-light border-0 p-3 text-end">
                <button type="button" className="btn btn-light fw-bold rounded-3 me-2" onClick={handleCloseEditModal} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary fw-bold rounded-3 px-4" style={{backgroundColor: '#0d6efd'}} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin me-2" />
                      Menyimpan...
                    </>
                  ) : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* --- MODAL TAMBAH PRODUK (TERHUBUNG) --- */}
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
            <div className="card-header bg-light border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Tambah Produk Baru</h5>
              <button onClick={handleCloseAddModal} className="btn-close" disabled={isSubmitting}></button>
            </div>
            
            <form onSubmit={handleSimpanProdukBaru}>
              <div className="card-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                
                {modalError && (
                  <div className="alert alert-danger small py-2">{modalError}</div>
                )}
                
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted">Gambar Produk (Wajib)</label>
                    <div 
                      className="bg-light rounded-3 d-flex align-items-center justify-content-center position-relative overflow-hidden mb-2 border" 
                      style={{ height: '180px', cursor: 'pointer' }}
                      onClick={() => !isSubmitting && document.getElementById('imageUploadAdd')?.click()}
                    >
                      {newFormData.imageUrl ? (
                        <img src={newFormData.imageUrl} alt="Preview" className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <div className="text-center text-muted">
                          <Upload size={32} />
                          <small className="d-block mt-1">Upload Gambar</small>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" id="imageUploadAdd" className="d-none" 
                      accept="image/png, image/jpeg" onChange={handleNewImageChange}
                      required disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                        <Package size={14} /> Nama Produk
                      </label>
                      <input 
                        type="text" className="form-control"
                        name="nama"
                        value={newFormData.nama}
                        onChange={handleNewInputChange}
                        placeholder="Misal: Kampas Rem Tipe X"
                        required disabled={isSubmitting}
                      />
                    </div>
                    <div className="row g-3">
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <DollarSign size={14} /> Harga
                        </label>
                        <input 
                          type="number" className="form-control"
                          name="harga"
                          value={newFormData.harga}
                          onChange={handleNewInputChange}
                          placeholder="Misal: 50000"
                          required disabled={isSubmitting}
                        />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                          <Archive size={14} /> Stok
                        </label>
                        <input 
                          type="number" className="form-control"
                          name="stok"
                          value={newFormData.stok}
                          onChange={handleNewInputChange}
                          placeholder="Misal: 10"
                          required disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted d-flex align-items-center gap-1">
                      <FileText size={14} /> Deskripsi
                    </label>
                    <textarea 
                      className="form-control" rows={4}
                      name="deskripsi"
                      value={newFormData.deskripsi}
                      onChange={handleNewInputChange}
                      placeholder="Deskripsi singkat produk..."
                      disabled={isSubmitting}
                    ></textarea>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-light border-0 p-3 text-end">
                <button type="button" className="btn btn-light fw-bold rounded-3 me-2" onClick={handleCloseAddModal} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-success fw-bold rounded-3 px-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin me-2" />
                      Menyimpan...
                    </>
                  ) : "Simpan Produk Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}