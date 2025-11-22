'use client';

import { 
  Container, Row, Col, Button, Image, Card, Spinner,
  Modal, Form, Alert, Toast, ToastContainer, Carousel 
} from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2, MessageCircle, ShoppingCart, Zap, Truck, AlertTriangle } from 'lucide-react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import ChatWidget from './components/ChatWidget'; 

// === TIPE DATA ===
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

// === DATA CADANGAN (MOCK DATA) ===
const MOCK_SERVICES: Service[] = [
  { _id: 's1', nama: 'Servis Rem', imageUrl: 'https://placehold.co/800x400/333/FFF?text=Servis+Rem', harga: 50000, deskripsi: 'Pengecekan dan penggantian kampas rem berkualitas.' },
  { _id: 's2', nama: 'Ganti Oli Mesin', imageUrl: 'https://placehold.co/800x400/555/FFF?text=Ganti+Oli', harga: 35000, deskripsi: 'Ganti oli mesin agar performa motor tetap prima.' },
  { _id: 's3', nama: 'Servis Mesin Ringan', imageUrl: 'https://placehold.co/800x400/777/FFF?text=Servis+Mesin', harga: 150000, deskripsi: 'Tune up ringan dan pembersihan karburator/injeksi.' },
  { _id: 's4', nama: 'Servis CVT', imageUrl: 'https://placehold.co/800x400/999/FFF?text=Servis+CVT', harga: 85000, deskripsi: 'Perawatan area CVT agar tarikan enteng dan responsif.' }
];

const MOCK_PRODUCTS: Product[] = [
  { _id: 'p1', nama: 'Veleg', imageUrl: 'https://placehold.co/300x300/0d6efd/fff?text=Veleg', harga: 850000, stok: 5, deskripsi: 'Veleg alloy ringan dan kuat.', kategori: 'Sparepart' },
  { _id: 'p2', nama: 'Selang Rem', imageUrl: 'https://placehold.co/300x300/6c757d/fff?text=Selang+Rem', harga: 150000, stok: 12, deskripsi: 'Tahan panas tinggi.', kategori: 'Sparepart' },
  { _id: 'p3', nama: 'Kampas Rem', imageUrl: 'https://placehold.co/300x300/ffc107/000?text=Kampas+Rem', harga: 75000, stok: 30, deskripsi: 'Pakem dan awet.', kategori: 'Sparepart' },
  { _id: 'p4', nama: 'Master Rem', imageUrl: 'https://placehold.co/300x300/198754/fff?text=Master+Rem', harga: 350000, stok: 3, deskripsi: 'Original part.', kategori: 'Sparepart' },
  { _id: 'p5', nama: 'Klahar Roda', imageUrl: 'https://placehold.co/300x300/dc3545/fff?text=Klahar', harga: 45000, stok: 50, deskripsi: 'Presisi tinggi.', kategori: 'Sparepart' },
  { _id: 'p6', nama: 'Tabung Central', imageUrl: 'https://placehold.co/300x300/6610f2/fff?text=Tabung', harga: 120000, stok: 8, deskripsi: 'Kualitas terjamin.', kategori: 'Sparepart' },
  { _id: 'p7', nama: 'Seal Lahar Bambu', imageUrl: 'https://placehold.co/300x300/fd7e14/fff?text=Seal', harga: 25000, stok: 100, deskripsi: 'Tahan bocor.', kategori: 'Sparepart' },
  { _id: 'p8', nama: 'Master Central', imageUrl: 'https://placehold.co/300x300/20c997/fff?text=Master+C', harga: 450000, stok: 2, deskripsi: 'Full set original.', kategori: 'Sparepart' },
];

const featuredProductNames = [
  "Veleg", "Selang Rem", "Kampas Rem", "Seal Lahar Bambu", "Klahar Roda", "Tabung Central"
];

const bestSellingProductNames = [
  "Master Rem", "Kampas Rem", "Klahar Roda", "Master Central", "Tabung Central",
];

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const searchQuery = searchParams.get('q') || ''; 

  // State Data
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]); 
  
  // State UI
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

  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const whatsappNumber = "6281297575567";
  const shopEmail = "edward.stiawan06@gmail.com"; 
  const emailSubject = "Pertanyaan Mengenai Ponti Jaya Motor";
  const mailtoUrl = `mailto:${shopEmail}?subject=${encodeURIComponent(emailSubject)}`;

  // === FETCH DATA ===
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'; 

      try {
        const [sparepartRes, serviceRes, storeRes] = await Promise.allSettled([
          fetch(`${BASE_URL}/api/spareparts`),
          fetch(`${BASE_URL}/api/services`),
          fetch(`${BASE_URL}/api/store/status`)
        ]);

        let productsLoaded = false;
        let servicesLoaded = false;

        // 1. Proses Produk
        if (sparepartRes.status === 'fulfilled' && sparepartRes.value.ok) {
          const data = await sparepartRes.value.json();
          if (data.success) {
            const allProducts = data.data.map((p: any) => ({
              ...p,
              kategori: p.nama.includes('Jasa') ? 'Jasa' : 'Sparepart' 
            }));
            
            setFeaturedProducts(allProducts.filter((p: any) => featuredProductNames.some(name => p.nama.includes(name))));
            setBestSellingProducts(allProducts.filter((p: any) => bestSellingProductNames.some(name => p.nama.includes(name))));
            productsLoaded = true;
          }
        }

        // 2. Proses Jasa
        if (serviceRes.status === 'fulfilled' && serviceRes.value.ok) {
          const data = await serviceRes.value.json();
          if (data.success) {
            setServices(data.data);
            servicesLoaded = true;
          }
        }

        // 3. Proses Status Toko
        if (storeRes.status === 'fulfilled' && storeRes.value.ok) {
          const data = await storeRes.value.json();
          if (data.success) setIsStoreOpen(data.isStoreOpen);
        }

        // --- FALLBACK JIKA API GAGAL ---
        if (!productsLoaded) {
          console.warn("Gagal load produk dari server, pakai Mock Data.");
          setFeaturedProducts(MOCK_PRODUCTS);
          setBestSellingProducts(MOCK_PRODUCTS);
        }
        if (!servicesLoaded) {
          console.warn("Gagal load jasa dari server, pakai Mock Data.");
          setServices(MOCK_SERVICES);
        }

      } catch (err) {
        console.error("Server Mati total, menggunakan Full Mock Data.");
        setFeaturedProducts(MOCK_PRODUCTS);
        setBestSellingProducts(MOCK_PRODUCTS);
        setServices(MOCK_SERVICES);
      } finally {
        setLoading(false); 
      }
    };

    fetchAllData();
  }, []); 

  // --- HANDLERS ---
  const handleServiceChat = (service: Service) => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      alert("Silakan login terlebih dahulu untuk bertanya tentang jasa.");
      router.push('/login');
      return;
    }
    const serviceAsProduct: Product = {
      _id: service._id, nama: service.nama, imageUrl: service.imageUrl,
      harga: service.harga, stok: 1, deskripsi: service.deskripsi, kategori: 'Jasa'
    };
    setChatProduct(serviceAsProduct);
    setIsChatOpen(true);
  };

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
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) { router.push('/login'); return; }

    setIsSubmitting(true);
    setModalMessage(null);
    
    const userInfo = JSON.parse(userInfoString);
    const userId = userInfo.userId;
    
    const cartItemData = {
      userId: userId, 
      productId: selectedProduct?._id,
      name: selectedProduct?.nama, 
      price: selectedProduct?.harga,
      image: selectedProduct?.imageUrl, 
      itemType: selectedProduct?.kategori === 'Jasa' ? 'Service' : 'Sparepart', 
      quantity: quantity
    };

    try {
      const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartItemData)
      });
      
      if (!response.ok) throw new Error("Gagal menambah (Server Error)");
      
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      handleCloseModal();
      setToastMessage(`${selectedProduct?.nama} telah ditambahkan`);
      setShowToast(true);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: "Maaf, server sedang gangguan. Coba lagi nanti." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBeliLangsung = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) { router.push('/login'); return; }
    if (!isStoreOpen) { setShowWarningModal(true); } 
    else { proceedToCheckout(); }
  };

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
    router.push('/pembayaran');
  };
  
  const handleChatToko = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) { router.push('/login'); return; }
    handleCloseModal();
    if (selectedProduct) { setChatProduct(selectedProduct); setIsChatOpen(true); }
  };

  const filteredAndSortedProducts = featuredProducts
    .filter(product => {
        if(!searchQuery) return true;
        return product.nama.toLowerCase().includes(searchQuery.toLowerCase());
    });

  // Helper style untuk container scrollable
  const scrollContainerStyle = {
    display: 'flex',
    overflowX: 'auto' as const,
    scrollBehavior: 'smooth' as const,
    scrollbarWidth: 'thin' as const,
    paddingBottom: '1rem',
    gap: '1rem',
  };

  return (
    <main style={{ backgroundColor: "#fff" }}>
      
      <ChatWidget productContext={chatProduct} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* HERO */}
      <div id="hero" className="text-center text-white" style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/hero/bengkel.jpg')`,
          backgroundSize: 'cover', backgroundPosition: 'center', paddingTop: '6rem', paddingBottom: '6rem',
        }}>
        <Container>
          <h1 className="fw-bold display-4 mb-3">Ponti Jaya Motor</h1>
          <p className="fs-5 mb-4">Website untuk melihat katalog produk berupa sparepart kendaraan roda tiga, juga menyediakan jasa servis.</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link href="/produk" passHref legacyBehavior><Button size="lg" className="px-4 fw-bold rounded-3 btn-hero-primary">Lihat Katalog</Button></Link>
            <Link href="/#jasa" passHref legacyBehavior><Button size="lg" className="px-4 fw-bold rounded-3 btn-hero-secondary">Jasa Servis</Button></Link>
          </div>
        </Container>
      </div>
      
      {/* 2. PRODUK DI CARI (SLIDER HORIZONTAL) */}
      <Container as="section" className="py-5">
        <h3 className="fw-bold mb-5 text-dark">Produk Yang Paling di Cari-Cari</h3>
        {loading ? <div className="text-center"><Spinner animation="border"/></div> : (
          <div style={scrollContainerStyle} className="px-2">
            {featuredProducts.map((product) => (
              <div key={product._id} className="text-center" style={{ minWidth: '150px', cursor: 'pointer' }} onClick={() => handleShowModal(product)}>
                <Image 
                    src={product.imageUrl} 
                    alt={product.nama} 
                    roundedCircle 
                    className="shadow-sm mb-3" 
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }} 
                />
                <h6 className="fw-bold text-dark small text-truncate px-2">{product.nama}</h6>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* 3. PRODUK TERLARIS (SLIDER HORIZONTAL) */}
      <Container as="section" className="py-5 bg-light">
        <h3 className="fw-bold mb-5 text-dark">Produk Terlaris</h3>
        {loading ? <div className="text-center"><Spinner animation="border"/></div> : (
          <div style={scrollContainerStyle} className="px-2">
            {bestSellingProducts.map((product) => (
              <div key={product._id} style={{ minWidth: '250px', maxWidth: '250px' }}>
                <Card className="h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                  <Card.Img variant="top" src={product.imageUrl} style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => handleShowModal(product)} />
                  <Card.Body className="d-flex flex-column pt-3 px-3 pb-4">
                    <Card.Title as="h6" className="fw-bold text-dark mb-1 text-truncate" style={{ cursor: 'pointer' }} onClick={() => handleShowModal(product)}>{product.nama}</Card.Title>
                    <Card.Text className="text-dark fw-bold fs-5 mb-3">Rp {product.harga.toLocaleString('id-ID')}</Card.Text>
                    <Button variant="primary" className="w-100 mt-auto rounded-3 btn-add-to-cart" onClick={() => handleShowModal(product)}><i className="bi bi-cart-plus"></i> Tambah</Button>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* 4. JASA KAMI (CAROUSEL) */}
      <Container as="section" className="py-5" id="jasa"> 
        <h3 className="fw-bold mb-5 text-dark">Jasa Kami</h3>
        {loading ? <div className="text-center"><Spinner animation="border"/></div> : (
          <Carousel className="service-carousel shadow-lg rounded-4 overflow-hidden" interval={3000} indicators={true} controls={true} pause="hover">
            {services.map((service) => (
              <Carousel.Item key={service._id} style={{ height: '500px' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img className="d-block w-100 h-100" src={service.imageUrl} alt={service.nama} style={{ objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' }}>
                        <h2 className="fw-bold display-5 mb-3 text-white">{service.nama}</h2>
                        <p className="fs-5 d-none d-md-block mb-4 text-white-50" style={{ maxWidth: '700px' }}>{service.deskripsi || 'Layanan servis terbaik.'}</p>
                        <Button variant="primary" size="lg" className="rounded-pill px-4 btn-service-wa fw-bold" onClick={() => handleServiceChat(service)}>
                            <MessageCircle size={24} className="me-2"/> Hubungi Kami Sekarang
                        </Button>
                    </div>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        )}
      </Container>

      {/* FOOTER AREA */}
      <Container as="section" className="py-5 bg-light">
        <div className="about-us-panel">
          <Row className="align-items-center g-custom-20">
            <Col md={6}>
              <h2 className="fw-bold mb-4 text-dark" style={{ fontSize: '2.5rem' }}>Apa itu Ponti Jaya Motor?</h2>
              <p className="fs-5 text-secondary">Toko sparepart daerah jakarta barat dengan jasa service yang memuaskan.</p>
            </Col>
            <Col md={6}><Image src="/images/hero/bengkel.jpg" fluid className="rounded-3" /></Col>
          </Row>
        </div>
      </Container>
      
      <Container as="section" className="py-5" id="hubungi"> 
        <Row className="align-items-center g-custom-20">
          <Col md={6}><Image src="/images/kontak/hubungi.jpeg" fluid className="rounded-3" /></Col>
          <Col md={6} className="ps-md-5">
            <h2 className="fw-bold mb-3 text-dark" style={{ fontSize: '2.5rem' }}>Hubungi Kami</h2>
            <div className="d-flex flex-wrap gap-3">
              <Button variant="primary" className="btn-contact-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank"><i className="bi bi-whatsapp"></i> WhatsApp</Button>
              <Button variant="primary" className="btn-contact-email" href={mailtoUrl}><i className="bi bi-envelope-fill"></i> Email</Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* MODAL PRODUK */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="border-0">{selectedProduct && <Modal.Title as="h3" className="fw-bold text-dark">{selectedProduct.nama}</Modal.Title>}</Modal.Header>
        <Modal.Body className="p-4 pt-0">
          {selectedProduct && (
            <Row className="g-custom-20">
              <Col md={7}><Image src={selectedProduct.imageUrl} fluid rounded /></Col>
              <Col md={5}>
                <p className="text-secondary small">{selectedProduct.deskripsi}</p>
                <div className="d-flex justify-content-between align-items-center mt-3 mb-3">
                    <Button variant="link" onClick={handleQuantityDecrease}>-</Button>
                    <span className="fw-bold">{quantity}</span>
                    <Button variant="link" onClick={handleQuantityIncrease}>+</Button>
                </div>
                <span className="fw-bold text-dark fs-5 d-block mb-3">Rp {subtotal.toLocaleString('id-ID')}</span>
                {modalMessage && <Alert variant="danger" className="py-2 small">{modalMessage.text}</Alert>}
                <div className="d-flex flex-column gap-2">
                  <Button variant="primary" className="w-100" onClick={handleAddToCart} disabled={isSubmitting}>{isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "+ Keranjang"}</Button>
                  
                  <Button variant="outline-primary" className="w-100" onClick={handleBeliLangsung}><Zap size={18} className="me-2" /> Beli Langsung</Button>
                  
                  <Button variant="outline-secondary" className="w-100" onClick={handleChatToko}><MessageCircle size={18} className="me-2" /> Chat Toko</Button>
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

      <Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} centered backdrop="static">
        <Modal.Body className="text-center p-4">
          <div className="mb-3 text-warning d-flex justify-content-center"><div className="bg-warning bg-opacity-10 p-3 rounded-circle"><AlertTriangle size={48} /></div></div>
          <h4 className="fw-bold text-dark mb-2">Toko Sedang Tutup</h4>
          <p className="text-muted mb-4">Terima kasih sudah memesan! Namun, mohon maaf saat ini toko sedang tutup. <span className="fw-bold text-dark">Pengiriman akan kami proses segera setelah toko buka kembali.</span></p>
          <div className="d-flex gap-2 justify-content-center">
            <Button variant="light" className="flex-fill fw-bold rounded-pill" onClick={() => setShowWarningModal(false)}>Batal</Button>
            <Button variant="primary" className="flex-fill fw-bold rounded-pill" style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }} onClick={proceedToCheckout}><Truck size={18} className="me-2" /> Lanjut Beli</Button>
          </div>
        </Modal.Body>
      </Modal>
    </main>
  );
}