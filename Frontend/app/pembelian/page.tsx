'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Image, Modal, Spinner, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Deklarasikan 'window.snap' agar TypeScript tidak error
declare global {
  interface Window {
    snap: any;
  }
}

// --- TIPE DATA ---
interface OrderItem {
  _id: string; // ID dari sub-dokumen
  productId: string;
  nama: string; // <-- dari 'name'
  image: string;
  harga: number; // <-- dari 'price'
  quantity: number;
}

type OrderStatus = 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Tiba' | 'Selesai' | 'Dibatalkan';

interface Order {
  _id: string; // <-- dari 'id'
  createdAt: string; // <-- dari 'date'
  status: OrderStatus;
  totalAmount: number; // <-- dari 'total'
  items: OrderItem[];
}

// === KOMPONEN PELACAK STATUS (STEPPER) ===
const OrderStatusTracker = ({ status }: { status: OrderStatus }) => {
  const steps = ['Diproses', 'Dikirim', 'Tiba', 'Selesai'];
  const statusMap: Record<OrderStatus, number> = {
    'Menunggu Pembayaran': 0, 
    'Diproses': 1,
    'Dikirim': 2,
    'Tiba': 3,
    'Selesai': 4,
    'Dibatalkan': -1,
  };
  const currentStepIndex = statusMap[status];

  if (currentStepIndex === -1) {
    return <p className="text-danger text-center fw-bold">Pesanan ini dibatalkan.</p>;
  }
  if (currentStepIndex === 0) {
    return <p className="text-warning text-center fw-bold">Menunggu pembayaran Anda.</p>;
  }
  return (
    <div className="stepper-wrapper">
      {steps.map((label, index) => {
        const stepIndex = index + 1;
        let stepClass = '';
        if (stepIndex < currentStepIndex) stepClass = 'completed';
        else if (stepIndex === currentStepIndex) stepClass = 'current';
        let iconClass = 'bi bi-box-seam';
        if (label === 'Dikirim') iconClass = 'bi bi-truck';
        if (label === 'Tiba') iconClass = 'bi bi-hand-thumbs-up';
        if (label === 'Selesai') iconClass = 'bi bi-star';
        return (
          <div key={label} className={`stepper-item ${stepClass}`}>
            <div className="stepper-icon"><i className={iconClass}></i></div>
            <div className="stepper-line"></div>
            <div className="stepper-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
};


// === HALAMAN UTAMA ===
export default function PembelianPage() {
  const router = useRouter();
  
  // --- STATE ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Semua');
  const [notification, setNotification] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRePaying, setIsRePaying] = useState(false); 

  // --- FUNGSI: Ambil data dari API ---
  const fetchOrders = async (currentUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/orders?userId=${currentUserId}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengambil data pesanan');
      }
      setOrders(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- EFEK 1: Ambil UserID ---
  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo"); 
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      setUserId(userInfo.userId); 
    } else {
      router.push('/login'); 
    }
  }, [router]);

  // --- EFEK 2: Ambil Data Pesanan (Dengan Logika Delay Refresh) ---
  useEffect(() => {
    if (userId) {
      // Cek apakah ada notifikasi sukses dari halaman pembayaran (trigger refresh)
      const successNotif = localStorage.getItem("showSuccessNotification");
      
      const refreshData = () => {
          fetchOrders(userId);
          // Hapus notifikasi setelah fetch berhasil
          if (successNotif) {
              localStorage.removeItem("showSuccessNotification");
              setNotification(successNotif); 
          }
      };

      if (successNotif) {
        // ** LOGIKA DELAY REFRESH **
        // Tambahkan delay 1 detik untuk memberi waktu Midtrans Webhook memproses status.
        setLoading(true);
        const timer = setTimeout(refreshData, 1000); 
        return () => clearTimeout(timer); // Cleanup timer saat unmount
      } else {
        refreshData(); // Panggil fetchOrders normal
      }
    }
  }, [userId]); 

  // --- FUNGSI BARU: Bayar Ulang (Memanggil Snap) ---
  const handleBayarUlang = async (orderId: string, totalAmount: number) => {
    if (isRePaying || !userId) return;
    setIsRePaying(true);
    setNotification(null);

    try {
        // 1. Panggil API backend untuk mendapatkan token (endpoint yang sama)
        const response = await fetch('http://localhost:5000/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                orderId: orderId, // Mengirim ID order yang sudah ada
                userId: userId, 
            })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Gagal mendapatkan token pembayaran ulang');
        }

        const transactionToken = data.data.token;
        
        // 2. Tampilkan Pop-up Snap
        window.snap.pay(transactionToken, {
            onSuccess: function(result: any){
                // ** PERBAIKAN: Gunakan localStorage untuk trigger refresh di halaman ini **
                localStorage.setItem("showSuccessNotification", "✅ Pembayaran berhasil! Status akan segera diperbarui.");
                window.location.reload(); // Paksa refresh halaman untuk trigger useEffect delay
            },
            onPending: function(result: any){
                localStorage.setItem("showSuccessNotification", "⏳ Menunggu pembayaran. Selesaikan pembayaran di pop-up.");
                fetchOrders(userId);
            },
            onError: function(result: any){
                setNotification("❌ Pembayaran gagal. Silakan coba lagi.");
                setIsRePaying(false);
            },
            onClose: function(){
                setIsRePaying(false);
            }
        });

    } catch (err: any) {
        setNotification(`Error: ${err.message}`);
        setIsRePaying(false);
    }
  };


  // Fungsi untuk membuka/menutup modal (Tidak berubah)
  const handleShowStatus = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };
  const handleCloseStatus = () => setShowStatusModal(false);

  // Logika filter (Tidak berubah)
  const filteredOrders = activeTab === 'Semua' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  // Helper & Format (Tidak berubah)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Pembayaran': return 'warning';
      case 'Diproses': return 'info';
      case 'Dikirim': return 'primary';
      case 'Tiba': return 'info';
      case 'Selesai': return 'success';
      case 'Dibatalkan': return 'danger';
      default: return 'secondary';
    }
  };
  const formatTanggal = (tanggalISO: string) => {
    return new Date(tanggalISO).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="w-100 py-5 d-flex flex-column flex-grow-1" 
      style={{ backgroundColor: '#E5E9F0', minHeight: '100%' }}
    >
      <Container>
        <h2 className="fw-bold text-dark mb-4">Daftar Transaksi</h2>

        {/* --- NOTIFIKASI SUKSES --- */}
        {notification && (
          <Alert 
            variant="success" 
            onClose={() => setNotification(null)} 
            dismissible
            className="fw-bold"
          >
            {notification}
          </Alert>
        )}

        {/* Filter Tabs */}
        <Nav variant="pills" className="mb-4 overflow-auto flex-nowrap pb-2" activeKey={activeTab}>
          {['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Selesai', 'Dibatalkan'].map((tab) => (
            <Nav.Item key={tab}>
              <Nav.Link 
                eventKey={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {tab}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {/* --- TAMPILAN LOADING / ERROR --- */}
        {loading && (
          <div className="text-center p-5">
            <Spinner animation="border" />
            <p className="mt-2 text-muted">Memuat riwayat transaksi...</p>
          </div>
        )}
        {error && (
          <Alert variant="danger">Gagal memuat data: {error}</Alert>
        )}

        {/* Daftar Pesanan */}
        <div className="d-flex flex-column gap-4">
          {!loading && !error && filteredOrders.length > 0 && (
            filteredOrders.map((order) => {
              const showTrackerButton = order.status === 'Diproses' || order.status === 'Dikirim' || order.status === 'Tiba';
              const shortOrderId = `...${order._id.slice(-6)}`;

              return (
                <Card key={order._id} className="border-0 rounded-3 overflow-hidden card-transaction bg-white">
                  
                  <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-dark small">{formatTanggal(order.createdAt)}</span>
                        <span className="text-secondary small d-none d-sm-inline">INV/.../{shortOrderId}</span>
                      </div>
                      <Badge bg={getStatusBadge(order.status)} className="px-3 py-2 rounded-pill fw-normal">
                        {order.status}
                      </Badge>
                    </div>
                  </Card.Header>

                  <Card.Body className="p-4">
                    {order.items.map((item) => (
                      <Row key={item._id} className="mb-3 align-items-center">
                        <Col xs="auto">
                          <Image src={item.image} alt={item.nama} rounded style={{ width: '70px', height: '70px', objectFit: 'cover', border: '1px solid #eee' }} />
                        </Col>
                        <Col>
                          <h6 className="fw-bold text-dark mb-1">{item.nama}</h6>
                          <p className="text-secondary small mb-0">
                            {item.quantity} x {item.harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                          </p>
                        </Col>
                      </Row>
                    ))}
                  </Card.Body>

                  <Card.Footer className="bg-white border-0 pt-0 pb-4 px-4">
                    <div className="d-flex justify-content-between align-items-end">
                      <div>
                        <span className="text-secondary small d-block">Total Belanja</span>
                        <span className="fw-bold text-dark fs-5">
                          {order.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      
                      <div className="d-flex gap-2">
                        {/* === MODIFIKASI: TOMBOL BAYAR SEKARANG === */}
                        {order.status === 'Menunggu Pembayaran' && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="fw-bold"
                            onClick={() => handleBayarUlang(order._id, order.totalAmount)}
                            disabled={isRePaying}
                          >
                            {isRePaying ? (
                                <Spinner as="span" animation="border" size="sm" className="me-1" />
                            ) : "Bayar Sekarang"}
                          </Button>
                        )}
                        {/* ======================================= */}
                        
                        {showTrackerButton && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="fw-bold"
                            onClick={() => handleShowStatus(order)}
                          >
                            Cek Status
                          </Button>
                        )}

                        {order.status === 'Selesai' && (
                          <Button variant="outline-primary" size="sm" className="fw-bold">Beli Lagi</Button>
                        )}
                        
                        {!showTrackerButton && order.status !== 'Menunggu Pembayaran' && (
                           <Button variant="outline-secondary" size="sm" className="fw-bold">
                            Lihat Detail
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Footer>
                </Card>
              );
            })
          )}
          
          {/* Tampilan Jika Kosong */}
          {!loading && !error && filteredOrders.length === 0 && (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-receipt text-secondary" style={{ fontSize: '4rem' }}></i>
              </div>
              <h5 className="fw-bold text-dark">
                {activeTab === 'Semua' ? 'Belum ada pesanan' : `Belum ada pesanan dengan status "${activeTab}"`}
              </h5>
              <p className="text-secondary">Yuk, mulai belanja sparepart atau booking jasa servis sekarang!</p>
              <Link href="/produk" passHref legacyBehavior>
                <Button variant="primary" className="fw-bold px-4">Mulai Belanja</Button>
              </Link>
            </div>
          )}
        </div>
      </Container>

      {/* Modal Lacak Status */}
      <Modal show={showStatusModal} onHide={handleCloseStatus} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Status Pesanan</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedOrder && (
            <>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">...{selectedOrder._id.slice(-6)}</span>
                <span className="text-secondary small">{formatTanggal(selectedOrder.createdAt)}</span>
              </div>
              <h5 className="fw-bold text-dark mb-3">
                {selectedOrder.status}
              </h5>
              <OrderStatusTracker status={selectedOrder.status} />
            </>
          )}
        </Modal.Body>
      </Modal>

    </div>
  );
}