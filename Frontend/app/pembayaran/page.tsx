// app/pembayaran/page.tsx
'use client';

// Import hooks dan komponen
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Image, Modal, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Tipe data item keranjang
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// === DATA DUMMY (STATIS) ===
// Kita gunakan data yang sama persis seperti di keranjang
const initialCartItems: CartItem[] = [
  { id: '1', name: 'Kampas rem', price: 50000, image: '/images/produk/kampas rem.jpg', quantity: 1 },
  { id: '2', name: 'Jasa ganti oli + konsultasi', price: 60000, image: '/images/jasa/servis-rutin.jpg', quantity: 1 },
  { id: '3', name: 'Klahar roda', price: 10000, image: '/images/produk/klahar roda.jpg', quantity: 2 },
];
// =============================

export default function PembayaranPage() {
  const router = useRouter();
  
  // State Data (Dummy)
  const [cartItems] = useState(initialCartItems);
  
  // State Alamat & Modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("Jl. Kamal Raya Outer Ring Road, Cengkareng, Jakarta Barat, 11730");
  const [tempAddress, setTempAddress] = useState(address);

  // State Metode Pembayaran
  const [paymentMethod, setPaymentMethod] = useState(''); // 'qris' or 'bank'
  const [error, setError] = useState(''); // Error jika belum pilih metode bayar

  // Cek login saat halaman dimuat
  useEffect(() => {
    if (localStorage.getItem("isUserLoggedIn") !== "true") {
      router.push('/login'); // Paksa login jika belum
    }
  }, [router]);

  // === HANDLERS ALAMAT ===
  const handleOpenAddressModal = () => {
    setTempAddress(address);
    setShowAddressModal(true);
  };
  const handleSaveAddress = () => {
    setAddress(tempAddress);
    setShowAddressModal(false);
  };

  // === KALKULASI TOTAL ===
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCost = 15000; // Biaya ongkir (dummy)
  const grandTotal = subtotal + shippingCost;

  // === HANDLER TOMBOL BAYAR ===
  const handleBayar = () => {
    if (!paymentMethod) {
      setError("Harap pilih metode pembayaran terlebih dahulu.");
    } else {
      setError("");
      // Di sini Anda akan melanjutkan ke proses pembayaran
      alert(`Siap membayar Rp${grandTotal} via ${paymentMethod.toUpperCase()}!`);
    }
  };

  return (
    // Latar belakang abu-abu
    <div className="w-100 py-5" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
      <Container>
        <h1 className="fw-bold text-dark mb-4">Checkout Pembayaran</h1>
        
        <Row className="g-custom-20">
          
          {/* === Kolom Kiri: Detail Pesanan === */}
          <Col lg={8} className="d-flex flex-column gap-4">
            
            {/* 1. KARTU ALAMAT */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold text-dark mb-0">Alamat Pengiriman</h5>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 text-decoration-none fw-bold"
                    onClick={handleOpenAddressModal}
                  >
                    Ubah
                  </Button>
                </div>
                <p className="text-secondary mb-0 small" style={{ lineHeight: '1.5' }}>
                  {address}
                </p>
              </Card.Body>
            </Card>

            {/* 2. KARTU PRODUK DIPESAN */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Produk Dipesan</h5>
                {cartItems.map((item) => (
                  <Row key={item.id} className="g-3 mb-3 align-items-center">
                    <Col xs="auto">
                      <Image src={item.image} alt={item.name} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                    </Col>
                    <Col>
                      <h6 className="mb-1 fw-bold text-dark small">{item.name}</h6>
                      <p className="text-secondary small mb-0">{item.quantity} x {item.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</p>
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>

            {/* 3. KARTU METODE PEMBAYARAN */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Metode Pembayaran</h5>
                
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                
                <Row>
                  {/* Pilihan QRIS */}
                  <Col md={6} className="mb-2">
                    <Card 
                      className={`payment-option p-3 ${paymentMethod === 'qris' ? 'selected' : ''}`}
                      onClick={() => { setPaymentMethod('qris'); setError(''); }}
                    >
                      <Form.Check type="radio" id="qris-radio" className="fw-bold">
                        <Form.Check.Input type="radio" checked={paymentMethod === 'qris'} readOnly />
                        <Form.Check.Label>QRIS</Form.Check.Label>
                        <span className="text-secondary small d-block ms-4">Bayar dengan QR code (Gopay, OVO, ShopeePay, dll)</span>
                      </Form.Check>
                    </Card>
                  </Col>
                  
                  {/* Pilihan Bank Transfer */}
                  <Col md={6} className="mb-2">
                    <Card 
                      className={`payment-option p-3 ${paymentMethod === 'bank' ? 'selected' : ''}`}
                      onClick={() => { setPaymentMethod('bank'); setError(''); }}
                    >
                      <Form.Check type="radio" id="bank-radio" className="fw-bold">
                        <Form.Check.Input type="radio" checked={paymentMethod === 'bank'} readOnly />
                        <Form.Check.Label>Bank Transfer</Form.Check.Label>
                        <span className="text-secondary small d-block ms-4">Bayar ke Virtual Account (BCA, Mandiri, BRI, dll)</span>
                      </Form.Check>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

          </Col>

          {/* === Kolom Kanan: Ringkasan Belanja === */}
          <Col lg={4}>
            <Card className="shadow-sm border-0 rounded-3 sticky-top" style={{ top: '100px' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Ringkasan Belanja</h5>
                
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Subtotal ({cartItems.length} Produk)</span>
                  <span className="fw-bold text-dark small">{subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-secondary small">Ongkos Kirim</span>
                  <span className="fw-bold text-dark small">{shippingCost.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                </div>
                
                <hr className="my-3" />
                
                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bold text-dark fs-5">Total Bayar</span>
                  <span className="fw-bold text-primary fs-5">
                    {grandTotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </span>
                </div>

                <Button variant="primary" size="lg" className="w-100 fw-bold mt-2" onClick={handleBayar}>
                  Bayar Sekarang
                </Button>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      </Container>

      {/* === MODAL UBAH ALAMAT (Sama seperti di Keranjang) === */}
      <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Ubah Alamat Pengiriman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formAlamat">
              <Form.Label className="fw-bold text-secondary small">Alamat Lengkap</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={4} 
                value={tempAddress}
                onChange={(e) => setTempAddress(e.target.value)}
                placeholder="Contoh: Jl. Sudirman No. 1, Jakarta Pusat"
                className="shadow-none"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowAddressModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveAddress} className="fw-bold">
            Simpan Alamat
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}