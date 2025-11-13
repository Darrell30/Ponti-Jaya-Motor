// app/pembelian/page.tsx
'use client';

import { useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Image, Modal } from 'react-bootstrap';
import Link from 'next/link';

// --- TIPE DATA (MOCK) ---
interface OrderItem {
  name: string;
  image: string;
  price: number;
  quantity: number;
}

type OrderStatus = 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Tiba' | 'Selesai' | 'Dibatalkan';

interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
}

// --- DATA DUMMY (MOCK) ---
const mockOrders: Order[] = [
  {
    id: 'INV/20251112/MPL/001',
    date: '12 Nov 2025',
    status: 'Menunggu Pembayaran',
    total: 160000,
    items: [
      { name: 'Kampas Rem', image: '/images/produk/kampas rem.jpg', price: 50000, quantity: 2 },
      { name: 'Jasa ganti oli', image: '/images/jasa/servis-rutin.jpg', price: 60000, quantity: 1 },
    ]
  },
  {
    id: 'INV/20251111/MPL/005',
    date: '11 Nov 2025',
    status: 'Diproses',
    total: 50000,
    items: [
      { name: 'Master Rem', image: '/images/produk/master rem.jpg', price: 50000, quantity: 1 },
    ]
  },
  {
    id: 'INV/20251110/MPL/002',
    date: '10 Nov 2025',
    status: 'Dikirim', 
    total: 75000,
    items: [
      { name: 'Tensioner', image: '/images/produk/veleg.jpg', price: 75000, quantity: 1 },
    ]
  },
  {
    id: 'INV/20251101/MPL/003',
    date: '01 Nov 2025',
    status: 'Selesai',
    total: 50000,
    items: [
      { name: 'Master Rem', image: '/images/produk/master rem.jpg', price: 50000, quantity: 1 },
    ]
  },
  {
    id: 'INV/20251028/MPL/004',
    date: '28 Okt 2025',
    status: 'Dibatalkan',
    total: 100000,
    items: [
      { name: 'Klahar Roda', image: '/images/produk/klahar roda.jpg', price: 50000, quantity: 2 },
    ]
  }
];

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

        if (stepIndex < currentStepIndex) {
          stepClass = 'completed';
        } else if (stepIndex === currentStepIndex) {
          stepClass = 'current';
        }

        let iconClass = 'bi bi-box-seam';
        if (label === 'Dikirim') iconClass = 'bi bi-truck';
        if (label === 'Tiba') iconClass = 'bi bi-hand-thumbs-up';
        if (label === 'Selesai') iconClass = 'bi bi-star';

        return (
          <div key={label} className={`stepper-item ${stepClass}`}>
            <div className="stepper-icon">
              <i className={iconClass}></i>
            </div>
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
  const [activeTab, setActiveTab] = useState('Semua');

  // State untuk Modal Pelacak Status
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fungsi untuk membuka modal
  const handleShowStatus = (order: Order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };
  // Fungsi untuk menutup modal
  const handleCloseStatus = () => setShowStatusModal(false);

  const filteredOrders = activeTab === 'Semua' 
    ? mockOrders 
    : mockOrders.filter(order => order.status === activeTab);

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

  return (
    <div 
      className="w-100 py-5 d-flex flex-column flex-grow-1" 
      style={{ backgroundColor: '#E5E9F0', minHeight: '100%' }}
    >
      <Container>
        <h2 className="fw-bold text-dark mb-4">Daftar Transaksi</h2>

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

        {/* Daftar Pesanan */}
        <div className="d-flex flex-column gap-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              // Tentukan apakah tombol "Lacak" harus muncul
              const showTrackerButton = order.status === 'Diproses' || order.status === 'Dikirim' || order.status === 'Tiba';
              
              return (
                <Card key={order.id} className="border-0 rounded-3 overflow-hidden card-transaction bg-white">
                  
                  <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-dark small">{order.date}</span>
                        <span className="text-secondary small d-none d-sm-inline">{order.id}</span>
                      </div>
                      <Badge bg={getStatusBadge(order.status)} className="px-3 py-2 rounded-pill fw-normal">
                        {order.status}
                      </Badge>
                    </div>
                  </Card.Header>

                  <Card.Body className="p-4">
                    {order.items.map((item, idx) => (
                      <Row key={idx} className="mb-3 align-items-center">
                        <Col xs="auto">
                          {/* Gunakan gambar dummy jika backend tidak ada */}
                          <Image src={item.image} alt={item.name} rounded style={{ width: '70px', height: '70px', objectFit: 'cover', border: '1px solid #eee' }} />
                        </Col>
                        <Col>
                          <h6 className="fw-bold text-dark mb-1">{item.name}</h6>
                          <p className="text-secondary small mb-0">
                            {item.quantity} x {item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
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
                          {order.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      
                      <div className="d-flex gap-2">
                        
                        {order.status === 'Menunggu Pembayaran' && (
                          <Button variant="primary" size="sm" className="fw-bold">Bayar Sekarang</Button>
                        )}
                        
                        {/* Tombol Lacak (Memicu Modal) */}
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
                        
                        {!showTrackerButton && (
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
          ) : (
            // Tampilan Jika Kosong
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-receipt text-secondary" style={{ fontSize: '4rem' }}></i>
              </div>
              <h5 className="fw-bold text-dark">Belum ada pesanan</h5>
              <p className="text-secondary">Yuk, mulai belanja sparepart atau booking jasa servis sekarang!</p>
              <Link href="/produk" passHref legacyBehavior>
                <Button variant="primary" className="fw-bold px-4">Mulai Belanja</Button>
              </Link>
            </div>
          )}
        </div>
      </Container>

      {/* ================================== */}
      {/* === MODAL: LACAK STATUS === */}
      {/* ================================== */}
      <Modal show={showStatusModal} onHide={handleCloseStatus} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Status Pesanan</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedOrder && (
            <>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">{selectedOrder.id}</span>
                <span className="text-secondary small">{selectedOrder.date}</span>
              </div>
              <h5 className="fw-bold text-dark mb-3">
                {selectedOrder.status}
              </h5>
              {/* Memanggil Komponen Stepper */}
              <OrderStatusTracker status={selectedOrder.status} />
            </>
          )}
        </Modal.Body>
      </Modal>

    </div>
  );
}