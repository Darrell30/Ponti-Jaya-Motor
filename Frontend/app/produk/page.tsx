'use client';

// 1. Import komponen (Nav, Alert, Toast, ToastContainer ditambahkan)
import { Container, Row, Col, Button, Image, Card, Spinner, Form, InputGroup, Modal, Alert, Toast, ToastContainer, Nav } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // <-- Ikon loading

// Definisikan Tipe untuk produk dari backend
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
  kategori?: 'Sparepart' | 'Jasa' | 'Ori' | 'KW'; // Tipe 'Jasa' tetap ada di sini, tidak masalah
}

// KOMPONEN UTAMA
export default function ProdukPage() {

  // State Halaman
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State Filter
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('Terbaru');

  // === State Modal ===
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // LOGIKA FETCH DATA
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/spareparts');
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        if (data.success) {
          // SIMULASI KATEGORI (Biarkan saja, tidak apa-apa)
          const productsWithCategory = data.data.map((p: Product) => ({
            ...p,
            kategori: p.nama.includes('Jasa') ? 'Jasa' : 'Sparepart'
          }));
          setProducts(productsWithCategory);
        } else {
          throw new Error(data.message || 'Gagal memuat data');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // === Handlers Modal (tidak berubah) ===
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

  // === FUNGSI "+ KERANJANG" (tidak berubah) ===
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

  // Style (tidak berubah)
  const buttonStyle = {
    height: '48px',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const, 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  // === LOGIKA FILTER & SORT (DIPERBARUI) ===
  const filteredAndSortedProducts = products
    // 1. Filter berdasarkan Kategori
    .filter(product => {
      if (activeCategory === 'Semua') return true;
      if (activeCategory === 'Sparepart') return product.kategori === 'Sparepart';
      // --- 'Jasa' DIHAPUS DARI SINI ---
      if (activeCategory === 'Ori') return true; 
      if (activeCategory === 'KW') return true;
      return true;
    })
    // 2. Urutkan berdasarkan Pilihan
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
      {/* Konten Halaman Produk */}
      <Container className="py-5">
        
        {/* ================================== */}
        {/* === BAGIAN FILTER (DIPERBARUI) === */}
        {/* ================================== */}
        <Row className="mb-4 align-items-center">
          {/* Tombol Filter Kategori */}
          <Col md={8}>
            <Nav variant="pills" className="filter-pills" activeKey={activeCategory}>
              {/* --- 'Jasa' DIHAPUS DARI ARRAY INI --- */}
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
          {/* Dropdown Urutkan */}
          <Col md={4} className="mt-3 mt-md-0">
            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="Terbaru">Urutkan: Terbaru</option>
              <option value="Harga Terendah">Urutkan: Harga Terendah</option>
              <option value="Harga Tertinggi">Urutkan: Harga Tertinggi</option>
            </Form.Select>
          </Col>
        </Row>
        {/* ================================== */}

        
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" />
          </div>
        )}
        {error && <p className="text-danger text-center py-5">Error: {error}</p>}

        {/* Product Grid (Sekarang menggunakan 'filteredAndSortedProducts') */}
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
          {/* Tampilan jika filter tidak menemukan hasil */}
          {!loading && filteredAndSortedProducts.length === 0 && (
            <Col className="text-center py-5">
              <h5 className="fw-bold text-dark">Oops! Produk tidak ditemukan</h5>
              <p className="text-secondary">Coba ganti kata kunci filter Anda.</p>
            </Col>
          )}
        </Row>
      </Container>


      {/* MODAL DETAIL PRODUK (Tidak berubah) */}
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
                  <Button variant="outline-primary" className="w-100 rounded-3" style={buttonStyle} disabled={isSubmitting}>Beli Langsung</Button>
                  <Button variant="outline-secondary" className="w-100 rounded-3" style={buttonStyle} disabled={isSubmitting}><i className="bi bi-chat-dots me-2"></i>Chat Toko</Button>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      {/* TOAST NOTIFIKASI (Tidak berubah) */}
      <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="dark">
          <Toast.Body className="text-white text-center fw-bold">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}