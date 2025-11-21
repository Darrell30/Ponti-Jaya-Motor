'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Nav, Row, Col, Image, Spinner, Alert, Form } from 'react-bootstrap';
import { Package, Truck, MapPin, XCircle, CheckCircle, Clock, Search } from 'lucide-react';

// Setup API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// --- TIPE DATA ---
interface OrderItem {
  _id: string;
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
  user: {
    username: string;
    email: string;
  };
  shippingAddress: string;
}

export default function AdminPesananPage() {
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Filter & Tab
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // --- 1. FETCH DATA PESANAN ---
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/all`); // Endpoint khusus admin (ambil semua)
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Gagal ambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 2. UPDATE STATUS OLEH ADMIN ---
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if(!confirm(`Ubah status pesanan ini menjadi "${newStatus}"?`)) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_URL}/api/orders/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus })
      });
      const data = await response.json();
      
      if (data.success) {
        fetchOrders(); // Refresh data
      } else {
        alert("Gagal update: " + data.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- HELPER FORMAT ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Pembayaran': return 'warning';
      case 'Diproses': return 'info';
      case 'Dikirim': return 'primary';
      case 'Tiba': return 'success'; // Tiba warnanya hijau (tugas admin selesai)
      case 'Selesai': return 'success';
      case 'Dibatalkan': return 'danger';
      default: return 'secondary';
    }
  };

  // --- FILTERING LOGIC ---
  // HAPUS 'Selesai' DARI ARRAY TABS
  const TABS = ['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Dibatalkan'];

  const filteredOrders = orders.filter(order => {
    // 1. Filter Tab
    const tabMatch = activeTab === 'Semua' ? true : order.status === activeTab;
    
    // 2. Filter Search (ID Order atau Nama User)
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
        order._id.toLowerCase().includes(searchLower) || 
        (order.user?.username || '').toLowerCase().includes(searchLower);

    return tabMatch && searchMatch;
  });

  return (
    <div className="p-4" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark">Kelola Pesanan</h2>
        <Button variant="outline-primary" size="sm" onClick={fetchOrders}>
            <i className="bi bi-arrow-clockwise me-2"></i>Refresh
        </Button>
      </div>

      {/* --- SEARCH & FILTER --- */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-2">
            <div className="d-flex flex-column flex-md-row gap-3 align-items-center px-2">
                <div className="position-relative flex-grow-1 w-100">
                    <Search size={18} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                    <Form.Control 
                        type="text" 
                        placeholder="Cari ID Pesanan atau Nama Pembeli..." 
                        className="ps-5 border-0 bg-light rounded-pill"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            <Nav variant="pills" className="mt-3 px-2 pb-2 gap-2 overflow-auto flex-nowrap" activeKey={activeTab}>
                {TABS.map(tab => (
                    <Nav.Item key={tab}>
                        <Nav.Link 
                            eventKey={tab} 
                            onClick={() => setActiveTab(tab)}
                            className="rounded-pill fw-medium px-4"
                            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            {tab}
                        </Nav.Link>
                    </Nav.Item>
                ))}
            </Nav>
        </Card.Body>
      </Card>

      {/* --- DAFTAR PESANAN --- */}
      {loading ? (
          <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Mengambil data pesanan...</p>
          </div>
      ) : (
          <div className="d-flex flex-column gap-3">
              {filteredOrders.length === 0 ? (
                  <Alert variant="light" className="text-center py-5 border-0 shadow-sm rounded-4">
                      <div className="mb-3 text-muted"><Package size={48} /></div>
                      <h5 className="fw-bold">Tidak ada pesanan ditemukan</h5>
                      <p className="text-muted">Belum ada pesanan pada kategori "{activeTab}"</p>
                  </Alert>
              ) : (
                  filteredOrders.map(order => (
                      <Card key={order._id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                          <Card.Header className="bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
                              <div className="d-flex align-items-center gap-2">
                                  <Badge bg="light" text="dark" className="border px-3 py-2 rounded-pill">
                                      #{order._id.slice(-6).toUpperCase()}
                                  </Badge>
                                  <span className="text-muted small border-start ps-2">
                                      {new Date(order.createdAt).toLocaleDateString('id-ID', { 
                                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' 
                                      })}
                                  </span>
                              </div>
                              <Badge bg={getStatusBadge(order.status)} className="px-3 py-2 rounded-pill">
                                  {order.status}
                              </Badge>
                          </Card.Header>
                          
                          <Card.Body>
                              <Row>
                                  {/* Info Produk */}
                                  <Col md={7}>
                                      <h6 className="fw-bold text-muted mb-3">Detail Barang</h6>
                                      {order.items.map((item, idx) => (
                                          <div key={idx} className="d-flex align-items-center gap-3 mb-3">
                                              <Image 
                                                  src={item.image} 
                                                  rounded 
                                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                                              />
                                              <div>
                                                  <div className="fw-bold text-dark">{item.nama}</div>
                                                  <div className="text-muted small">
                                                      {item.quantity} x Rp {item.harga.toLocaleString('id-ID')}
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </Col>

                                  {/* Info Pembeli & Pengiriman */}
                                  <Col md={5} className="border-start-md ps-md-4">
                                      <h6 className="fw-bold text-muted mb-3">Info Pengiriman</h6>
                                      <div className="mb-2">
                                          <strong className="d-block text-dark">{order.user?.username || 'Guest'}</strong>
                                          <span className="text-muted small">{order.user?.email}</span>
                                      </div>
                                      <div className="d-flex gap-2 mb-3">
                                          <MapPin size={16} className="mt-1 text-primary flex-shrink-0" />
                                          <p className="text-secondary small mb-0" style={{ lineHeight: '1.4' }}>
                                              {order.shippingAddress}
                                          </p>
                                      </div>
                                      <div className="alert alert-light border rounded-3 py-2 px-3">
                                          <small className="text-muted">Total Pembayaran</small>
                                          <div className="fw-bold text-primary fs-5">
                                              Rp {order.totalAmount.toLocaleString('id-ID')}
                                          </div>
                                      </div>
                                  </Col>
                              </Row>
                          </Card.Body>

                          {/* Footer Aksi Admin */}
                          <Card.Footer className="bg-white border-top p-3 d-flex justify-content-end gap-2">
                              
                              {/* LOGIKA TOMBOL ADMIN */}
                              
                              {/* 1. Jika Menunggu Pembayaran (Jarang dipakai jika auto midtrans, tapi disediakan) */}
                              {order.status === 'Menunggu Pembayaran' && (
                                  <Button variant="outline-danger" size="sm" className="rounded-pill"
                                      onClick={() => handleUpdateStatus(order._id, 'Dibatalkan')}
                                      disabled={isUpdating}
                                  >
                                      <XCircle size={16} className="me-2" /> Batalkan
                                  </Button>
                              )}

                              {/* 2. Jika Diproses -> Kirim */}
                              {order.status === 'Diproses' && (
                                  <Button variant="primary" size="sm" className="rounded-pill fw-bold px-4"
                                      onClick={() => handleUpdateStatus(order._id, 'Dikirim')}
                                      disabled={isUpdating}
                                  >
                                      <Truck size={16} className="me-2" /> Kirim Pesanan
                                  </Button>
                              )}

                              {/* 3. Jika Dikirim -> Tiba */}
                              {order.status === 'Dikirim' && (
                                  <Button variant="success" size="sm" className="rounded-pill fw-bold px-4"
                                      onClick={() => handleUpdateStatus(order._id, 'Tiba')}
                                      disabled={isUpdating}
                                  >
                                      <MapPin size={16} className="me-2" /> Pesanan Tiba di Lokasi
                                  </Button>
                              )}

                              {/* 4. Jika Tiba (Menunggu User Klik Selesai) */}
                              {order.status === 'Tiba' && (
                                  <span className="text-muted small d-flex align-items-center">
                                      <Clock size={16} className="me-2" /> Menunggu konfirmasi user
                                  </span>
                              )}

                              {/* 5. Jika Selesai / Batal -> Tidak ada aksi */}
                              {(order.status === 'Selesai' || order.status === 'Dibatalkan') && (
                                  <span className="text-muted small fst-italic">Tidak ada aksi diperlukan</span>
                              )}

                          </Card.Footer>
                      </Card>
                  ))
              )}
          </div>
      )}
    </div>
  );
}