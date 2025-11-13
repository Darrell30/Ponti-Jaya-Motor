// app/produk/page.tsx
'use client';

// 1. Import komponen
import { Container, Row, Col, Button, Image, Card, Spinner, Form, InputGroup, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
// NavbarProdukGuest TIDAK diimpor di sini, LayoutRenderer yang mengaturnya

// Definisikan Tipe untuk produk dari backend
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
}

// KOMPONEN UTAMA
export default function ProdukPage() {

  // State Halaman
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === State Modal ===
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1); // State untuk jumlah di modal

  // LOGIKA FETCH DATA
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/spareparts');
        if (!response.ok) throw new Error('Gagal mengambil data');
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
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

  // === Handlers Modal ===
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  const handleShowModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1); 
    setShowModal(true);
  };

  const handleQuantityDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };
  
  const handleQuantityIncrease = () => {
    if (selectedProduct && selectedProduct.stok) {
      setQuantity((prev) => (prev < selectedProduct.stok! ? prev + 1 : prev));
    } else {
      setQuantity((prev) => prev + 1);
    }
  };

  const subtotal = selectedProduct ? selectedProduct.harga * quantity : 0;

  // Style khusus untuk menyamakan tinggi tombol di modal (48px)
  const buttonStyle = {
    height: '48px',
    fontSize: '1.1rem',
    fontWeight: 'bold' as const, // Casting tipe agar TypeScript tidak komplain
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };


  return (
    <>
      {/* Konten Halaman Produk */}
      <Container className="py-5">
        
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" />
          </div>
        )}
        {error && <p className="text-danger text-center py-5">Error: {error}</p>}

        {/* Product Grid */}
        <Row className="g-custom-20 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-5">
          {!loading && !error && products.map((product) => (
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
                      {/* Tombol ini membuka modal */}
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
        </Row>
      </Container>


      {/* ================================== */}
      {/* === MODAL DETAIL PRODUK === */}
      {/* ================================== */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        
        <Modal.Header closeButton className="border-0">
          {selectedProduct && (
            <Modal.Title as="h3" className="fw-bold text-dark">
              {selectedProduct.nama}
            </Modal.Title>
          )}
        </Modal.Header>

        <Modal.Body className="p-4 pt-0">
          
          {selectedProduct && (
            <Row className="g-custom-20">
              
              {/* Kolom Kiri: Gambar */}
              <Col md={7}>
                <Image 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.nama} 
                  fluid 
                  rounded 
                />
              </Col>

              {/* Kolom Kanan: Info */}
              <Col md={5}>
                <p className="text-secondary small">
                  {selectedProduct.deskripsi || 'As Ayun Bajaj adalah pin poros utama di sistem suspensi depan yang memungkinkan roda depan bergerak bebas secara vertikal (mengayun) saat melewati gundukan atau jalan tidak rata, menjaga stabilitas dan kenyamanan kendaraan.'}
                </p>
                
                {/* Kotak "Atur Jumlah" */}
                <div className="quantity-box border rounded-3 p-3 my-4">
                  <h6 className="fw-bold text-dark">Atur Jumlah</h6>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    
                    {/* Quantity Counter */}
                    <div className="d-flex align-items-center border rounded-3 bg-white">
                      <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityIncrease}>+</Button>
                      <Form.Control 
                        type="number" 
                        className="quantity-input-modal shadow-none" 
                        value={quantity}
                        readOnly
                      />
                      <Button variant="link" className="btn-modal-quantity" onClick={handleQuantityDecrease}>-</Button>
                    </div>

                    <span className="text-secondary small">Stok: <strong className="text-dark">{selectedProduct.stok || '50'}</strong></span>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-secondary fs-5">Subtotal</span>
                  <span className="fw-bold text-dark fs-5">
                    {subtotal.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                  </span>
                </div>

                {/* ===================================
                  === TOMBOL AKSI (DIPERBARUI) ===
                  ===================================
                */}
                <div className="d-flex flex-column gap-2">
                  
                  {/* Tombol 1: Tambah ke Keranjang (Biru Solid) */}
                  {/* Tombol ini menggunakan class .btn-add-to-cart dari globals.css (height: 48px) */}
                  <Button 
                    variant="primary" 
                    className="w-100 rounded-3 btn-add-to-cart"
                  >
                    <i className="bi bi-cart-plus me-2"></i>+ Keranjang
                  </Button>
                  
                  {/* Tombol 2: Cek Out / Beli Langsung (Outline Biru) */}
                  {/* Tombol ini menggunakan 'buttonStyle' agar tingginya sama (48px) */}
                  <Button 
                    variant="outline-primary" 
                    className="w-100 rounded-3"
                    style={buttonStyle}
                    // onClick={...} (Tambahkan fungsi checkout Anda di sini nanti)
                  >
                    Beli Langsung
                  </Button>

                  {/* Tombol 3: Chat Toko (Outline Abu-abu) */}
                  <Button 
                    variant="outline-secondary" 
                    className="w-100 rounded-3"
                    style={buttonStyle}
                  >
                    <i className="bi bi-chat-dots me-2"></i>Chat Toko
                  </Button>

                </div>
                {/* =================================== */}

              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}