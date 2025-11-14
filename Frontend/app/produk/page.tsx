'use client';

import { Container, Row, Col, Button, Image, Card, Spinner, Form, InputGroup, Modal, Alert, Toast, ToastContainer, Nav } from 'react-bootstrap';
import { useState, useEffect } from 'react';
// --- [TAMBAHAN 1] Import icon AlertTriangle & Truck ---
import { Loader2, AlertTriangle, Truck } from 'lucide-react'; 

// Definisikan Tipe untuk produk dari backend
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
  kategori?: 'Sparepart' | 'Jasa' | 'Ori' | 'KW';
}

interface Service {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  deskripsi?: string;
}

const featuredProductNames = [
  "Veleg", "Selang Rem", "Kampas Rem", "Seal Lahar Bambu",
  "Klahar Roda", "Tabung Central", "Veleg"
];

const bestSellingProductNames = [
  "Master Rem", "Kampas Rem", "Klahar Roda", "Master Central", "Tabung Central",
];

export default function ProdukPage() {

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('Terbaru');

  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // --- [TAMBAHAN 2] State untuk Status Toko & Modal Peringatan ---
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  // ---------------------------------------------------------------

  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // --- [TAMBAHAN 3] Fetch Status Toko juga disini ---
        const [sparepartRes, serviceRes, storeStatusRes] = await Promise.all([
            fetch('http://localhost:5000/api/spareparts'),
            fetch('http://localhost:5000/api/services'),
            fetch('http://localhost:5000/api/store/status') // <-- Cek Toko
        ]);

        if (!sparepartRes.ok) throw new Error('Gagal mengambil data');
        
        // Cek status toko
        if (storeStatusRes.ok) {
            const storeData = await storeStatusRes.json();
            if (storeData.success) setIsStoreOpen(storeData.isStoreOpen);
        }
        // ------------------------------------------------

        const data = await sparepartRes.json();
        const serviceData = await serviceRes.json();

        if (data.success) {
          const productsWithCategory = data.data.map((p: Product) => ({
            ...p,
            kategori: p.nama.includes('Jasa') ? 'Jasa' : 'Sparepart'
          }));
          setProducts(productsWithCategory);
        } else {
          throw new Error(data.message || 'Gagal memuat data');
        }

        if (serviceData.success) {
            setServices(serviceData.data.slice(0, 3));
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleCloseModal = () => { setShowModal(false); setSelectedProduct(null); };
  const handleShowModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1); 
    setModalMessage(null);
    setIsSubmitting(false);
    setShowModal(true);
  };
  const handleQuantityDecrease = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const handleQuantityIncrease = () => {
    if (selectedProduct && selectedProduct.stok) {
      setQuantity((prev) => (prev < selectedProduct.stok! ? prev + 1 : prev));
    } else {
      setQuantity((prev) => prev + 1);
    }
  };
  const subtotal = selectedProduct ? selectedProduct.harga * quantity : 0;

  const handleAddToCart = async () => {
    setIsSubmitting(true);
    setModalMessage(null);
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      setModalMessage({ type: 'error', text: 'Anda harus login untuk menambah item.' });
      setIsSubmitting(false);
      return; 
    }
    const userInfo = JSON.parse(userInfoString);
    const userId = userInfo.userId;
    if (!selectedProduct) {
      setModalMessage({ type: 'error', text: 'Produk tidak ditemukan.' });
      setIsSubmitting(false);
      return;
    }
    const cartItemData = {
      userId: userId, productId: selectedProduct._id,
      name: selectedProduct.nama, price: selectedProduct.harga,
      image: selectedProduct.imageUrl, itemType: 'Sparepart', 
      quantity: quantity
    };
    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartItemData)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menambah ke keranjang');
      }
      handleCloseModal();
      setToastMessage(`${selectedProduct.nama} telah ditambahkan`);
      setShowToast(true);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
      setIsSubmitting(false);
    }
  };

  // --- [TAMBAHAN 4] Fungsi Handle Beli Langsung ---
  const handleBuyNowClick = () => {
    if (!isStoreOpen) {
        // Jika tutup, munculkan modal peringatan
        setShowWarningModal(true);
    } else {
        // Jika buka, lanjut proses (contoh: alert)
        alert("Mengarahkan ke pembayaran...");
        handleCloseModal();
    }
  };
  
  // Fungsi untuk tombol "Lanjut Beli" di dalam modal peringatan
  const executeBuyProcess = () => {
    setShowWarningModal(false); // Tutup peringatan
    handleCloseModal(); // Tutup modal produk
    alert("Pesanan diterima (Pengiriman ditunda). Mengarahkan ke pembayaran...");
  };
  // ------------------------------------------------

  const buttonStyle = {
    height: '48px',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const, 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  const filteredAndSortedProducts = products
    .filter(product => {
      if (activeCategory === 'Semua') return true;
      if (activeCategory === 'Sparepart') return product.kategori === 'Sparepart';
      if (activeCategory === 'Ori') return true; 
      if (activeCategory === 'KW') return true;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'Harga Terendah') {
        return a.harga - b.harga;
      }
      if (sortBy === 'Harga Tertinggi') {
        return b.harga - a.harga;
      }
      return 0;
    });


  return (
    <>
      <Container className="py-5">
        <Row className="mb-4 align-items-center">
          <Col md={8}>
            <Nav variant="pills" className="filter-pills" activeKey={activeCategory}>
              {['Semua', 'Sparepart', 'Ori', 'KW'].map((category) => (
                <Nav.Item key={category}>
                  <Nav.Link 
                    eventKey={category} 
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Col>
          <Col md={4} className="mt-3 mt-md-0">
            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="Terbaru">Urutkan: Terbaru</option>
              <option value="Harga Terendah">Urutkan: Harga Terendah</option>
              <option value="Harga Tertinggi">Urutkan: Harga Tertinggi</option>
            </Form.Select>
          </Col>
        </Row>
        
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" />
          </div>
        )}
        {error && <p className="text-danger text-center py-5">Error: {error}</p>}

        <Row className="g-custom-20 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {!loading && filteredAndSortedProducts.map((product) => (
            <Col key={product._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                <Card.Img
                  variant="top"
                  src={product.imageUrl}
                  alt={product.nama}    
                  style={{ height: '180px', objectFit: 'cover' }}
                />
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="me-2">
                      <Card.Title as="h6" className="fw-bold text-dark mb-1">
                        {product.nama}
                      </Card.Title>
                      <Card.Text className="text-dark fw-bold small mb-0">
                        {product.harga.toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0 
                        })}
                      </Card.Text>
                    </div>
                    <div>
                      <Button
                        variant="primary"
                        className="btn-cart-icon"
                        onClick={() => handleShowModal(product)}
                      >
                        <i className="bi bi-cart-plus fs-5"></i>
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {!loading && filteredAndSortedProducts.length === 0 && (
            <Col className="text-center py-5">
              <h5 className="fw-bold text-dark">Oops! Produk tidak ditemukan</h5>
              <p className="text-secondary">Coba ganti kata kunci filter Anda.</p>
            </Col>
          )}
        </Row>
      </Container>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          {selectedProduct && <Modal.Title as="h3" className="fw-bold text-dark">{selectedProduct.nama}</Modal.Title>}
        </Modal.Header>
        <Modal.Body className="p-4 pt-0">
          {selectedProduct && (
            <Row className="g-custom-20">
              <Col md={7}>
                <Image src={selectedProduct.imageUrl} alt={selectedProduct.nama} fluid rounded />
              </Col>
              <Col md={5}>
                <p className="text-secondary small">{selectedProduct.deskripsi || 'Deskripsi untuk produk ini belum tersedia.'}</p>
                <div className="quantity-box border rounded-3 p-3 my-4">
                  <h6 className="fw-bold text-dark">Atur Jumlah</h6>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="d-flex align-items-center border rounded-3 bg-white">
                      <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityIncrease} disabled={isSubmitting}>+</Button>
                      <Form.Control type="number" className="quantity-input-modal shadow-none" value={quantity} readOnly />
                      <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityDecrease} disabled={isSubmitting}>-</Button>
                    </div>
                    <span className="text-secondary small">Stok: <strong className="text-dark">{selectedProduct.stok || 'N/A'}</strong></span>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary fs-5">Subtotal</span>
                  <span className="fw-bold text-dark fs-5">{subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                </div>
                {modalMessage && modalMessage.type === 'error' && (<Alert variant="danger" className="py-2 small">{modalMessage.text}</Alert>)}
                <div className="d-flex flex-column gap-2">
                  <Button variant="primary" className="w-100 rounded-3 btn-add-to-cart" onClick={handleAddToCart} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><i className="bi bi-cart-plus me-2"></i>+ Keranjang</>}
                  </Button>
                  
                  {/* --- [TAMBAHAN 5] Pasang Fungsi onClick disini --- */}
                  <Button 
                    variant="outline-primary" 
                    className="w-100 rounded-3" 
                    style={buttonStyle} 
                    disabled={isSubmitting}
                    onClick={handleBuyNowClick} // <-- Sambungkan ke fungsi baru
                  >
                    Beli Langsung
                  </Button>
                  {/* --------------------------------------------- */}

                  <Button variant="outline-secondary" className="w-100 rounded-3" style={buttonStyle} disabled={isSubmitting}><i className="bi bi-chat-dots me-2"></i>Chat Toko</Button>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="dark">
          <Toast.Body className="text-white text-center fw-bold">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* --- [TAMBAHAN 6] Modal Peringatan Toko Tutup --- */}
      <Modal 
        show={showWarningModal} 
        onHide={() => setShowWarningModal(false)} 
        centered
        backdrop="static" // User harus klik tombol untuk keluar
      >
        <Modal.Body className="text-center p-4">
          <div className="mb-3 text-warning d-flex justify-content-center">
            <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                <AlertTriangle size={48} />
            </div>
          </div>
          <h4 className="fw-bold text-dark mb-2">Toko Sedang Tutup</h4>
          <p className="text-muted mb-4">
            Terima kasih sudah memesan! <br/>
            Namun, mohon maaf saat ini toko sedang tutup. <br/>
            <span className="fw-bold text-dark">Pengiriman akan kami proses segera setelah toko buka kembali.</span>
          </p>
          
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="light" className="flex-fill fw-bold rounded-pill" onClick={() => setShowWarningModal(false)}>
              Batal
            </Button>
            <Button 
                variant="primary" 
                className="flex-fill fw-bold rounded-pill" 
                style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                onClick={executeBuyProcess}
            >
              <Truck size={18} className="me-2" />
              Lanjut Beli
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      {/* ----------------------------------------------- */}

    </>
  );
}