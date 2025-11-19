'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Image, Modal, Spinner, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react'; 

declare global {
  interface Window {
    snap: any;
  }
}

const API_URL = 'http://localhost:5000';
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY; 

// --- TIPE DATA ---
interface OrderItem {
  _id: string;
  productId: string;
  nama: string;
  image: string;
  harga: number;
  quantity: number;
}

type OrderStatus = 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Tiba' | 'Selesai' | 'Dibatalkan';

interface Order {
  _id: string;
  createdAt: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
}

// === KOMPONEN PELACAK STATUS ===
const OrderStatusTracker = ({ status }: { status: OrderStatus }) => {
  const steps = ['Diproses', 'Dikirim', 'Tiba', 'Selesai'];
  const statusMap: Record<OrderStatus, number> = {
    'Menunggu Pembayaran': 0, 'Diproses': 1, 'Dikirim': 2, 'Tiba': 3, 'Selesai': 4, 'Dibatalkan': -1,
  };
  const currentStepIndex = statusMap[status];

  // Tampilan Khusus jika Dibatalkan
  if (currentStepIndex === -1) {
    return (
      <div className="text-center py-4">
        <div className="mb-3 text-danger">
           <AlertTriangle size={48} />
        </div>
        <h5 className="text-danger fw-bold">Pesanan Dibatalkan</h5>
        <p className="text-secondary small">Pesanan ini telah dibatalkan dan tidak dapat dilanjutkan.</p>
      </div>
    );
  }
  
  if (currentStepIndex === 0) return <p className="text-warning text-center fw-bold">Menunggu pembayaran Anda.</p>;
  
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
  
  // --- STATE MODAL BATAL ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // --- FUNGSI: Ambil data ---
  const fetchOrders = async (currentUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/orders?userId=${currentUserId}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         throw new Error("Gagal terhubung ke server (Respons bukan JSON).");
      }
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

  // --- EFEK: Load User & Midtrans ---
  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo"); 
    if (userInfoString) {
      setUserId(JSON.parse(userInfoString).userId); 
    } else {
      router.push('/login'); return;
    }

    if (!MIDTRANS_CLIENT_KEY) return;
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', MIDTRANS_CLIENT_KEY);
    script.async = true;
    document.body.appendChild(script);
    return () => { if(document.body.contains(script)) document.body.removeChild(script); };
  }, [router]);

  // --- EFEK: Fetch Data ---
  useEffect(() => {
    if (userId) {
      const successNotif = localStorage.getItem("showSuccessNotification");
      if (successNotif) {
        setLoading(true);
        setTimeout(() => {
            fetchOrders(userId);
            localStorage.removeItem("showSuccessNotification");
            setNotification(successNotif); 
        }, 1000);
      } else {
        fetchOrders(userId); 
      }
    }
  }, [userId]); 

  // --- FUNGSI AKSI ---
  const confirmCancel = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderToCancel, newStatus: 'Dibatalkan' })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      setNotification("Pesanan berhasil dibatalkan.");
      if (userId) fetchOrders(userId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleBayarUlang = async (orderId: string, totalAmount: number) => {
    if (isRePaying || !userId || !window.snap) return;
    setIsRePaying(true);
    try {
        const response = await fetch(`${API_URL}/api/orders/create`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, userId })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        window.snap.pay(data.data.token, {
            onSuccess: () => { localStorage.setItem("showSuccessNotification", "✅ Pembayaran berhasil!"); window.location.reload(); },
            onPending: () => { localStorage.setItem("showSuccessNotification", "⏳ Menunggu pembayaran."); window.location.reload(); },
            onError: () => { setNotification("❌ Pembayaran gagal."); setIsRePaying(false); },
            onClose: () => setIsRePaying(false)
        });
    } catch (err: any) {
        setNotification(`Error: ${err.message}`); setIsRePaying(false);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
        const response = await fetch(`${API_URL}/api/orders/status`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, newStatus: 'Selesai' })
        });
        const data = await response.json();
        if (data.success) { setNotification("Pesanan selesai!"); if(userId) fetchOrders(userId); }
    } catch (e) {}
  };

  // --- HELPER ---
  const handleShowStatus = (order: Order) => { setSelectedOrder(order); setShowStatusModal(true); };
  const handleCloseStatus = () => setShowStatusModal(false);
  const filteredOrders = activeTab === 'Semua' ? orders : orders.filter(order => order.status === activeTab);
  
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
    return new Date(tanggalISO).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-100 py-5 d-flex flex-column flex-grow-1" style={{ backgroundColor: '#E5E9F0', minHeight: '100%' }}>
      <Container>
        <h2 className="fw-bold text-dark mb-4">Daftar Transaksi</h2>

        {notification && <Alert variant="success" onClose={() => setNotification(null)} dismissible className="fw-bold">{notification}</Alert>}

        <Nav variant="pills" className="mb-4 overflow-auto flex-nowrap pb-2" activeKey={activeTab}>
          {['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Selesai', 'Dibatalkan'].map((tab) => (
            <Nav.Item key={tab}>
              <Nav.Link eventKey={tab} onClick={() => setActiveTab(tab)} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>{tab}</Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

        {loading && <div className="text-center p-5"><Spinner animation="border" /><p className="mt-2 text-muted">Memuat...</p></div>}
        {!loading && error && <Alert variant="danger">{error}</Alert>}

        <div className="d-flex flex-column gap-4">
          {!loading && !error && filteredOrders.length > 0 && filteredOrders.map((order) => {
              // LOGIKA TOMBOL
              const canCancel = order.status === 'Menunggu Pembayaran' || order.status === 'Diproses';
              const canPay = order.status === 'Menunggu Pembayaran';
              const canComplete = order.status === 'Tiba';
              
              // Logic Tracker: Munculkan "Cek Status" di status ini
              const showTrackerButton = ['Diproses', 'Dikirim', 'Tiba'].includes(order.status);

              const shortOrderId = `...${order._id.slice(-6)}`;

              return (
                <Card key={order._id} className="border-0 rounded-3 overflow-hidden card-transaction bg-white">
                  <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-dark small">{formatTanggal(order.createdAt)}</span>
                        <span className="text-secondary small d-none d-sm-inline">INV/.../{shortOrderId}</span>
                      </div>
                      <Badge bg={getStatusBadge(order.status)} className="px-3 py-2 rounded-pill fw-normal">{order.status}</Badge>
                    </div>
                  </Card.Header>

                  <Card.Body className="p-4">
                    {order.items.map((item) => (
                      <Row key={item._id} className="mb-3 align-items-center">
                        <Col xs="auto"><Image src={item.image} alt={item.nama} rounded style={{ width: '70px', height: '70px', objectFit: 'cover', border: '1px solid #eee' }} /></Col>
                        <Col>
                          <h6 className="fw-bold text-dark mb-1">{item.nama}</h6>
                          <p className="text-secondary small mb-0">{item.quantity} x {item.harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</p>
                        </Col>
                      </Row>
                    ))}
                  </Card.Body>

                  <Card.Footer className="bg-white border-0 pt-0 pb-4 px-4">
                    <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
                      <div>
                        <span className="text-secondary small d-block">Total Belanja</span>
                        <span className="fw-bold text-dark fs-5">{order.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                      </div>
                      
                      <div className="d-flex gap-2">
                        {/* Tombol Bayar */}
                        {canPay && (
                          <Button variant="primary" size="sm" className="fw-bold" onClick={() => handleBayarUlang(order._id, order.totalAmount)} disabled={isRePaying}>
                            {isRePaying ? <Spinner size="sm" animation="border"/> : "Bayar Sekarang"}
                          </Button>
                        )}
                        
                        {/* Tombol Batal */}
                        {canCancel && (
                            <Button variant="outline-danger" size="sm" className="fw-bold" onClick={() => confirmCancel(order._id)}>
                                Batalkan
                            </Button>
                        )}

                        {/* Tombol Selesai */}
                        {canComplete && (
                            <Button variant="success" size="sm" className="fw-bold text-white" onClick={() => handleCompleteOrder(order._id)}>
                                Pesanan Diterima
                            </Button>
                        )}
                        
                        {/* Tombol Cek Status (Untuk yang berjalan) */}
                        {showTrackerButton && (
                          <Button variant="outline-primary" size="sm" className="fw-bold" onClick={() => handleShowStatus(order)}>Cek Status</Button>
                        )}

                        {/* Tombol Beli Lagi (Selesai) */}
                        {order.status === 'Selesai' && (
                            <Link href="/produk" passHref legacyBehavior><Button variant="outline-primary" size="sm" className="fw-bold">Beli Lagi</Button></Link>
                        )}
                        
                        {/* --- TAMBAHAN: Tombol Detail untuk "Dibatalkan" --- */}
                        {order.status === 'Dibatalkan' && (
                            <Button variant="outline-secondary" size="sm" className="fw-bold" onClick={() => handleShowStatus(order)}>
                                Lihat Detail
                            </Button>
                        )}

                      </div>
                    </div>
                  </Card.Footer>
                </Card>
              );
            })}
        </div>
      </Container>

      {/* Modal Batal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered contentClassName="border-0 rounded-4 shadow" backdrop="static">
        <Modal.Body className="text-center p-4 p-md-5">
          <div className="mb-4 d-flex justify-content-center">
            <div className="d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', backgroundColor: '#FEE2E2', borderRadius: '50%' }}>
              <AlertTriangle size={40} color="#DC2626" /> 
            </div>
          </div>
          <h4 className="fw-bold text-dark mb-2">Batalkan Pesanan?</h4>
          <p className="text-secondary mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
            Apakah Anda yakin ingin membatalkan pesanan ini? <br/> Tindakan ini tidak dapat dikembalikan.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Button variant="light" className="rounded-pill fw-bold px-4 flex-fill py-2" style={{ backgroundColor: '#F3F4F6', border: 'none', color: '#374151' }} onClick={() => setShowCancelModal(false)}>Batal</Button>
            <Button variant="danger" className="rounded-pill fw-bold px-4 flex-fill py-2" style={{ backgroundColor: '#DC2626', border: 'none' }} onClick={handleCancelOrder} disabled={isCancelling}>
              {isCancelling ? <Spinner size="sm" animation="border"/> : 'Ya, Batalkan'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Modal Status Tracker (Juga dipakai untuk Detail Dibatalkan) */}
      <Modal show={showStatusModal} onHide={handleCloseStatus} centered>
        <Modal.Header closeButton><Modal.Title className="fw-bold fs-5">Status Pesanan</Modal.Title></Modal.Header>
        <Modal.Body className="p-4">
          {selectedOrder && (
            <>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">...{selectedOrder._id.slice(-6)}</span>
                <span className="text-secondary small">{formatTanggal(selectedOrder.createdAt)}</span>
              </div>
              <h5 className="fw-bold text-dark mb-3">{selectedOrder.status}</h5>
              <OrderStatusTracker status={selectedOrder.status} />
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}