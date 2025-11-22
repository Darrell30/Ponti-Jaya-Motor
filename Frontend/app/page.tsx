'use client';

import { 
  Container, Row, Col, Button, Image, Card, Spinner,
  Modal, Form, Alert, Toast, ToastContainer, Carousel 
} from 'react-bootstrap'; // TAMBAHAN: Import Carousel
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2, MessageCircle } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
// Pastikan path ini sesuai dengan struktur folder Anda
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

const featuredProductNames = [
  "Veleg", "Selang Rem", "Kampas Rem", "Seal Lahar Bambu", "Klahar Roda", "Tabung Central", "Veleg"
];

const bestSellingProductNames = [
  "Master Rem", "Kampas Rem", "Klahar Roda", "Master Central", "Tabung Central",
];

export default function Home() {
  const router = useRouter();

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [chatProduct, setChatProduct] = useState<Product | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const whatsappNumber = "6281297575567";
  const shopEmail = "edward.stiawan06@gmail.com"; 
  const emailSubject = "Pertanyaan Mengenai Ponti Jaya Motor";
  
  const mailtoUrl = `mailto:${shopEmail}?subject=${encodeURIComponent(emailSubject)}`;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [sparepartRes, serviceRes] = await Promise.all([
          fetch('http://localhost:5000/api/spareparts'),
          fetch('http://localhost:5000/api/services') 
        ]);

        if (!sparepartRes.ok || !serviceRes.ok) {
          throw new Error('Gagal mengambil data dari server');
        }

        const sparepartData = await sparepartRes.json();
        const serviceData = await serviceRes.json(); 

        if (sparepartData.success) {
          const allProducts: Product[] = sparepartData.data.map((p: Product) => ({
            ...p,
            kategori: p.nama.includes('Jasa') ? 'Jasa' : 'Sparepart' 
          })) as Product[];
          
          const filteredFeatured = allProducts.filter(product =>
            featuredProductNames.includes(product.nama)
          );
          setFeaturedProducts(filteredFeatured);

          const filteredBestSelling = allProducts.filter(product =>
            bestSellingProductNames.includes(product.nama)
          );
          setBestSellingProducts(filteredBestSelling);
        } else {
          throw new Error(sparepartData.message || 'Gagal memuat data sparepart');
        }

        // === PERUBAHAN DISINI: MENGAMBIL SEMUA DATA JASA (HAPUS SLICE) ===
        if (serviceData.success) {
          setServices(serviceData.data); // Tampilkan SEMUA jasa yang ada di DB
        } else {
          throw new Error(serviceData.message || 'Gagal memuat data jasa');
        }

      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false); 
      }
    };

    fetchAllData();
  }, [router]); 

  const handleServiceChat = (service: Service) => {
    const userInfoString = localStorage.getItem("userInfo");
    
    if (!userInfoString) {
      alert("Silakan login terlebih dahulu untuk bertanya tentang jasa.");
      router.push('/login');
      return;
    }

    const serviceAsProduct: Product = {
      _id: service._id,
      nama: service.nama,
      imageUrl: service.imageUrl,
      harga: service.harga,
      stok: 1, 
      deskripsi: service.deskripsi,
      kategori: 'Jasa'
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

  const buttonStyle = {
    height: '48px',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const, 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const handleAddToCart = async () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return; 
    }

    setIsSubmitting(true);
    setModalMessage(null);
    
    const userInfo = JSON.parse(userInfoString);
    const userId = userInfo.userId;
    if (!selectedProduct) {
      setModalMessage({ type: 'error', text: 'Produk tidak ditemukan.' });
      setIsSubmitting(false);
      return;
    }
    const cartItemData = {
      userId: userId, 
      productId: selectedProduct._id,
      name: selectedProduct.nama, 
      price: selectedProduct.harga,
      image: selectedProduct.imageUrl, 
      itemType: selectedProduct.kategori === 'Jasa' ? 'Service' : 'Sparepart', 
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
  
  const handleBeliLangsung = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return; 
    }
    alert('Fitur "Beli Langsung" sedang dalam pengembangan.');
  };
  
  const handleChatToko = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); 
      return; 
    }
    handleCloseModal();
    
    if (selectedProduct) {
        setChatProduct(selectedProduct);
        setIsChatOpen(true);
    } else {
        alert('Produk tidak valid');
    }
  };


  return (
    <main style={{ backgroundColor: "#fff" }}>
      
      {/* === 1. HERO SECTION === */}
      <div
        id="hero"
        className="text-center text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/images/hero/bengkel.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          paddingTop: '6rem',
          paddingBottom: '6rem',
        }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <h1 className="fw-bold display-4 mb-3">Ponti Jaya Motor</h1>
              <p className="fs-5 mb-4">
                Website untuk melihat katalog produk berupa sparepart kendaraan roda tiga, juga menyediakan jasa servis.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <Link href="/produk" passHref legacyBehavior>
                  <Button size="lg" className="px-4 fw-bold rounded-3 btn-hero-primary">
                    Lihat Katalog
                  </Button>
                </Link>
                <Link href="/#jasa" passHref legacyBehavior>
                  <Button size="lg" className="px-4 fw-bold rounded-3 btn-hero-secondary">
                    Jasa Servis
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      
      {/* === 2. PRODUK DI CARI === */}
      <Container as="section" className="py-5">
        <h3 className="fw-bold mb-5 text-dark">Produk Yang Paling di Cari-Cari</h3>
        
        {loading && (
          <div className="text-center">
            <Spinner animation="border" role="status" />
          </div>
        )}
        {error && <p className="text-danger text-center">Error: {error}</p>}

        <Row className="g-custom-20 row-cols-1 row-cols-sm-2 row-cols-md-4 row-cols-lg-6 justify-content-center">
          {!loading && !error && featuredProducts.map((product) => (
            <Col 
              key={product._id} 
              className="text-center"
              onClick={() => handleShowModal(product)} 
              style={{ cursor: 'pointer' }} 
            >
              <Image
                src={product.imageUrl}
                alt={product.nama}
                roundedCircle
                className="shadow-sm mb-3"
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover'
                }}
              />
              <h6 className="fw-bold text-dark">{product.nama}</h6>
            </Col>
          ))}
        </Row>
      </Container>

      {/* === 3. PRODUK TERLARIS === */}
      <Container as="section" className="py-5 bg-light">
        <h3 className="fw-bold mb-5 text-dark">Produk Terlaris</h3>
        {loading && <div className="text-center"><Spinner animation="border" /></div>}
        
        <Row className="g-custom-20 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {!loading && !error && bestSellingProducts.map((product) => (
            <Col key={product._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                <Card.Img
                  variant="top"
                  src={product.imageUrl}
                  alt={product.nama}    
                  style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => handleShowModal(product)} 
                />
                <Card.Body className="d-flex flex-column pt-3 px-3 pb-4">
                  <Card.Title as="h5" className="fw-bold text-dark mb-1" style={{ cursor: 'pointer' }} onClick={() => handleShowModal(product)}>
                    {product.nama}
                  </Card.Title>
                  <Card.Text className="text-dark fw-bold fs-5 mb-3">
                    {product.harga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </Card.Text>
                  <Button variant="primary" className="w-100 mt-auto rounded-3 btn-add-to-cart" onClick={() => handleShowModal(product)}>
                    <i className="bi bi-cart-plus"></i> Tambah
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* === 4. JASA KAMI (MODIFIKASI: CAROUSEL/SLIDER) === */}
      <Container as="section" className="py-5" id="jasa"> 
        <h3 className="fw-bold mb-5 text-dark">Jasa Kami</h3>
        
        {loading && <div className="text-center"><Spinner animation="border" /></div>}
        {error && <p className="text-danger text-center">{error}</p>}
        
        {!loading && !error && services.length > 0 && (
          <Carousel 
            className="service-carousel shadow-lg rounded-4 overflow-hidden" 
            interval={3000} // Geser otomatis setiap 3 detik
            indicators={true}
            controls={true}
          >
            {services.map((service) => (
              <Carousel.Item key={service._id} style={{ height: '500px' }}>
                {/* Gambar Background */}
                <img
                  className="d-block w-100 h-100"
                  src={service.imageUrl}
                  alt={service.nama}
                  style={{ objectFit: 'cover' }}
                />
                
                {/* Overlay Gelap & Teks */}
                <div 
                  className="carousel-caption d-flex flex-column align-items-center justify-content-center"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Overlay hitam transparan
                    top: 0, bottom: 0, left: 0, right: 0 // Full cover
                  }}
                >
                  <h2 className="fw-bold display-5 mb-3 text-white">{service.nama}</h2>
                  <p className="fs-5 d-none d-md-block mb-4" style={{ maxWidth: '600px' }}>
                    {service.deskripsi || 'Layanan servis terbaik untuk kendaraan roda tiga Anda.'}
                  </p>
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="rounded-pill px-4 btn-service-wa fw-bold" 
                    onClick={() => handleServiceChat(service)}
                  >
                    <MessageCircle size={24} className="me-2"/> 
                    Hubungi Kami Sekarang
                  </Button>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        )}
      </Container>

      {/* === 5. TENTANG KAMI === */}
      <Container as="section" className="py-5 bg-light">
        <div className="about-us-panel">
          <Row className="align-items-center g-custom-20">
            <Col md={6} className="mb-4 mb-md-0">
              <h2 className="fw-bold mb-4 text-dark" style={{ fontSize: '2.5rem' }}>Apa itu Ponti Jaya Motor?</h2>
              <p className="fs-5 text-secondary" style={{ lineHeight: '1.6' }}>
                Toko sparepart daerah jakarta barat dengan jasa service yang memuaskan terutama dalam pengelolaan service bajaj disertai dengan kelengkapan produk di dalam toko.
              </p>
            </Col>
            <Col md={6}>
              <Image src="/images/hero/bengkel.jpg" alt="Tentang Ponti Jaya Motor" fluid className="rounded-3" />
            </Col>
          </Row>
        </div>
      </Container>
      
      {/* === 6. HUBUNGI KAMI === */}
      <Container as="section" className="py-5" id="hubungi"> 
        <Row className="align-items-center g-custom-20">
          <Col md={6} className="mb-4 mb-md-0">
             <Image src="/images/kontak/hubungi.jpeg" alt="Hubungi Kami" fluid className="rounded-3" />
          </Col>
          <Col md={6} className="ps-md-5">
            <h2 className="fw-bold mb-3 text-dark" style={{ fontSize: '2.5rem' }}>
              Hubungi Kami
            </h2>
            <p className="fs-5 text-secondary mb-4" style={{ lineHeight: '1.6' }}>
              Jika ada pertanyaan mengenai sparepart atau jasa, silahkan hubungi kami.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Button 
                variant="primary" 
                className="btn-contact-whatsapp"
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-whatsapp"></i> WhatsApp
              </Button>
              <Button variant="primary" className="btn-contact-email" href={mailtoUrl}>
                <i className="bi bi-envelope-fill"></i> Email
              </Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* === MODAL PRODUK === */}
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
                  <Button variant="outline-primary" className="w-100 rounded-3" style={buttonStyle} disabled={isSubmitting} onClick={handleBeliLangsung}>
                    Beli Langsung
                  </Button>
                  <Button variant="outline-secondary" className="w-100 rounded-3" style={buttonStyle} disabled={isSubmitting} onClick={handleChatToko}>
                    <i className="bi bi-chat-dots me-2"></i>Chat Toko
                  </Button>
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

      <ChatWidget 
        productContext={chatProduct} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
      
    </main>
  );
}