// app/admin/pesanan/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, Spinner, Alert, Badge, Row, Col, Image, Button, Modal, Form } from 'react-bootstrap';
import { Loader2 } from "lucide-react";

// Tipe data yang SAMA persis dengan Schema Order
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

interface AdminOrder {
  _id: string;
  // User sekarang adalah objek yang di-populate
  user: {
    _id: string;
    username: string;
    email: string;
  };
  items: OrderItem[];
  shippingAddress: string;
  paymentMethod: 'COD' | 'QRIS';
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

// Hapus 'initialOrders'

export default function PesananPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("Semua");
  
  // State untuk Modal "Ubah Status" (ACC)
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Diproses');
  const [isUpdating, setIsUpdating] = useState(false);

  // Ambil data saat halaman dimuat
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Panggil API BARU untuk admin
      const response = await fetch('http://localhost:5000/api/orders/all');
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

  // Logika filter (sekarang dinamis)
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "Semua") return true;
    return order.status === filterStatus;
  });

  // Helper untuk warna status
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

  // Helper untuk format tanggal
  const formatTanggal = (tanggalISO: string) => {
    return new Date(tanggalISO).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // === FUNGSI MODAL UNTUK ACC / UBAH STATUS ===
  const handleShowStatusModal = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status); // Set status awal ke status order saat ini
    setShowStatusModal(true);
  };
  
  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setIsUpdating(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    setIsUpdating(true);
    try {
      // Panggil API BARU untuk update status
      const response = await fetch('http://localhost:5000/api/orders/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          newStatus: newStatus
        })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal update status');
      }

      // Sukses! Update data di state 'orders' secara manual
      setOrders(currentOrders =>
        currentOrders.map(order =>
          order._id === data.data._id ? data.data : order
        )
      );
      
      handleCloseStatusModal(); // Tutup modal

    } catch (err: any) {
      alert("Error: " + err.message); // Tampilkan error jika gagal
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Header & Filter */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold text-dark mb-0">Manajemen Pesanan</h5>
        
        <div className="d-flex align-items-center gap-2">
          <label className="fw-bold text-dark small mb-0">Filter:</label>
          <select 
            className="form-select form-select-sm rounded-3 border-0 shadow-sm fw-medium" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            disabled={loading}
          >
            <option value="Semua">Semua Status</option>
            {/* Loop dari array allStatus */}
            {allStatus.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- TAMPILAN LOADING / ERROR --- */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Memuat data pesanan...</p>
        </div>
      )}
      {error && (
        <Alert variant="danger">Gagal memuat data: {error}</Alert>
      )}

      {/* --- DAFTAR PESANAN (DESAIN CARD BARU) --- */}
      <div className="d-flex flex-column gap-4">
        {!loading && !error && filteredOrders.length > 0 && (
          filteredOrders.map((order) => {
            
            // Tombol "ACC" hanya muncul jika status "Menunggu Pembayaran"
            const showAccButton = order.status === 'Menunggu Pembayaran';
            
            return (
              <Card key={order._id} className="border-0 rounded-3 overflow-hidden card-transaction bg-white shadow-sm">
                
                <Card.Header className="bg-white border-bottom py-3">
                  <Row className="align-items-center">
                    <Col md={7}>
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-dark small">{formatTanggal(order.createdAt)}</span>
                        <span className="text-secondary small d-none d-sm-inline">ID: ...{order._id.slice(-6)}</span>
                      </div>
                    </Col>
                    <Col md={5} className="d-flex justify-content-start justify-content-md-end align-items-center gap-2 mt-2 mt-md-0">
                      <Badge bg="secondary" pill>
                        {order.user.username}
                      </Badge>
                      <Badge bg={getStatusBadge(order.status)} pill>
                        {order.status}
                      </Badge>
                      <Badge bg={order.paymentMethod === 'COD' ? 'dark' : 'primary'} pill>
                        {order.paymentMethod}
                      </Badge>
                    </Col>
                  </Row>
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

                <Card.Footer className="bg-light border-0 pt-3 pb-3 px-4">
                  <div className="d-flex justify-content-between align-items-end">
                    <div>
                      <span className="text-secondary small d-block">Total Belanja</span>
                      <span className="fw-bold text-dark fs-5">
                        {order.totalAmount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    
                    <div className="d-flex gap-2">
                      {/* === TOMBOL KONFIRMASI (ACC) === */}
                      {showAccButton && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="fw-bold"
                          onClick={() => handleShowStatusModal(order)}
                        >
                          Konfirmasi Pembayaran
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="fw-bold"
                        onClick={() => handleShowStatusModal(order)}
                      >
                        Ubah Status
                      </Button>
                    </div>
                  </div>
                </Card.Footer>
              </Card>
            );
          })
        )}
        
        {/* Tampilan Jika Kosong */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="text-center py-5 text-muted">
            Tidak ada pesanan dengan filter "{filterStatus}".
          </div>
        )}
      </div>

      {/* === MODAL UNTUK UBAH STATUS (ACC) === */}
      <Modal show={showStatusModal} onHide={handleCloseStatusModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Ubah Status Pesanan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small">
            Mengubah status untuk Order ID: <br/>
            <strong className="text-dark">...{selectedOrder?._id.slice(-12)}</strong>
          </p>
          <Form.Group controlId="formStatusSelect">
            <Form.Label className="fw-bold">Status Baru:</Form.Label>
            <Form.Select 
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              disabled={isUpdating}
            >
              {allStatus.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Form.Select>
          </Form.Group>
          {selectedOrder?.status === 'Menunggu Pembayaran' && newStatus === 'Diproses' && (
            <Alert variant="success" className="mt-3 small py-2">
              Ini akan meng-ACC pembayaran dan memindahkan pesanan ke antrian "Diproses".
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseStatusModal} disabled={isUpdating}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleUpdateStatus} disabled={isUpdating} className="fw-bold">
            {isUpdating ? (
              <>
                <Loader2 size={16} className="animate-spin me-2" /> Menyimpan...
              </>
            ) : "Simpan Status"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}