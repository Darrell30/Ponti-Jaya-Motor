// app/admin/dashboard/page.tsx
import { TrendingUp, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      {/* card statistik */}
      <section className="mb-5">
        <h5 className="fw-bold mb-3 text-dark">Performa Toko</h5>
        <div className="row g-3">
          {/* Kartu 1 */}
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 rounded-4">
              <div className="card-body p-4">
                <p className="text-muted mb-2">Produk Dilihat</p>
                <h2 className="fw-bolder mb-3 display-6">67</h2>
                <div className="d-inline-flex align-items-center px-3 py-1 rounded-3" style={{backgroundColor: '#dcfce7'}}>
                   <TrendingUp size={16} className="text-success me-2" /> 
                   <span className="fw-bold text-success me-1">+26</span> 
                   <span className="text-muted small">dari 30 hari</span>
                </div>
              </div>
            </div>
          </div>
           {/* Kartu 2 */}
           <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 rounded-4">
              <div className="card-body p-4">
                <p className="text-muted mb-2">Dalam Keranjang</p>
                <h2 className="fw-bolder mb-3 display-6">12</h2>
                <div className="d-inline-flex align-items-center px-3 py-1 rounded-3" style={{backgroundColor: '#dcfce7'}}>
                   <TrendingUp size={16} className="text-success me-2" /> 
                   <span className="fw-bold text-success me-1">+4</span> 
                   <span className="text-muted small">dari 30 hari</span>
                </div>
              </div>
            </div>
          </div>
           {/* Kartu 3 */}
           <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 rounded-4">
              <div className="card-body p-4">
                <p className="text-muted mb-2">Terjual</p>
                <h2 className="fw-bolder mb-3 display-6">90</h2>
                <div className="d-inline-flex align-items-center px-3 py-1 rounded-3" style={{backgroundColor: '#dcfce7'}}>
                   <TrendingUp size={16} className="text-success me-2" /> 
                   <span className="fw-bold text-success me-1">+45</span> 
                   <span className="text-muted small">dari 30 hari</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* produk dan stok*/}
      <section className="row g-4">
        
        {/* Produk Terlaris */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3 text-dark">Produk Terlaris</h5>
            
            <div className="d-flex flex-column gap-3 mb-4">
              {/* Item 1 */}
              <div className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#f8f9fa'}}>
                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm" style={{minWidth: '60px', height: '60px'}}>IMG</div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Kampas Rem</h6>
                  <small className="text-muted">45 terjual bulan ini</small>
                </div>
              </div>
              {/* Item 2 */}
              <div className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#f8f9fa'}}>
                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm" style={{minWidth: '60px', height: '60px'}}>IMG</div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Master Rem</h6>
                  <small className="text-muted">28 terjual bulan ini</small>
                </div>
              </div>
               {/* Item 3 */}
               <div className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#f8f9fa'}}>
                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm" style={{minWidth: '60px', height: '60px'}}>IMG</div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Master Central</h6>
                  <small className="text-muted">12 terjual bulan ini</small>
                </div>
              </div>
            </div>
            <div className="text-muted small border-top pt-3">dari 30 hari terakhir</div>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-dark">
              Stok Menipis <AlertCircle size={18} className="text-danger" />
            </h5>
            <div className="d-flex flex-column gap-3 mb-4">
               {/* Item Stok 1 */}
               <div className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#fee2e2'}}>
                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm" style={{minWidth: '60px', height: '60px'}}>IMG</div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Kampas Rem Belakang</h6>
                  <small className="text-danger fw-bold">Sisa stok: 2</small>
                </div>
              </div>
               {/* Item Stok 2 */}
               <div className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#fee2e2'}}>
                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm" style={{minWidth: '60px', height: '60px'}}>IMG</div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Oli Mesin MPX</h6>
                  <small className="text-danger fw-bold">Sisa stok: 5</small>
                </div>
              </div>
              {/* Item Stok 3 */}
               <div className="d-flex align-items-center p-3 rounded-4" style={{backgroundColor: '#fee2e2'}}>
                <div className="bg-white rounded-3 d-flex align-items-center justify-content-center text-muted small me-3 shadow-sm" style={{minWidth: '60px', height: '60px'}}>IMG</div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Kampas Rem</h6>
                  <small className="text-danger fw-bold">Sisa stok: 1</small>
                </div>
              </div>
            </div>
            <div className="text-muted small border-top pt-3">Perlu restock segera</div>
          </div>
        </div>

      </section>
    </>
  );
}