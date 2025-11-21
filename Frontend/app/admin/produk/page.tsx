// app/admin/produk/page.tsx
"use client";

import { useState, useEffect } from "react";
// 1. Tambahkan Form, InputGroup, Row, Col dari 'react-bootstrap' dan ikon 'Search'
import { Form, InputGroup, Row, Col } from "react-bootstrap";
import { Edit, Plus, Upload, Package, DollarSign, Archive, FileText, Loader2, Trash2, AlertTriangle, Search } from "lucide-react";

// --- Tipe data Produk ---
interface Product {
  _id: string;
  nama: string;
  harga: number;
  stok: number;
  deskripsi: string;
  imageUrl: string; 
};

// --- Tipe data untuk Form ---
type ProductFormState = {
  _id: string | null;
  nama: string;
  harga: string; 
  stok: number;
  deskripsi: string;
  imageUrl: string; 
  imageFile?: File | null;
};

const newProductInitialState: ProductFormState = {
  _id: null,
  nama: '',
  harga: '',
  stok: 0,
  deskripsi: '',
  imageUrl: '', 
  imageFile: null,
};

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Tambahkan State untuk Search Query
  const [searchQuery, setSearchQuery] = useState("");

  // State Modal Edit & Tambah
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<ProductFormState>(newProductInitialState);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFormData, setNewFormData] = useState<ProductFormState>(newProductInitialState);

  // --- STATE BARU: Modal Hapus ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Loading saat menghapus

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spareparts`);
      if (!response.ok) throw new Error('Gagal mengambil data');
      const data = await response.json();
      if (data.success) setProducts(data.data);
      else throw new Error(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA HAPUS PRODUK ---
  const handleOpenDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      // Panggil API Delete di Backend
      // (Ini sekarang akan memanggil rute baru Anda yang juga menghapus dari Cloudinary)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spareparts/${productToDelete._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal menghapus produk");
      }

      // Sukses: Hapus dari state lokal agar hilang dari layar
      setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
      
      handleCloseDeleteModal();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };
  // ---------------------------

  // --- Logika Modal Edit (Tidak Berubah) ---
  const handleOpenEditModal = (product: Product) => {
    setEditFormData({
      _id: product._id,
      nama: product.nama,
      harga: String(product.harga),
      stok: product.stok,
      deskripsi: product.deskripsi,
      imageUrl: product.imageUrl,
      imageFile: null,
    });
    setModalError(null);
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => setShowEditModal(false);

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'harga') {
      const cleanValue = value.replace(/\D/g, '');
      const formattedValue = cleanValue.replace(/^0+(?=\d)/, '');
      setEditFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'stok') {
      const stokValue = parseInt(value) || 0;
      setEditFormData(prev => ({ ...prev, [name]: Math.max(0, stokValue) }));
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

  const handleSimpanPerubahan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData._id) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      let finalImageUrl = editFormData.imageUrl;
      if (editFormData.imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', editFormData.imageFile);
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: 'POST',
          body: imageFormData,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error(uploadData.message);
        finalImageUrl = uploadData.url;
      }

      const productData = {
        nama: editFormData.nama,
        harga: parseInt(editFormData.harga) || 0,
        stok: editFormData.stok,
        deskripsi: editFormData.deskripsi,
        imageUrl: finalImageUrl,
      };

      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spareparts/${editFormData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const updateData = await updateResponse.json();
      if (!updateData.success) throw new Error(updateData.message);

      setProducts(products.map(product => 
        product._id === updateData.data._id ? updateData.data : product
      ));
      handleCloseEditModal();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Logika Modal Tambah (Tidak Berubah) ---
  const handleOpenAddModal = () => {
    setNewFormData(newProductInitialState); 
    setModalError(null);
    setShowAddModal(true);
  };
  const handleCloseAddModal = () => setShowAddModal(false);

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'harga') {
      const cleanValue = value.replace(/\D/g, '');
      const formattedValue = cleanValue.replace(/^0+(?=\d)/, '');
      setNewFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'stok') {
      const stokValue = parseInt(value) || 0;
      setNewFormData(prev => ({ ...prev, [name]: Math.max(0, stokValue) }));
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

  const handleSimpanProdukBaru = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.imageFile) {
      setModalError("Harap upload gambar produk.");
      return;
    }
    setIsSubmitting(true);
    setModalError(null);

    try {
      const imageFormData = new FormData();
      imageFormData.append('file', newFormData.imageFile); 
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        body: imageFormData, 
      });
      const uploadData = await uploadResponse.json();
      if (!uploadData.success) throw new Error(uploadData.message);

      const productData = {
        nama: newFormData.nama,
        harga: parseInt(newFormData.harga) || 0,
        stok: newFormData.stok,
        deskripsi: newFormData.deskripsi,
        imageUrl: uploadData.url,
      };

      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spareparts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const createData = await createResponse.json();
      if (!createData.success) throw new Error(createData.message);

      setProducts(prevProducts => [createData.data, ...prevProducts]);
      handleCloseAddModal();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Logika untuk memfilter produk berdasarkan search query
  const filteredProducts = products.filter(product =>
    product.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* 4. Modifikasi Header dengan Search Bar */}
      <Row className="mb-4 g-3 align-items-center">
        <Col md={4}>
          <h5 className="fw-bold text-dark mb-0">Daftar Produk</h5>
        </Col>
        
        <Col md={5}>
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="bg-white border-0">
              <Search size={16} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Cari produk berdasarkan nama..."
              className="border-0 shadow-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>

        <Col md={3} className="text-md-end">
          <button onClick={handleOpenAddModal} className="btn btn-success btn-sm d-flex align-items-center gap-2 rounded-3 fw-bold px-3 w-100 w-md-auto justify-content-center">
            <Plus size={16} /> Tambah Produk
          </button>
        </Col>
      </Row>
      
      {loading && (
        <div className="text-center py-5">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="mt-2 text-muted">Memuat produk...</p>
        </div>
      )}
      {error && <div className="alert alert-danger"><strong>Error:</strong> {error}</div>}

      {/* 5. Gunakan `filteredProducts` untuk me-render daftar */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-4">
        {!loading && !error && filteredProducts.map((product) => (
          <div className="col" key={product._id}>
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3">
              <div className="bg-light rounded-3 mb-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '180px' }}>
                 <img src={product.imageUrl} alt={product.nama} className="w-100 h-100 object-fit-cover" />
              </div>
              <div className="text-center">
                <h6 className="fw-bold text-dark mb-3 text-truncate">{product.nama}</h6>
                <div className="d-flex gap-2">
                  <button 
                    onClick={() => handleOpenEditModal(product)}
                    className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold py-2 rounded-3" 
                    style={{backgroundColor: '#0d6efd'}}
                  >
                    <Edit size={16} /> Ubah
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(product)}
                    className="btn btn-danger d-flex align-items-center justify-content-center py-2 rounded-3 px-3"
                    title="Hapus Produk"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* 6. Tampilkan pesan jika hasil filter kosong */}
        {!loading && !error && filteredProducts.length === 0 && (
          <Col xs={12} className="text-center py-5">
            <h5 className="text-muted fw-bold">Produk Tidak Ditemukan</h5>
            <p className="text-muted">Tidak ada produk yang cocok dengan kata kunci "{searchQuery}".</p>
          </Col>
        )}
      </div>

      {/* --- MODAL EDIT (Tidak Berubah) --- */}
      {showEditModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 9998, backdropFilter: 'blur(5px)' }} onClick={handleCloseEditModal}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header bg-light border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Ubah Detail Produk</h5>
              <button onClick={handleCloseEditModal} className="btn-close" disabled={isSubmitting}></button>
            </div>
            <form onSubmit={handleSimpanPerubahan}>
              <div className="card-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {modalError && <div className="alert alert-danger small py-2">{modalError}</div>}
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted">Gambar Produk</label>
                    <div className="bg-light rounded-3 d-flex align-items-center justify-content-center position-relative overflow-hidden mb-2" style={{ height: '180px', cursor: 'pointer' }} onClick={() => !isSubmitting && document.getElementById('imageUploadEdit')?.click()}>
                      <img src={editFormData.imageUrl} alt="Preview" className="w-100 h-100 object-fit-cover" />
                      <div className="position-absolute text-white bg-dark bg-opacity-50 p-2 rounded-3"><Upload size={20} /></div>
                    </div>
                    <input type="file" id="imageUploadEdit" className="d-none" accept="image/png, image/jpeg" onChange={handleEditImageChange} disabled={isSubmitting} />
                  </div>
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted"><Package size={14} /> Nama Produk</label>
                      <input type="text" className="form-control" name="nama" value={editFormData.nama} onChange={handleEditInputChange} required disabled={isSubmitting} />
                    </div>
                    <div className="row g-3">
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted"><DollarSign size={14} /> Harga</label>
                        <input type="text" inputMode="numeric" className="form-control" name="harga" value={editFormData.harga} onChange={handleEditInputChange} required disabled={isSubmitting} />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted"><Archive size={14} /> Stok</label>
                        <input type="number" min="0" className="form-control" name="stok" value={editFormData.stok} onChange={handleEditInputChange} required disabled={isSubmitting} />
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted"><FileText size={14} /> Deskripsi</label>
                    <textarea className="form-control" rows={4} name="deskripsi" value={editFormData.deskripsi} onChange={handleEditInputChange} disabled={isSubmitting}></textarea>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-light border-0 p-3 text-end">
                <button type="button" className="btn btn-light fw-bold rounded-3 me-2" onClick={handleCloseEditModal} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn btn-primary fw-bold rounded-3 px-4" style={{backgroundColor: '#0d6efd'}} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin me-2" /> Menyimpan...</> : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* --- MODAL TAMBAH (Tidak Berubah) --- */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 9998, backdropFilter: 'blur(5px)' }} onClick={handleCloseAddModal}>
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="card-header bg-light border-0 p-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-dark">Tambah Produk Baru</h5>
              <button onClick={handleCloseAddModal} className="btn-close" disabled={isSubmitting}></button>
            </div>
            <form onSubmit={handleSimpanProdukBaru}>
              <div className="card-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {modalError && <div className="alert alert-danger small py-2">{modalError}</div>}
                <div className="row g-3">
                  <div className="col-md-5">
                    <label className="form-label small fw-bold text-muted">Gambar Produk (Wajib)</label>
                    <div className="bg-light rounded-3 d-flex align-items-center justify-content-center position-relative overflow-hidden mb-2 border" style={{ height: '180px', cursor: 'pointer' }} onClick={() => !isSubmitting && document.getElementById('imageUploadAdd')?.click()}>
                      {newFormData.imageUrl ? (
                        <img src={newFormData.imageUrl} alt="Preview" className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <div className="text-center text-muted"><Upload size={32} /><small className="d-block mt-1">Upload Gambar</small></div>
                      )}
                    </div>
                    <input type="file" id="imageUploadAdd" className="d-none" accept="image/png, image/jpeg" onChange={handleNewImageChange} required disabled={isSubmitting} />
                  </div>
                  <div className="col-md-7">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted"><Package size={14} /> Nama Produk</label>
                      <input type="text" className="form-control" name="nama" value={newFormData.nama} onChange={handleNewInputChange} placeholder="Misal: Kampas Rem" required disabled={isSubmitting} />
                    </div>
                    <div className="row g-3">
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted"><DollarSign size={14} /> Harga</label>
                        <input type="text" inputMode="numeric" className="form-control" name="harga" value={newFormData.harga} onChange={handleNewInputChange} placeholder="50000" required disabled={isSubmitting} />
                      </div>
                      <div className="col-sm-6 mb-3">
                        <label className="form-label small fw-bold text-muted"><Archive size={14} /> Stok</label>
                        <input type="number" min="0" className="form-control" name="stok" value={newFormData.stok} onChange={handleNewInputChange} placeholder="10" required disabled={isSubmitting} />
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-muted"><FileText size={14} /> Deskripsi</label>
                    <textarea className="form-control" rows={4} name="deskripsi" value={newFormData.deskripsi} onChange={handleNewInputChange} placeholder="Deskripsi singkat..." disabled={isSubmitting}></textarea>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-light border-0 p-3 text-end">
                <button type="button" className="btn btn-light fw-bold rounded-3 me-2" onClick={handleCloseAddModal} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn btn-success fw-bold rounded-3 px-4" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} className="animate-spin me-2" /> Menyimpan...</> : "Simpan Produk Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI HAPUS (Tidak Berubah) --- */}
      {showDeleteModal && productToDelete && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3" 
          style={{ zIndex: 9999, backdropFilter: 'blur(5px)' }}
        >
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate-pop-in" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3 text-danger">
                <AlertTriangle size={48} />
              </div>
              <h5 className="fw-bold text-dark mb-2">Hapus Produk?</h5>
              <p className="text-muted mb-4">
                Apakah Anda yakin ingin menghapus <strong>"{productToDelete.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="d-flex gap-2 justify-content-center">
                <button 
                  onClick={handleCloseDeleteModal} 
                  className="btn btn-light fw-bold rounded-pill px-4 flex-fill"
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button 
                  onClick={handleConfirmDelete} 
                  className="btn btn-danger fw-bold rounded-pill px-4 flex-fill"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin me-2" /> Menghapus...
                    </>
                  ) : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}