// app/page.tsx
'use client';

// 1. Import komponen dari react-bootstrap DAN hook dari React
import { Container, Row, Col, Button, Image, Card, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from "../app/components/Navbar";


// Definisikan Tipe untuk produk dari backend
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number; // Dibuat wajib, karena "Terlaris" membutuhkannya
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
  "Tabung Central"
];

// Daftar NAMA produk untuk "Produk Terlaris"
const bestSellingProductNames = [
  "Master Rem",
  "Kampas Rem", 
  "Klahar Roda",
  "Master Central",
  "Selang Rem",
];

//MASIH DATA DUMMY
const services = [
  { name: "Servis Rutin", img: "/images/jasa/servis-rutin.jpg" },
  { name: "Ganti Sparepart", img: "/images/jasa/ganti-sparepart.jpg" },
  { name: "Turun Mesin", img: "/images/jasa/turun-mesin.jpg" },
];


// KOMPONEN UTAM

export default function Home() {

  // State untuk menyimpan data yang sudah difilter
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]); // <-- STATE BARU
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // LOGIKA FETCH (Diperbarui untuk 2 section)
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

          // 1. Filter untuk "Paling di Cari"
          const filteredFeatured = allProducts.filter(product =>
            featuredProductNames.includes(product.nama)
          );
          setFeaturedProducts(filteredFeatured);

          // 2. Filter untuk "Produk Terlaris"
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
  }, []); // [] artinya useEffect ini hanya berjalan sekali


  return (
    <main style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      
      {/* Navbar */}
      <Navbar />

      {/* === 1. HERO SECTION (Gabungan) === */}
      <div
        className="text-center text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/bengkel.jpg')`,
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
                <Button
                  as={Link}
                  href="/sparepart"
                  size="lg"
                  className="px-4 fw-bold rounded-3"
                  variant="primary"
                  style={{backgroundColor: '#0d6efd', border: 'none'}}
                >
                  Lihat Katalog
                </Button>
                <Button
                  as={Link}
                  href="/jasa"
                  size="lg"
                  variant="light"
                  className="px-4 fw-bold rounded-3 text-primary"
                >
                  Jasa Servis
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* === 2. PRODUK YANG PALING DI CARI-CARI (Terkoneksi Backend) === */}
      <Container as="section" className="py-5">
        <h3 className="fw-bold mb-5 text-dark">Produk Yang Paling di Cari-Cari</h3>
        
        {loading && (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading produk...</span>
            </Spinner>
          </div>
        )}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {/* Menggunakan layout dari kode baru Anda (roundedCircle) */}
        <Row className="g-4 row-cols-1 row-cols-sm-2 row-cols-md-4 row-cols-lg-6 justify-content-center">
          {!loading && !error && featuredProducts.map((product) => (
            <Col key={product._id} className="text-center">
              <Link href="#" className="text-decoration-none">
                <Image
                  src={product.imageUrl} // <-- Data Asli
                  alt={product.nama}      // <-- Data Asli
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

      
      {/* === 3. PRODUK TERLARIS (Terkoneksi Backend) === */}
      <Container as="section" className="py-5 bg-light">
        <h3 className="fw-bold mb-5 text-dark">Produk Terlaris</h3>
        
        {loading && (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading produk...</span>
            </Spinner>
          </div>
        )}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        <Row className="g-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {/* Menggunakan data dari state bestSellingProducts */}
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
                    {product.nama} {/* <-- Data Asli */}
                  </Card.Title>
                  <Card.Text className="text-dark fw-bold fs-5 mb-3">
                    {/* Format harga dari Angka (DB) ke Rupiah (Tampilan) */}
                    {product.harga.toLocaleString('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0 
                    })}
                  </Card.Text>
                  
                  <Button
                    variant="primary"
                    className="w-100 mt-auto rounded-3"
                  >
                    {/* <i className="bi bi-cart-plus"></i> */}
                    Tambah
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      
      {/*4. JASA KAMI (Masih Dummy) */}
      <Container as="section" className="py-5">
        <h3 className="fw-bold mb-5 text-dark">Jasa Kami</h3>
        
        <Row className="g-4 row-cols-1 row-cols-md-3">
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
                    className="rounded-3"
                  >
                    {/* <i className="bi bi-whatsapp" style={{ fontSize: '1.2rem' }}></i> */}
                    Hubungi Kami
                  </Button>
                </Card.ImgOverlay>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

    </main>
  );
}