// app/produk/page.tsx
'use client';

// 1. Import komponen baru: Modal
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

  // === State Modal (BARU) ===
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

  // === Handlers Modal (BARU) ===
  
  // Fungsi untuk menutup modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null); // Bersihkan produk yang dipilih
  };

  // Fungsi untuk membuka modal dan mengatur produk
  const handleShowModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1); // Selalu reset jumlah ke 1 saat modal baru dibuka
    setShowModal(true);
  };

  // Fungsi untuk counter di modal
  const handleQuantityDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1)); // Tidak boleh kurang dari 1
  };
  
  const handleQuantityIncrease = () => {
    // Cek stok jika ada
    if (selectedProduct && selectedProduct.stok) {
      setQuantity((prev) => (prev < selectedProduct.stok! ? prev + 1 : prev));
    } else {
      setQuantity((prev) => prev + 1); // Jika tidak ada info stok, biarkan nambah
    }
  };

  // Kalkulasi subtotal dinamis
  const subtotal = selectedProduct ? selectedProduct.harga * quantity : 0;


  return (
    <>
      {/* NavbarProdukGuest dipanggil oleh LayoutRenderer, bukan di sini */}

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
                      {/* REVISI: Tombol ini sekarang membuka modal */}
                      <Button
                        variant="primary"
                        className="btn-cart-icon"
                        onClick={() => handleShowModal(product)} // <-- UBAH DI SINI
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
      {/* === MODAL DETAIL PRODUK (BARU) === */}
      {/* ================================== */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          {/* Header kosong, hanya tombol close */}
        </Modal.Header>
        <Modal.Body className="p-4 pt-0">
          
          {/* Cek jika ada produk yang dipilih */}
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
                <h3 className="fw-bold text-dark">{selectedProduct.nama}</h3>
                <p className="text-secondary small">
                  {/* Tampilkan deskripsi jika ada, jika tidak, tampilkan fallback */}
                  {selectedProduct.deskripsi || 'As Ayun Bajaj adalah pin poros utama di sistem suspensi depan yang memungkinkan roda depan bergerak bebas secara vertikal (mengayun) saat melewati gundukan atau jalan tidak rata, menjaga stabilitas dan kenyamanan kendaraan.'}
                </p>
                
                {/* Kotak "Atur Jumlah" */}
                <div className="quantity-box border rounded-3 p-3 my-4">
                  <h6 className="fw-bold text-dark">Atur Jumlah</h6>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    
                    {/* Quantity Counter (Sesuai Figma: + di kiri, - di kanan) */}
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

                    {/* Stok */}
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

                {/* Tombol Aksi */}
                <Button variant="primary" className="w-100 fw-bold py-2 mb-2 btn-add-to-cart">
                  <i className="bi bi-cart-plus me-2"></i>+ Keranjang
                </Button>
                <Button variant="outline-primary" className="w-100 fw-bold py-2">
                  Chat Toko
                </Button>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}