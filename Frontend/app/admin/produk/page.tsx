// app/admin/produk/page.tsx
"use client";

import { useState } from "react";
import { Edit, Check, X, Plus } from "lucide-react";

// Dummy data agar tampilan langsung terlihat ramai seperti di gambar
const initialProducts = [
  { id: 1, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
  { id: 2, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
  { id: 3, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
  { id: 4, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
  { id: 5, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
  { id: 6, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
  { id: 7, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
  { id: 8, name: "As Ayun", imageUrl: "https://placehold.co/200x200/png?text=IMG" },
];

export default function ProdukPage() {
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const handleStartEdit = (product: any) => {
    setEditingId(product.id);
    setEditName(product.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = (id: number) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, name: editName } : product
    ));
    setEditingId(null);
  };
  
  return (
    <>
      {/* Judul Halaman */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Daftar Produk</h5>
        {/* Tombol Tambah (Opsional, biar terlihat lengkap adminnya) */}
        <button className="btn btn-success btn-sm d-flex align-items-center gap-2 rounded-3 fw-bold px-3">
          <Plus size={16} /> Tambah
        </button>
      </div>
      
      {/* Grid Produk 4 Kolom */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-4 g-4">
        {products.map((product) => (
          <div className="col" key={product.id}>
            <div className="card h-100 border-0 shadow-sm rounded-4 p-3">
              
              {/* Gambar Produk */}
              <div className="bg-light rounded-3 mb-3 d-flex align-items-center justify-content-center overflow-hidden" style={{ height: '180px' }}>
                 {/* Nanti ganti src ini dengan data gambar asli dari database */}
                 <img 
                   src={product.imageUrl} 
                   alt={product.name}
                   className="w-100 h-100 object-fit-cover" 
                 />
              </div>

              {/* Body Kartu */}
              <div className="text-center">
                
                {editingId === product.id ? (
                  // Tampilan saat mode EDIT
                  <div className="d-flex flex-column gap-2">
                    <input 
                      type="text" 
                      className="form-control form-control-sm text-center fw-bold"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                     <div className="d-flex gap-2 justify-content-center">
                        <button onClick={() => handleSaveEdit(product.id)} className="btn btn-success btn-sm flex-fill">
                          <Check size={16} />
                        </button>
                        <button onClick={handleCancelEdit} className="btn btn-danger btn-sm flex-fill">
                          <X size={16} />
                        </button>
                     </div>
                  </div>
                ) : (
                  // Tampilan 
                  <>
                    <h6 className="fw-bold text-dark mb-3">{product.name}</h6>
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