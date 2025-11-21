"use client";

import { useState, useEffect } from "react";
import { Card, Spinner, Alert, Badge, Row, Col, Image, Button, Modal, Form, Nav, InputGroup } from 'react-bootstrap';
import { Search, Edit3 } from "lucide-react";

interface OrderItem {
  _id: string;
  productId: string;
  nama: string;
  image: string;
  harga: number;
  quantity: number;
}

type OrderStatus = 'Menunggu Pembayaran' | 'Diproses' | 'Dikirim' | 'Tiba' | 'Selesai' | 'Dibatalkan';

const allStatus: OrderStatus[] = ['Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Selesai', 'Dibatalkan'];

const filterTabs: string[] = ['Semua', 'Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Dibatalkan'];

const adminSelectableStatus: OrderStatus[] = ['Menunggu Pembayaran', 'Diproses', 'Dikirim', 'Tiba', 'Dibatalkan'];

interface AdminOrder {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Diproses');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/all`);
      if (!response.ok) throw new Error('Gagal mengambil data pesanan');
      
      const data = await response.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {

    const statusMatch = filterStatus === "Semua" ? true : order.status === filterStatus;
    
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
        order._id.toLowerCase().includes(searchLower) || 
        (order.user?.username || '').toLowerCase().includes(searchLower);

    return statusMatch && searchMatch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu Pembayaran': return 'warning';
      case 'Diproses': return 'info';
      case 'Dikirim': return 'primary';
      case 'Tiba': return 'success'; 
      case 'Selesai': return 'success';
      case 'Dibatalkan': return 'danger';
      default: return 'secondary';
    }
  };

  const formatTanggal = (tanggalISO: string) => {
    return new Date(tanggalISO).toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleOpenModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status); 
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/orders/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          newStatus: newStatus
        })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Gagal update status');

      setOrders(currentOrders =>
        currentOrders.map(order =>
          order._id === selectedOrder._id ? { ...order, status: newStatus } : order
        )
      );
      
      setShowStatusModal(false);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4" style={{ backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark mb-0">Kelola Pesanan</h4>
        <Button variant="outline-primary" size="sm" onClick={fetchOrders}>
            Refresh Data
        </Button>
      </div>

      {/* --- SEARCH & FILTER BAR (LAYOUT DIPERBAIKI) --- */}
      <Card className="border-0 shadow-sm rounded-4 mb-4">
        <Card.Body className="p-4">
            <div className="d-flex flex-column gap-3">
                {/* 1. Search Bar (Full Width) */}
                <div className="w-100">
                    <InputGroup className="shadow-sm rounded-3 overflow-hidden border">
                        <InputGroup.Text className="bg-white border-0 px-3">
                            <Search size={18} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control 
                            type="text" 
                            placeholder="Cari ID Pesanan atau Nama Pembeli..." 
                            className="border-0 py-2 shadow-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </div>

                {/* 2. Filter Tabs (Dibawah Search) */}
                <Nav 
                    variant="pills" 
                    className="gap-2 overflow-auto flex-nowrap pb-1" // flex-nowrap agar bisa discroll horizontal di HP
                    activeKey={filterStatus}
                >
                    {filterTabs.map(tab => (
                        <Nav.Item key={tab}>
                            <Nav.Link 
                                eventKey={tab} 
                                onClick={() => setFilterStatus(tab)}
                                style={{cursor:'pointer', whiteSpace:'nowrap'}}
                                className="rounded-pill px-3 py-2 small fw-bold"
                            >
                                {tab}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>
            </div>
        </Card.Body>
      </Card>

      {/* --- LIST PESANAN --- */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Memuat pesanan...</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredOrders.length === 0 ? (
             <Alert variant="light" className="text-center py-5 shadow-sm border-0 rounded-4">
                <div className="text-muted mb-2">Tidak ada pesanan ditemukan.</div>
                <small>Coba ubah kata kunci pencarian atau filter status.</small>
             </Alert>
          ) : (
             filteredOrders.map((order) => (
                <Card key={order._id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                  <Card.Header className="bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <Badge bg="light" text="dark" className="border">#{order._id.slice(-6).toUpperCase()}</Badge>
                            <span className="text-muted small ms-2">{formatTanggal(order.createdAt)}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-dark small">{order.user?.username || 'Guest'}</span>
                            <Badge bg={getStatusBadge(order.status)} className="px-3 py-2 rounded-pill">
                                {order.status}
                            </Badge>
                        </div>
                    </div>
                  </Card.Header>

                  <Card.Body>
                    <Row>
                        {/* Kolom Kiri: Item */}
                        <Col md={7} className="border-end-md">
                            <h6 className="fw-bold text-muted mb-3 small">Detail Barang</h6>
                            {order.items.map((item) => (
                                <div key={item._id} className="d-flex align-items-center gap-3 mb-3">
                                    <Image 
                                        src={item.image} 
                                        rounded 
                                        style={{ width: '50px', height: '50px', objectFit: 'cover', border:'1px solid #eee' }} 
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

                        {/* Kolom Kanan: Info Pengiriman */}
                        <Col md={5} className="ps-md-4 mt-3 mt-md-0">
                            <h6 className="fw-bold text-muted mb-3 small">Info Pengiriman</h6>
                            <div className="mb-3">
                                <strong className="d-block text-dark">{order.user?.username}</strong>
                                <span className="text-muted small">{order.user?.email}</span>
                                <p className="text-secondary small mt-1 mb-0" style={{lineHeight: '1.4'}}>
                                    <i className="bi bi-geo-alt me-1"></i> {order.shippingAddress}
                                </p>
                            </div>
                            
                            <div className="p-3 bg-light rounded-3 border">
                                <small className="text-muted d-block">Total Pembayaran</small>
                                <span className="fw-bold text-primary fs-4">
                                    Rp {order.totalAmount.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </Col>
                    </Row>
                  </Card.Body>

                  <Card.Footer className="bg-white border-top p-3 text-end">
                      {order.status !== 'Selesai' && order.status !== 'Dibatalkan' ? (
                          <Button 
                            variant="primary" 
                            className="fw-bold rounded-pill px-4"
                            onClick={() => handleOpenModal(order)}
                          >
                              <Edit3 size={16} className="me-2" /> Ubah Status
                          </Button>
                      ) : (
                          <span className="text-muted small fst-italic">Status: {order.status}</span>
                      )}
                  </Card.Footer>
                </Card>
             ))
          )}
        </div>
      )}

      {/* === MODAL UBAH STATUS === */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Update Status Pesanan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="fw-bold">Pilih Status Baru:</Form.Label>
            <Form.Select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="py-2"
            >
                {adminSelectableStatus.map((status) => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </Form.Select>
            <Form.Text className="text-muted d-block mt-2 small">
                Catatan: Status "Selesai" hanya dapat dikonfirmasi oleh pembeli.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowStatusModal(false)}>Batal</Button>
          <Button 
            variant="primary" 
            className="fw-bold px-4"
            onClick={handleUpdateStatus} 
            disabled={isUpdating}
          >
            {isUpdating ? <Spinner size="sm" animation="border" /> : "Simpan Perubahan"}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}