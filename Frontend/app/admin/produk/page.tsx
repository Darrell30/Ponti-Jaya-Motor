// app/admin/produk/page.tsx
"use client";

import { useState, useEffect } from "react"; // <-- 1. Impor Hooks
import { Edit, Check, X, Plus, Loader2 } from "lucide-react"; // <-- 2. Impor Ikon Loading

// --- 3. Definisikan Tipe data sesuai Skema MongoDB ---
interface Product {
  _id: string; // MongoDB menggunakan _id (string)
  nama: string;
  imageUrl: string;
  harga: number;
  stok: number;
  deskripsi: string;
}

export default function ProdukPage() {
  // --- 4. Siapkan State ---
  const [products, setProducts] = useState<Product[]>([]); // Mulai dengan array kosong
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk mode edit (sekarang menggunakan string _id)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  // (Kita akan tambahkan state lain untuk edit nanti jika perlu)

  // --- 5. Logika Fetch Data ---
  useEffect(() => {
    const fetchProducts = async () => {
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

    fetchProducts();
  }, []); // [] = Jalankan sekali saat halaman dimuat

  
  // --- 6. Perbarui Fungsi Edit (menggunakan _id string) ---
  const handleStartEdit = (product: Product) => {
    setEditingId(product._id); // Gunakan _id
    setEditName(product.nama);
    // Di sini Anda juga bisa set state lain (harga, stok, dll)
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = (id: string) => {
    // PENTING: Ini hanya menyimpan di frontend (dummy)
    // Nanti, kita perlu membuat fungsi 'fetch' PUT/PATCH ke backend
    console.log(`(Dummy Save) ID: ${id}, Nama Baru: ${editName}`);
    
    setProducts(products.map(product => 
      product._id === id ? { ...product, nama: editName } : product
    ));
    setEditingId(null);
  };
  
  return (
    <>
      {/* Judul Halaman */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Daftar Produk</h5>
        <button className="btn btn-success btn-sm d-flex align-items-center gap-2 rounded-3 fw-bold px-3">
          <Plus size={16} /> Tambah
        </button>
      </div>
      
      {/* --- 7. Tampilkan Status Loading / Error --- */}
      {loading && (
        <div className="text-center py-5">
          <Loader2 size={32} className="animate-spin" />
          <p className="mt-2">Memuat produk dari database...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* --- 8. Grid Produk (dari data asli) --- */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-4">
        {!loading && !error && products.map((product) => (
          <div className="col" key={product._id}> {/* <-- Gunakan _id */}
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3">
              
              {/* Gambar Produk */}
              <div className="bg-light rounded-3 mb-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '180px' }}>
                 <img 
                   src={product.imageUrl} // <-- Data Asli
                   alt={product.nama}     // <-- Data Asli
                   className="w-100 h-100 object-fit-cover" 
                 />
              </div>

              {/* Body Kartu */}
              <div className="text-center">
                
                {editingId === product._id ? ( // <-- Gunakan _id
                  // Tampilan saat mode EDIT
                  <div className="d-flex flex-column gap-2">
                    <input 
                      type="text" 
                      className="form-control form-control-sm text-center fw-bold"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                     {/* Nanti kita tambahkan input untuk Harga, Stok, dll di sini */}
                     <div className="d-flex gap-2 justify-content-center">
                        <button onClick={() => handleSaveEdit(product._id)} className="btn btn-success btn-sm flex-fill">
                          <Check size={16} />
                        </button>
                        <button onClick={handleCancelEdit} className="btn btn-danger btn-sm flex-fill">
                          <X size={16} />
                        </button>
                     </div>
                  </div>
                ) : (
                  // Tampilan Normal
                  <>
                    <h6 className="fw-bold text-dark mb-3">{product.nama}</h6>
                    <button 
                      onClick={() => handleStartEdit(product)}
                      className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-2 rounded-3" 
                      style={{backgroundColor: '#0d6efd'}}
                    >
                      <Edit size={16} />
                      Ubah
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}