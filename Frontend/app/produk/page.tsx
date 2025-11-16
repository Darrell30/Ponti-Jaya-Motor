'use client';

import { Container, Row, Col, Button, Image, Card, Spinner, Form, Modal, Alert, Toast, ToastContainer, Nav } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { Loader2, AlertTriangle, Truck, MessageCircle, ShoppingCart, Zap } from 'lucide-react'; 
// 1. IMPORT WIDGET BARU
import ChatWidget from '../components/ChatWidget'; 

// --- TIPE DATA ---
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
  kategori?: string;
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
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  
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

  // --- 2. STATE UNTUK CHAT WIDGET ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  // ----------------------------------

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [sparepartRes, serviceRes, storeStatusRes] = await Promise.all([
          fetch('http://localhost:5000/api/spareparts'),
          fetch('http://localhost:5000/api/services'),
          fetch('http://localhost:5000/api/store/status')
        ]);

        if (!sparepartRes.ok) throw new Error('Gagal mengambil data');
        if (storeStatusRes.ok) {
            const storeData = await storeStatusRes.json();
            if (storeData.success) setIsStoreOpen(storeData.isStoreOpen);
        }

        const sparepartData = await sparepartRes.json();
        const serviceData = await serviceRes.json();

        if (sparepartData.success) {
          const allProducts: Product[] = sparepartData.data;
          const productsWithCategory = allProducts.map((p: Product) => ({
            ...p,
            kategori: p.nama.includes('Jasa') ? 'Jasa' : 'Sparepart'
          }));
          setProducts(productsWithCategory);
          setFeaturedProducts(productsWithCategory.filter(p => featuredProductNames.includes(p.nama)));
          setBestSellingProducts(productsWithCategory.filter(p => bestSellingProductNames.includes(p.nama)));
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
    fetchAllData();
  }, []);

  // Handlers Modal Produk
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
      router.push('/login');
      return; 
    }
    const userInfo = JSON.parse(userInfoString);
    const userId = userInfo.userId;
    if (!selectedProduct) return;

    const cartItemData = {
      userId: userId, productId: selectedProduct._id,
      name: selectedProduct.nama, price: selectedProduct.harga,
      image: selectedProduct.imageUrl, itemType: 'Sparepart', quantity: quantity
    };

    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartItemData)
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);
      
      handleCloseModal();
      if (!isStoreOpen) {
        setToastMessage(`⚠️ Toko Tutup: ${selectedProduct.nama} masuk keranjang (Diproses besok)`);
      } else {
        setToastMessage(`✅ ${selectedProduct.nama} berhasil ditambahkan!`);
      }
      setShowToast(true);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
      setIsSubmitting(false);
    }
  };

  const handleBuyNowClick = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login');
      return; 
    }
    if (!isStoreOpen) {
        setShowWarningModal(true);
    } else {
        executeBuyProcess();
    }
  };

  const executeBuyProcess = () => {
    setShowWarningModal(false);
    alert("Mengarahkan ke pembayaran...");
    handleCloseModal();
  };

  // --- 3. LOGIKA BARU: BUKA WIDGET CHAT ---
  const handleChatToko = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      alert("Silakan login terlebih dahulu untuk chat.");
      router.push('/login');
      return; 
    }
    
    // Set produk yang sedang dilihat ke state widget
    if (selectedProduct) {
        setChatProduct(selectedProduct);
    }

    // Tutup modal produk
    handleCloseModal();

    // Buka widget chat
    setIsChatOpen(true);
  };
  // ----------------------------------------

  const filteredAndSortedProducts = products
    .filter(product => {
      if (activeCategory === 'Semua') return true;
      if (activeCategory === 'Sparepart') return product.kategori === 'Sparepart';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'Harga Terendah') return a.harga - b.harga;
      if (sortBy === 'Harga Tertinggi') return b.harga - a.harga;
      return 0;
    });

  const buttonStyle = { height: '48px', fontWeight: 'bold' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <>
      {/* --- 4. RENDER WIDGET CHAT (DI PALING LUAR) --- */}
      <ChatWidget 
         isOpen={isChatOpen} 
         onClose={() => setIsChatOpen(false)} 
         productContext={chatProduct} 
      />
      {/* -------------------------------------------- */}

      <Container className="py-5">
        <Row className="mb-4 align-items-center">
          <Col md={8}>
            <Nav variant="pills" className="filter-pills" activeKey={activeCategory}>
              {['Semua', 'Sparepart', 'Ori', 'KW'].map((category) => (
                <Nav.Item key={category}>
                  <Nav.Link eventKey={category} onClick={() => setActiveCategory(category)}>{category}</Nav.Link>
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
        
        {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
        {error && <p className="text-danger text-center py-5">Error: {error}</p>}

        <Row className="g-custom-20 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {!loading && filteredAndSortedProducts.map((product) => (
            <Col key={product._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                <Card.Img
                  variant="top"
                  src={product.imageUrl}
                  style={{ height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => handleShowModal(product)}
                />
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="me-2">
                      <Card.Title as="h6" className="fw-bold text-dark mb-1 text-truncate">{product.nama}</Card.Title>
                      <Card.Text className="text-dark fw-bold small mb-0">
                        {product.harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </Card.Text>
                    </div>
                    <Button variant="primary" className="btn-cart-icon" onClick={() => handleShowModal(product)}>
                        <ShoppingCart size={18} />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
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
                <p className="text-secondary small">{selectedProduct.deskripsi || 'Tidak ada deskripsi.'}</p>
                <div className="quantity-box border rounded-3 p-3 my-4">
                  <h6 className="fw-bold text-dark">Atur Jumlah</h6>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="d-flex align-items-center border rounded-3 bg-white">
                      <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityDecrease}>-</Button>
                      <span className="fw-bold px-3">{quantity}</span>
                      <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityIncrease}>+</Button>
                    </div>
                    <span className="text-secondary small">Stok: <strong className="text-dark">{selectedProduct.stok}</strong></span>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-4">
                  <span className="text-secondary">Subtotal</span>
                  <span className="fw-bold fs-5 text-dark">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {modalMessage && <Alert variant="danger" className="py-2 small">{modalMessage.text}</Alert>}
                <div className="d-flex flex-column gap-2">
                  <Button variant="primary" className="w-100 rounded-3 btn-add-to-cart" onClick={handleAddToCart} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShoppingCart className="me-2" size={18}/> + Keranjang</>}
                  </Button>
                  <Button variant="outline-primary" className="w-100 rounded-3" style={buttonStyle} disabled={isSubmitting} onClick={handleBuyNowClick}>
                    <Zap size={18} className="me-2" fill="currentColor" /> Beli Langsung
                  </Button>
                  {/* TOMBOL CHAT (Memanggil fungsi baru) */}
                  <Button variant="outline-secondary" className="w-100 rounded-3" style={buttonStyle} disabled={isSubmitting} onClick={handleChatToko}>
                    <MessageCircle size={18} className="me-2" /> Chat Toko
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      <ToastContainer position="bottom-center" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg={isStoreOpen ? "success" : "warning"}>
          <Toast.Body className={isStoreOpen ? "text-white" : "text-dark fw-bold"}>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} centered backdrop="static">
        <Modal.Body className="text-center p-4">
          <div className="mb-3 text-warning d-flex justify-content-center">
            <div className="bg-warning bg-opacity-10 p-3 rounded-circle"><AlertTriangle size={48} /></div>
          </div>
          <h4 className="fw-bold text-dark mb-2">Toko Sedang Tutup</h4>
          <p className="text-muted mb-4">Pesanan diterima, namun akan diproses saat toko buka.</p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="light" className="flex-fill fw-bold rounded-pill" onClick={() => setShowWarningModal(false)}>Batal</Button>
            <Button variant="primary" className="flex-fill fw-bold rounded-pill" style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }} onClick={executeBuyProcess}>
              <Truck size={18} className="me-2" /> Lanjut Beli
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}