'use client';

// 1. MODIFIKASI: Mengimpor semua yang dibutuhkan, termasuk ChatWidget
import { Container, Row, Col, Button, Image, Card, Spinner, Form, InputGroup, Modal, Alert, Toast, ToastContainer, Nav } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Truck, ShoppingCart, MessageCircle, Zap } from 'lucide-react'; // Menambahkan MessageCircle dan Zap
import ChatWidget from '../components/ChatWidget'; // <-- Import ChatWidget

// --- TIPE DATA ---
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
  // 2. Inisialisasi router
  const router = useRouter();

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

  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  // === TAMBAHAN UNTUK CHAT WIDGET ===
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<Product | null>(null); // State yang dikirim ke ChatWidget
  // ===================================

  useEffect(() => {
    // ... (Logika fetchProducts Anda SAMA, tidak berubah) ...
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const [sparepartRes, serviceRes, storeStatusRes] = await Promise.all([
            fetch('http://localhost:5000/api/spareparts'),
            fetch('http://localhost:5000/api/services'),
            fetch('http://localhost:5000/api/store/status')
        ]);
        
        let allProducts: Product[] = [];
        if (sparepartRes.ok) {
            const data = await sparepartRes.json();
            if (data.success) allProducts = data.data;
        } else {
            throw new Error('Gagal mengambil data sparepart');
        }

        if (storeStatusRes.ok) {
            const storeData = await storeStatusRes.json();
            if (storeData.success) setIsStoreOpen(storeData.isStoreOpen);
        }
        
        const serviceData = await serviceRes.json();
        
        const productsWithCategory = allProducts.map((p: Product) => ({
            ...p,
            kategori: p.nama.includes('Jasa') ? 'Jasa' : 'Sparepart'
        })) as Product[];
        
        setProducts(productsWithCategory);

        if (serviceData.success) {
            setServices(serviceData.data.slice(0, 3));
        }

      } catch (err: any) {
         // Fallback to mock data if API fails
        const mockProducts: Product[] = [
            { _id: '1', nama: 'Veleg Racing 17"', imageUrl: 'https://placehold.co/400x300/0d6efd/fff?text=Veleg+Racing', harga: 850000, stok: 5, deskripsi: 'Veleg alloy ringan dan kuat.' },
            { _id: '2', nama: 'Selang Rem Performance', imageUrl: 'https://placehold.co/400x300/6c757d/fff?text=Selang+Rem', harga: 150000, stok: 12, deskripsi: 'Meningkatkan respons pengereman.' },
            { _id: '3', nama: 'Kampas Rem Bendix', imageUrl: 'https://placehold.co/400x300/ffc107/000?text=Kampas+Rem', harga: 75000, stok: 30, deskripsi: 'Pengereman senyap dan efektif.' },
          ];
        setProducts(mockProducts);
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

  // === handleAddToCart ===
  const handleAddToCart = async () => {
    setIsSubmitting(true);
    setModalMessage(null);

    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return; 
    }

    let userInfo;
    try {
      userInfo = JSON.parse(userInfoString);
    } catch (e) {
      setModalMessage({ type: 'error', text: 'Sesi login Anda rusak. Harap login kembali.' });
      setIsSubmitting(false);
      return;
    }
    const userId = userInfo ? userInfo.userId : null;
    if (!userId || !selectedProduct) {
      setModalMessage({ type: 'error', text: 'Data user atau produk tidak valid.' });
      setIsSubmitting(false);
      return; 
    }
    const cartItemData = {
      userId: userId, 
      productId: selectedProduct._id,
      name: selectedProduct.nama, 
      price: selectedProduct.harga,
      image: selectedProduct.imageUrl, 
      itemType: 'Sparepart', 
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
      setToastMessage(`Produk "${selectedProduct.nama}" berhasil ditambahkan ke keranjang!`);
      setShowToast(true);
      
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Logika inti "Beli Langsung" ---
  const proceedToCheckout = () => {
    if (!selectedProduct) return;
    const itemToCheckout = {
      _id: `direct-${selectedProduct._id}`,
      productId: selectedProduct._id,
      name: selectedProduct.nama,
      harga: selectedProduct.harga,
      image: selectedProduct.imageUrl,
      quantity: quantity,
      itemType: 'Sparepart' 
    };
    localStorage.setItem("checkoutItems", JSON.stringify([itemToCheckout]));
    handleCloseModal();
    setShowWarningModal(false);
    router.push('/pembayaran');
  };

  // --- Handler Tombol "Beli Langsung" ---
  const handleBuyNowClick = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return; 
    }

    if (!isStoreOpen) {
        setShowWarningModal(true);
    } else {
        proceedToCheckout();
    }
  };
  
  // --- Digunakan oleh Modal Peringatan ---
  const executeBuyProcess = () => {
    proceedToCheckout(); 
  };
  
  // === 7. LOGIKA CHAT TOKO AKTIF ===
  const handleChatToko = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return; 
    }
    
    // 1. Ambil data produk minimum yang diperlukan oleh ChatWidget
    if (selectedProduct) {
        const productToSend = {
            _id: selectedProduct._id,
            nama: selectedProduct.nama,
            imageUrl: selectedProduct.imageUrl,
            harga: selectedProduct.harga,
        };
        setChatProduct(productToSend);
    } else {
         setChatProduct(null); // Mulai chat tanpa konteks produk jika selectedProduct hilang
    }

    // 2. Tutup modal produk dan buka widget chat
    handleCloseModal(); 
    setIsChatOpen(true); 
  };
  // ------------------------------------

  const buttonStyle = {
    height: '48px',
    fontSize: '1.0rem',
    fontWeight: 'bold' as const, 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  const filteredAndSortedProducts = products
    .filter(product => {
      if (activeCategory === 'Semua') return true;
      if (activeCategory === 'Sparepart') return product.kategori === 'Sparepart';
      if (activeCategory === 'Ori') return product.nama.toLowerCase().includes('ori'); 
      if (activeCategory === 'KW') return product.nama.toLowerCase().includes('kw');
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

  // --- RENDER JSX ---
  return (
    <>
      {/* RENDER CHAT WIDGET */}
      <ChatWidget 
         isOpen={isChatOpen} 
         onClose={() => {
            setIsChatOpen(false);
            setChatProduct(null); // Clear context when closing
         }} 
         productContext={chatProduct} 
      />

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
                  onClick={() => handleShowModal(product)}
                />
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="me-2">
                      <Card.Title as="h6" className="fw-bold text-dark mb-1 text-truncate">
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
                        <ShoppingCart size={20} />
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
                    <InputGroup className="d-flex align-items-center border rounded-3 bg-white" style={{ maxWidth: '120px' }}>
                        <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityDecrease} disabled={isSubmitting}>-</Button>
                        <Form.Control type="number" className="quantity-input-modal shadow-none text-center" value={quantity} readOnly style={{ border: 'none', background: 'transparent' }} />
                        <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityIncrease} disabled={isSubmitting}>+</Button>
                    </InputGroup>
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
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><ShoppingCart size={18} className="me-2" />+ Keranjang</>}
                  </Button>
                  
                  <Button 
                    variant="outline-primary" 
                    className="w-100 rounded-3" 
                    style={buttonStyle} 
                    disabled={isSubmitting}
                    onClick={handleBuyNowClick}
                  >
                    <Zap size={18} className="me-2" fill="currentColor" /> Beli Langsung
                  </Button>

                  {/* TOMBOL CHAT TOKO AKTIF */}
                  <Button 
                    variant="outline-secondary" 
                    className="w-100 rounded-3" 
                    style={buttonStyle} 
                    disabled={isSubmitting}
                    onClick={handleChatToko}
                  >
                    <MessageCircle size={18} className="me-2" /> Chat Toko
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="dark">
          <Toast.Body className="text-white text-center fw-bold d-flex align-items-center justify-content-center">
            <ShoppingCart size={18} className="me-2 text-success" />
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Modal 
        show={showWarningModal} 
        onHide={() => setShowWarningModal(false)} 
        centered
        backdrop="static"
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
    </>
  );
}
