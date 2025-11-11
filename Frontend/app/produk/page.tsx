// app/produk/page.tsx
'use client';

import { Container, Row, Col, Button, Image, Card, Spinner, Form, InputGroup } from 'react-bootstrap';
import { useState, useEffect } from 'react';
// HAPUS "import NavbarProdukGuest" DARI SINI

// ... (Interface Product Anda) ...
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
  deskripsi?: string;
}

export default function ProdukPage() {
  // ... (Semua state dan useEffect Anda biarkan seperti apa adanya) ...
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    // REVISI: Hapus <NavbarProdukGuest /> dari sini
    <>
      <Container className="py-5">
        
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" role="status" />
          </div>
        )}
        {error && <p className="text-danger text-center py-5">Error: {error}</p>}

        {/* REVISI: Hapus pt-5 dari Row ini, py-5 di Container sudah cukup */}
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
                      <Button variant="primary" className="btn-cart-icon">
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
    </>
  );
}