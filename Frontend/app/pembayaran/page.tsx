// app/pembayaran/page.tsx
'use client';

// Import hooks dan komponen
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Image, Modal, Alert, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react'; 

interface CheckoutItem {
  _id: string; 
  productId: string; 
  name?: string;  
  nama?: string;  
  harga: number; 
  image: string;
  quantity: number;
}

export default function PembayaranPage() {
  const router = useRouter();
  
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); 

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("Memuat alamat...");
  const [tempAddress, setTempAddress] = useState(address);

  const [paymentMethod, setPaymentMethod] = useState(''); // 'qris' or 'cod'
  const [error, setError] = useState(''); 

  // ... (useEffect untuk ambil data SAMA, tidak berubah) ...
  useEffect(() => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return;
    }
    const userInfo = JSON.parse(userInfoString);
    setUserId(userInfo.userId);

    const storedAddress = localStorage.getItem("shippingAddress");
    if (storedAddress) {
      setAddress(storedAddress);
    } else {
      setAddress("Jl. Kamal Raya Outer Ring Road, Cengkareng, Jakarta Barat, 11730");
    }

    const itemsString = localStorage.getItem("checkoutItems");
    if (!itemsString) {
      alert("Tidak ada item untuk di-checkout.");
      router.push('/keranjang');
      return;
    }
    
    const checkoutItems: CheckoutItem[] = JSON.parse(itemsString);
    if (checkoutItems.length === 0) {
      alert("Tidak ada item untuk di-checkout.");
      router.push('/keranjang');
      return;
    }

    setItems(checkoutItems);
    setLoading(false);

  }, [router]);

  // ... (Handlers Alamat SAMA, tidak berubah) ...
  const handleOpenAddressModal = () => {
    setTempAddress(address);
    setShowAddressModal(true);
  };
  const handleSaveAddress = () => {
    setAddress(tempAddress);
    setShowAddressModal(false);
  };

  // ... (Fungsi +/-/Hapus SAMA, tidak berubah) ...
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) newQuantity = 1; 
    setItems(currentItems =>
      currentItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };
  const handleRemoveItem = (productId: string) => {
    setItems(currentItems =>
      currentItems.filter(item => item.productId !== productId)
    );
  };

  // ... (Kalkulasi Total SAMA, tidak berubah) ...
  const subtotal = items.reduce((acc, item) => acc + (item.harga * item.quantity), 0);
  const shippingCost = 15000;
  const grandTotal = subtotal + shippingCost;

  // === FUNGSI UTAMA: TOMBOL BAYAR ===
  const handleBayar = async () => {
    if (!paymentMethod) {
      setError("Harap pilih metode pembayaran terlebih dahulu.");
      return;
    }
    if (items.length === 0) {
      setError("Tidak ada item di checkout Anda.");
      return;
    }
    if (!userId) {
      setError("Sesi Anda berakhir. Harap login kembali.");
      return;
    }

    setError("");
    setIsPlacingOrder(true);

    // --- PERBAIKAN 1 DI SINI ---
    // Ubah 'COD' (uppercase) menjadi 'cod' (lowercase)
    const orderStatus = paymentMethod === 'cod' ? 'Diproses' : 'Menunggu Pembayaran';

    const orderData = {
      userId: userId,
      items: items.map(item => ({ 
        productId: item.productId,
        nama: item.nama || item.name, 
        harga: item.harga,
        image: item.image,
        quantity: item.quantity
      })),
      shippingAddress: address,
      paymentMethod: paymentMethod.toUpperCase(), // Ini tetap UPPERCASE untuk database
      totalAmount: grandTotal,
      status: orderStatus
    };

    try {
      const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat pesanan');
      }

      localStorage.removeItem("checkoutItems");
      localStorage.setItem("showSuccessNotification", "Pesanan Sudah Berhasil Dibuat");

      // --- PERBAIKAN 2 DI SINI ---
      // Ubah 'COD' (uppercase) menjadi 'cod' (lowercase)
      if (paymentMethod === 'cod') {
        router.push('/pembelian');
      } else {
        router.push(`/pembayaran/qris?orderId=${data.data._id}&total=${grandTotal}`);
      }

    } catch (err: any) {
      setError(err.message); 
      setIsPlacingOrder(false);
    }
  };


  if (loading) {
    // ... (Tampilan Loading SAMA) ...
    return (
      <div className="w-100 py-5 text-center" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
        <Spinner animation="border" />
        <p className="mt-2 text-muted">Memuat checkout...</p>
      </div>
    );
  }

  return (
    <div className="w-100 py-5" style={{ backgroundColor: '#E5E9F0', minHeight: '100vh' }}>
      <Container>
        <h1 className="fw-bold text-dark mb-4">Checkout Pembayaran</h1>
        
        <Row className="g-custom-20">
          
          <Col lg={8} className="d-flex flex-column gap-4">
            
            {/* ... (KARTU ALAMAT SAMA) ... */}
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

            {/* ... (KARTU PRODUK DIPESAN SAMA) ... */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Produk Dipesan</h5>
                {items.length === 0 && (
                  <Alert variant="warning">
                    Tidak ada item. 
                    <Link href="/keranjang" className="alert-link">Kembali ke keranjang</Link>.
                  </Alert>
                )}
                {items.map((item) => (
                  <Row key={item.productId} className="g-3 mb-3 align-items-center">
                    <Col xs="auto">
                      <Image src={item.image} alt={item.nama || item.name} rounded style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                    </Col>
                    <Col>
                      <h6 className="mb-1 fw-bold text-dark small">{item.nama || item.name}</h6>
                      <p className="text-secondary small mb-0">{item.quantity} x {item.harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</p>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-center justify-content-end">
                      <Button 
                        variant="link" 
                        className="text-danger p-0 me-3"
                        onClick={() => handleRemoveItem(item.productId)}
                        disabled={isPlacingOrder}
                      >
                        <i className="bi bi-trash fs-5"></i>
                      </Button>
                      <div className="d-flex align-items-center">
                        <Button 
                          variant="outline-secondary" 
                          className="btn-quantity"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={isPlacingOrder}
                        >
                          -
                        </Button>
                        <span className="quantity-display">{item.quantity}</span>
                        <Button 
                          variant="outline-secondary" 
                          className="btn-quantity"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={isPlacingOrder}
                        >
                          +
                        </Button>
                      </div>
                    </Col>
                  </Row>
                ))}
              </Card.Body>
            </Card>

            {/* ... (KARTU METODE PEMBAYARAN SAMA) ... */}
            <Card className="shadow-sm border-0 rounded-3 card-transaction">
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Metode Pembayaran</h5>
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                <Row>
                  <Col md={6} className="mb-2">
                    <Card 
                      className={`payment-option p-3 ${paymentMethod === 'qris' ? 'selected' : ''}`}
                      onClick={() => { setPaymentMethod('qris'); setError(''); }}
                    >
                      <Form.Check type="radio" id="qris-radio" className="fw-bold">
                        <Form.Check.Input type="radio" checked={paymentMethod === 'qris'} readOnly />
                        <Form.Check.Label className="d-flex align-items-center gap-2">
                          <i className="bi bi-qr-code fs-5"></i> QRIS
                        </Form.Check.Label>
                        <span className="text-secondary small d-block ms-4">Bayar dengan QR code (Gopay, OVO, ShopeePay, dll)</span>
                      </Form.Check>
                    </Card>
                  </Col>
                  <Col md={6} className="mb-2">
                    <Card 
                      className={`payment-option p-3 ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => { setPaymentMethod('cod'); setError(''); }}
                    >
                      <Form.Check type="radio" id="cod-radio" className="fw-bold">
                        <Form.Check.Input type="radio" checked={paymentMethod === 'cod'} readOnly />
                        <Form.Check.Label className="d-flex align-items-center gap-2">
                          <Truck size={18} /> COD (Bayar di Tempat)
                        </Form.Check.Label>
                        <span className="text-secondary small d-block ms-4">Bayar tunai ke kurir saat barang diterima</span>
                      </Form.Check>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

          </Col>

          {/* ... (Kolom Kanan / Ringkasan Belanja SAMA) ... */}
          <Col lg={4}>
            <Card className="shadow-sm border-0 rounded-3 sticky-top" style={{ top: '100px' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold text-dark mb-3">Ringkasan Belanja</h5>
                
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-secondary small">Subtotal ({items.length} Produk)</span>
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

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 fw-bold mt-2" 
                  onClick={handleBayar}
                  disabled={isPlacingOrder || items.length === 0}
                >
                  {isPlacingOrder ? (
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  ) : (
                    'Bayar Sekarang'
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>

        </Row>
      </Container>

      {/* ... (Modal Ubah Alamat SAMA) ... */}
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