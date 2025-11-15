// app/page.tsx
'use client';

// 1. MODIFIKASI: Tambahkan import untuk Modal, Form, Toast, Alert, dan Loader2
import { 
  Container, Row, Col, Button, Image, Card, Spinner,
  Modal, Form, Alert, Toast, ToastContainer 
} from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; // <-- Baru
// === BARU: Impor useRouter untuk redirect ===
import { useRouter } from 'next/navigation';
// ==========================================

// === TIPE DATA ===
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
  kategori?: 'Sparepart' | 'Jasa' | 'Ori' | 'KW'; // <-- Tambahkan 'kategori'
}

// TIPE BARU UNTUK JASA
interface Service {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  deskripsi?: string;
}

// === DAFTAR FILTER NAMA (Tidak Berubah) ===
const featuredProductNames = [
  "Veleg",
  "Selang Rem",
  "Kampas Rem",
  "Seal Lahar Bambu",
  "Klahar Roda",
  "Tabung Central",
  "Veleg"
];

const bestSellingProductNames = [
  "Master Rem",
  "Kampas Rem", 
  "Klahar Roda",
  "Master Central",
  "Tabung Central",
];

// === KOMPONEN UTAMA ===

export default function Home() {
  // === BARU: Inisialisasi router ===
  const router = useRouter();
  // =================================

  // === STATE (DIPERBARUI) ===
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]); // <-- STATE BARU UNTUK JASA
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === BARU: State Modal (Disalin dari produk/page.tsx) ===
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  // ========================================================

  const whatsappNumber = "6281297575567";
  const shopEmail = "edward.stiawan06@gmail.com"; // <-- Diambil dari .env
  const emailSubject = "Pertanyaan Mengenai Ponti Jaya Motor";
  // Membuat link mailto dinamis
  const mailtoUrl = `mailto:${shopEmail}?subject=${encodeURIComponent(emailSubject)}`;
  // =============================================

  // === LOGIKA FETCH (DIPERBARUI) ===
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Kita akan mengambil data sparepart DAN service secara bersamaan
        const [sparepartRes, serviceRes] = await Promise.all([
          fetch('http://localhost:5000/api/spareparts'),
          fetch('http://localhost:5000/api/services') // <-- PANGGILAN API BARU
        ]);

        if (!sparepartRes.ok || !serviceRes.ok) {
          throw new Error('Gagal mengambil data dari server');
        }

        const sparepartData = await sparepartRes.json();
        const serviceData = await serviceRes.json(); // <-- DATA BARU

        // Proses data sparepart (seperti sebelumnya)
        if (sparepartData.success) {
          // MODIFIKASI: Tambahkan 'kategori' agar modal berfungsi
          const allProducts: Product[] = sparepartData.data.map((p: Product) => ({
            ...p,
            // (Logika kategori ini disalin dari produk/page.tsx)
            kategori: p.nama.includes('Jasa') ? 'Jasa' : 'Sparepart' 
          }));
          
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

        // Proses data jasa
        if (serviceData.success) {
          // Ambil 3 jasa pertama saja, sesuai permintaan Anda
          setServices(serviceData.data.slice(0, 3)); // <-- SET STATE BARU
        } else {
          throw new Error(serviceData.message || 'Gagal memuat data jasa');
        }

      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false); // Set loading false HANYA setelah semua data selesai
      }
    };

    fetchAllData();
  }, [router]); // [] diubah menjadi [router] untuk memastikan router ter-inisialisasi

  // === BARU: Handlers Modal (Disalin dari produk/page.tsx) ===
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

  // Style (disalin dari produk/page.tsx)
  const buttonStyle = {
    height: '48px',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const, 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // === FUNGSI "+ KERANJANG" (MODIFIKASI) ===
  const handleAddToCart = async () => {
    // --- MODIFIKASI: Cek login dan redirect ---
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); // Alihkan ke halaman login
      return; 
    }
    // --- AKHIR MODIFIKASI ---

    // Jika sudah login, lanjutkan...
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
  
  // === BARU: Handler untuk tombol "Beli Langsung" ===
  const handleBeliLangsung = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); // Alihkan ke halaman login
      return; 
    }
    // Jika sudah login, lanjutkan ke fitur Beli Langsung
    // (Tambahkan logika Beli Langsung di sini nanti)
    alert('Fitur "Beli Langsung" sedang dalam pengembangan.');
  };
  
  // === BARU: Handler untuk tombol "Chat Toko" ===
  const handleChatToko = () => {
    const userInfoString = localStorage.getItem("userInfo");
    if (!userInfoString) {
      router.push('/login'); // Alihkan ke halaman login
      return; 
    }
    // Jika sudah login, lanjutkan ke fitur Chat Toko
    // (Tambahkan logika Chat Toko di sini nanti, misal: buka WA)
    alert('Fitur "Chat Toko" sedang dalam pengembangan.');
  };
  // ========================================================


  return (
    // Pastikan Navbar dipanggil di sini jika belum ada
    <main style={{ backgroundColor: "#fff" }}>
      
      {/* === 1. HERO SECTION (Tidak Berubah) === */}
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
                  <Button
                    size="lg"
                    className="px-4 fw-bold rounded-3 btn-hero-primary"
                  >
                    Lihat Katalog
                  </Button>
                </Link>
                <Link href="/#jasa" passHref legacyBehavior>
                  <Button
                    size="lg"
                    className="px-4 fw-bold rounded-3 btn-hero-secondary"
                  >
                    Jasa Servis
                  </Button>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* === 2. PRODUK YANG PALING DI CARI-CARI (MODIFIKASI) === */}
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
            // --- MODIFIKASI: Hapus <Link> dan tambahkan onClick ke <Col> ---
            <Col 
              key={product._id} 
              className="text-center"
              onClick={() => handleShowModal(product)} // <-- Panggil modal
              style={{ cursor: 'pointer' }} // <-- Ubah kursor
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
            // --- AKHIR MODIFIKASI ---
          ))}
        </Row>
      </Container>

      
      {/* === 3. PRODUK TERLARIS (MODIFIKASI) === */}
      <Container as="section" className="py-5 bg-light">
        <h3 className="fw-bold mb-5 text-dark">Produk Terlaris</h3>
        
        {loading && (
          <div className="text-center">
            <Spinner animation="border" role="status" />
          </div>
        )}
        {error && <p className="text-danger text-center">Error: {error}</p>}
        
        <Row className="g-custom-20 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {!loading && !error && bestSellingProducts.map((product) => (
            <Col key={product._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0 rounded-3 overflow-hidden">
                <Card.Img
                  variant="top"
                  src={product.imageUrl}
                  alt={product.nama}    
                  style={{ height: '150px', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => handleShowModal(product)} // <-- Klik gambar
                />
                <Card.Body
                  className="d-flex flex-column pt-3 px-3 pb-4"
                >
                  <Card.Title 
                    as="h5" 
                    className="fw-bold text-dark mb-1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleShowModal(product)} // <-- Klik nama
                  >
                    {product.nama}
                  </Card.Title>
                  <Card.Text className="text-dark fw-bold fs-5 mb-3">
                    {product.harga.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0 
                    })}
                  </Card.Text>
                  
                  {/* --- MODIFIKASI: Tambahkan onClick ke Tombol --- */}
                  <Button
                    variant="primary"
                    className="w-100 mt-auto rounded-3 btn-add-to-cart"
                    onClick={() => handleShowModal(product)} // <-- Panggil modal
                  >
                    <i className="bi bi-cart-plus"></i>
                    Tambah
                  </Button>
                  {/* --- AKHIR MODIFIKASI --- */}

                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      
      {/* === 4. JASA KAMI (Tidak Berubah) === */}
      <Container as="section" className="py-5" id="jasa"> 
        {/* ... (kode Jasa Kami Anda tetap sama) ... */}
        <h3 className="fw-bold mb-5 text-dark">Jasa Kami</h3>
        <Row className="g-custom-20 row-cols-1 row-cols-md-3">
          {!loading && !error && services.map((service) => {
            const message = encodeURIComponent(
              `Halo, saya ingin bertanya tentang jasa: ${service.nama}`
            );
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

            return (
              <Col key={service._id} className="mb-4">
                <Card className="text-white border-0 rounded-3 overflow-hidden">
                  <Card.Img
                    src={service.imageUrl}
                    alt={service.nama}
                    style={{ height: '250px', objectFit: 'cover' }}
                  />
                  <Card.ImgOverlay
                    className="d-flex flex-column justify-content-end align-items-start pb-4 ps-4"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <Card.Title as="h2" className="fw-bold mb-3">
                      {service.nama}
                    </Card.Title>
                    <Button
                      variant="primary"
                      className="rounded-3 btn-service-wa"
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="bi bi-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                      Hubungi Kami
                    </Button>
                  </Card.ImgOverlay>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
      
      {/* === 5. SECTION TENTANG KAMI (Tidak Berubah) === */}
      <Container as="section" className="py-5 bg-light">
        {/* ... (kode Tentang Kami Anda tetap sama) ... */}
        <div className="about-us-panel">
          <Row className="align-items-center g-custom-20">
            <Col md={6} className="mb-4 mb-md-0">
              <h2 className="fw-bold mb-4 text-dark" style={{ fontSize: '2.5rem' }}>
                Apa itu Ponti Jaya Motor?
              </h2>
              <p className="fs-5 text-secondary" style={{ lineHeight: '1.6' }}>
                Toko sparepart daerah jakarta barat dengan jasa service yang memuaskan terutama dalam pengelolaan service bajaj disertai dengan kelengkapan produk di dalam toko.
              </p>
            </Col>
            <Col md={6}>
              <Image 
                src="/images/hero/bengkel.jpg"
                alt="Tentang Ponti Jaya Motor"
                fluid
                className="rounded-3"
              />
            </Col>
          </Row>
        </div>
      </Container>


      {/* === 6. SECTION HUBUNGI KAMI (Tidak Berubah) === */}
      <Container as="section" className="py-5" id="hubungi"> 
        {/* ... (kode Hubungi Kami Anda tetap sama) ... */}
        <Row className="align-items-center g-custom-20">
          <Col md={6} className="mb-4 mb-md-0">
            <Image 
              src="/images/kontak/hubungi.jpeg"
              alt="Hubungi Kami"
              fluid
              className="rounded-3"
            />
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
                <i className="bi bi-whatsapp"></i>
                WhatsApp
              </Button>
              <Button 
                variant="primary" 
                className="btn-contact-email"
                href={mailtoUrl}
              >
                <i className="bi bi-envelope-fill"></i>
                Email
              </Button>
            </div>
          </Col>
        </Row>
      </Container>

      {/* === BARU: JSX Modal & Toast (MODIFIKASI PADA TOMBOL) === */}
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
                
                {/* --- MODIFIKASI: Tambahkan onClick ke semua tombol --- */}
                <div className="d-flex flex-column gap-2">
                  <Button 
                    variant="primary" 
                    className="w-100 rounded-3 btn-add-to-cart" 
                    onClick={handleAddToCart} // <-- Handler sudah ada
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <><i className="bi bi-cart-plus me-2"></i>+ Keranjang</>}
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    className="w-100 rounded-3" 
                    style={buttonStyle} 
                    disabled={isSubmitting}
                    onClick={handleBeliLangsung} // <-- Handler BARU
                  >
                    Beli Langsung
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100 rounded-3" 
                    style={buttonStyle} 
                    disabled={isSubmitting}
                    onClick={handleChatToko} // <-- Handler BARU
                  >
                    <i className="bi bi-chat-dots me-2"></i>Chat Toko
                  </Button>
                </div>
                {/* --- AKHIR MODIFIKASI --- */}
                
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
      {/* ======================================================== */}
    </main>
  );
}