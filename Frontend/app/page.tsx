// app/page.tsx
'use client';

// 1. Import komponen dari react-bootstrap DAN hook dari React
import { Container, Row, Col, Button, Image, Card, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Definisikan Tipe untuk produk dari backend
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
}

// Daftar NAMA produk yang ingin Anda tampilkan di "Paling di Cari"
const featuredProductNames = [
  "Veleg",
  "Selang Rem",
  "Kampas Rem",
  "Seal Lahar Bambu",
  "Klahar Roda",
  "Tabung Central",
  "Veleg"
];

// Daftar NAMA produk untuk "Produk Terlaris"
const bestSellingProductNames = [
  "Master Rem",
  "Kampas Rem", 
  "Klahar Roda",
  "Master Central",
  "Tabung Central",
];

// MASIH DATA DUMMY
const services = [
  { name: "Servis Rem", img: "/images/jasa/servis rem.jpg" },
  { name: "Ganti Sparepart", img: "/images/jasa/ganti sparepart.jpg" },
  { name: "Ganti Oli", img: "/images/jasa/ganti oli.jpg" },
];


// KOMPONEN UTAMA

export default function Home() {

  // State untuk menyimpan data yang sudah difilter
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LOGIKA FETCH
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/spareparts');
        if (!response.ok) {
          throw new Error('Gagal mengambil data dari server');
        }
        const data = await response.json();

        if (data.success) {
          const allProducts: Product[] = data.data;

          const filteredFeatured = allProducts.filter(product =>
            featuredProductNames.includes(product.nama)
          );
          setFeaturedProducts(filteredFeatured);

          const filteredBestSelling = allProducts.filter(product =>
            bestSellingProductNames.includes(product.nama)
          );
          setBestSellingProducts(filteredBestSelling);

        } else {
          throw new Error(data.message || 'Gagal memuat data');
        }
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);


  return (
    <main style={{ backgroundColor: "#fff" }}>
      
      {/* === 1. HERO SECTION === */}
      <div
        id="hero" // ID untuk scroll-to
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

      {/* === 2. PRODUK YANG PALING DI CARI-CARI === */}
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
            <Col key={product._id} className="text-center">
              <Link href="#" className="text-decoration-none">
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
              </Link>
            </Col>
          ))}
        </Row>
      </Container>

      
      {/* === 3. PRODUK TERLARIS === */}
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
                  style={{ height: '150px', objectFit: 'cover' }}
                />
                <Card.Body
                  className="d-flex flex-column pt-3 px-3 pb-4"
                >
                  <Card.Title as="h5" className="fw-bold text-dark mb-1">
                    {product.nama}
                  </Card.Title>
                  <Card.Text className="text-dark fw-bold fs-5 mb-3">
                    {product.harga.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0 
                    })}
                  </Card.Text>
                  
                  <Button
                    variant="primary"
                    className="w-100 mt-auto rounded-3 btn-add-to-cart"
                  >
                    <i className="bi bi-cart-plus"></i>
                    Tambah
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      
      {/* === 4. JASA KAMI (Masih Dummy) === */}
      <Container as="section" className="py-5" id="jasa"> {/* ID untuk scroll-to */}
        <h3 className="fw-bold mb-5 text-dark">Jasa Kami</h3>
        
        <Row className="g-custom-20 row-cols-1 row-cols-md-3">
          {services.map((service, index) => (
            <Col key={index} className="mb-4">
              <Card className="text-white border-0 rounded-3 overflow-hidden">
                <Card.Img
                  src={service.img}
                  alt={service.name}
                  style={{ height: '250px', objectFit: 'cover' }}
                />
                <Card.ImgOverlay
                  className="d-flex flex-column justify-content-end align-items-start pb-4 ps-4"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <Card.Title as="h2" className="fw-bold mb-3">
                    {service.name}
                  </Card.Title>
                  
                  <Button
                    variant="primary"
                    className="rounded-3 btn-service-wa"
                  >
                    <i className="bi bi-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                    Hubungi Kami
                  </Button>
                </Card.ImgOverlay>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
      
      {/* === 5. SECTION TENTANG KAMI === */}
      <Container as="section" className="py-5 bg-light">
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


      {/* === 6. SECTION HUBUNGI KAMI === */}
      <Container as="section" className="py-5" id="hubungi"> {/* ID untuk scroll-to */}
        <Row className="align-items-center g-custom-20">
          
          <Col md={6} className="mb-4 mb-md-0">
            <Image 
              src="/images/kontak/hubungi.jpeg" // Pastikan nama file ini benar
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
                href="#" // Ganti dengan link WA Anda
              >
                <i className="bi bi-whatsapp"></i>
                WhatsApp
              </Button>
              <Button 
                variant="primary" 
                className="btn-contact-email"
                href="#" // Ganti dengan link mailto: Anda
              >
                <i className="bi bi-envelope-fill"></i>
                Email
              </Button>
            </div>
          </Col>
          
        </Row>
      </Container>

    </main>
  );
}