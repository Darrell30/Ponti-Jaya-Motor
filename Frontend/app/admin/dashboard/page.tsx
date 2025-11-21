// app/admin/dashboard/page.tsx
'use client'; // <-- WAJIB ADA untuk hooks

import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, ShoppingCart, DollarSign, Archive, Loader2 } from 'lucide-react';
import { Alert, Card, Spinner } from 'react-bootstrap'; // Import komponen Bootstrap

//TIPE DATA
interface Stats {
  totalRevenue: number;
  totalSoldItems: number;
  totalInCarts: number;
}
interface TopProduct {
  nama: string;
  imageUrl: string;
  totalSold: number;
}
interface LowStockProduct {
  _id: string;
  nama: string;
  imageUrl: string;
  stok: number;
}

//Komponen kecil untuk Loading Card
const StatCardLoading = () => (
  <div className="col-md-4">
    <div className="card border-0 shadow-sm h-100 rounded-4">
      <div className="card-body p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '150px' }}>
        <Spinner animation="border" size="sm" />
      </div>
    </div>
  </div>
);

//Komponen kecil untuk Loading List
const ListLoading = () => (
  <div className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#f8f9fa'}}>
    <div className="bg-light rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm" style={{minWidth: '60px', height: '60px'}}>...</div>
    <div>
      <h6 className="fw-bold text-dark mb-1 bg-light rounded" style={{width: '150px'}}>&nbsp;</h6>
      <small className="text-muted bg-light rounded" style={{width: '100px', display: 'block'}}>&nbsp;</small>
    </div>
  </div>
);


export default function DashboardPage() {
  
  //STATE UNTUK DATA
  const [stats, setStats] = useState<Stats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //EFEK UNTUK FETCH DATA
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard-stats`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Gagal mengambil data');
        }
        
        setStats(data.data.stats);
        setTopProducts(data.data.topSellingProducts);
        setLowStockProducts(data.data.lowStockProducts);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []); 

  // Format Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };


  return (
    <>
      {/* Tampilkan error jika ada */}
      {error && (
        <Alert variant="danger">
          <strong>Gagal memuat data:</strong> {error}
        </Alert>
      )}

      {/* card statistik */}
      <section className="mb-5">
        <h5 className="fw-bold mb-3 text-dark">Performa Toko</h5>
        <div className="row g-3">
          
          {loading ? (
            <>
              <StatCardLoading />
              <StatCardLoading />
              <StatCardLoading />
            </>
          ) : (
            <>
              {/* Kartu 1: Total Pendapatan (BARU) */}
              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100 rounded-4">
                  <div className="card-body p-4">
                    <p className="text-muted mb-2 d-flex align-items-center gap-2">
                      <DollarSign size={16} /> Total Pendapatan
                    </p>
                    <h2 className="fw-bolder mb-3 display-6">
                      {stats ? formatRupiah(stats.totalRevenue) : 'Rp 0'}
                    </h2>
                    <div className="text-muted small">Dari pesanan "Selesai"</div>
                  </div>
                </div>
              </div>
              
              {/* Kartu 2: Dalam Keranjang (DINAMIS) */}
              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100 rounded-4">
                  <div className="card-body p-4">
                    <p className="text-muted mb-2 d-flex align-items-center gap-2">
                      <ShoppingCart size={16} /> Dalam Keranjang
                    </p>
                    <h2 className="fw-bolder mb-3 display-6">
                      {stats ? stats.totalInCarts : 0}
                    </h2>
                    <div className="text-muted small">Total item di keranjang user</div>
                  </div>
                </div>
              </div>
              
              {/* Kartu 3: Terjual (DINAMIS) */}
              <div className="col-md-4">
                <div className="card border-0 shadow-sm h-100 rounded-4">
                  <div className="card-body p-4">
                    <p className="text-muted mb-2 d-flex align-items-center gap-2">
                       <Archive size={16} /> Item Terjual
                    </p>
                    <h2 className="fw-bolder mb-3 display-6">
                      {stats ? stats.totalSoldItems : 0}
                    </h2>
                    <div className="text-muted small">Dari pesanan "Selesai"</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* produk dan stok */}
      <section className="row g-4">
        
        {/* Produk Terlaris (DINAMIS) */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3 text-dark">Produk Terlaris (Top 6)</h5>
            
            <div className="d-flex flex-column gap-3 mb-4">
              {loading ? (
                <>
                  <ListLoading />
                  <ListLoading />
                  <ListLoading />
                </>
              ) : topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#f8f9fa'}}>
                    <img 
                      src={product.imageUrl} 
                      alt={product.nama}
                      className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm object-fit-cover" 
                      style={{minWidth: '60px', height: '60px', width: '60px'}}
                    />
                    <div>
                      <h6 className="fw-bold text-dark mb-1 text-truncate" style={{maxWidth: '250px'}}>{product.nama}</h6>
                      <small className="text-muted fw-bold">{product.totalSold} terjual bulan ini</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center">Belum ada produk yang terjual.</p>
              )}
            </div>
            <div className="text-muted small border-top pt-3">Dari pesanan "Selesai"</div>
          </div>
        </div>

        {/* Stok Menipis (DINAMIS) */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              Stok Menipis <AlertCircle size={18} className="text-danger" />
            </h5>
            <div className="d-flex flex-column gap-3 mb-4" style={{maxHeight: '400px', overflowY: 'auto'}}>
              {loading ? (
                <>
                  <ListLoading />
                  <ListLoading />
                  <ListLoading />
                </>
              ) : lowStockProducts.length > 0 ? (
                // Tampilkan SEMUA produk (sesuai permintaan)
                lowStockProducts.map((product) => (
                  <div key={product._id} className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#fee2e2'}}>
                    <img 
                      src={product.imageUrl} 
                      alt={product.nama}
                      className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm object-fit-cover" 
                      style={{minWidth: '60px', height: '60px', width: '60px'}}
                    />
                    <div>
                      <h6 className="fw-bold text-dark mb-1 text-truncate" style={{maxWidth: '250px'}}>{product.nama}</h6>
                      <small className="text-danger fw-bold">Sisa stok: {product.stok}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center">Aman! Tidak ada produk yang stoknya menipis.</p>
              )}
            </div>
            <div className="text-muted small border-top pt-3">Menampilkan produk dengan stok &lt; 10</div>
          </div>
        </div>
      </section>
    </>
  );
}