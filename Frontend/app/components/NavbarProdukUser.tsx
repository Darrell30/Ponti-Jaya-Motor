// app/components/NavbarProdukUser.tsx
'use client';

import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react'; // [cite: 3]
import { useRouter, useSearchParams } from 'next/navigation'; // Import navigasi

export default function NavbarProdukUser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Fungsi untuk menangani pencarian
  const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    // Redirect ke halaman produk dengan query param
    router.push(`/produk?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="sticky-product-header">
      <Container>
        <Row className="align-items-center g-custom-20">
          
          <Col md={3}>
            <Link href="/" passHref legacyBehavior>
              <h5 className="fw-bold text-dark mb-0 navbar-brand-link">
                PONTI JAYA MOTOR
              </h5>
            </Link>
          </Col>

          <Col md={5}>
            <InputGroup className="search-input-group">
              {/* Tambahkan onClick pada icon search */}
              <InputGroup.Text 
                className="border-0 bg-white" 
                style={{ cursor: 'pointer' }}
                onClick={handleSearch}
              >
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                className="border-0"
                placeholder="Cari di Ponti Jaya Motor"
                style={{ boxShadow: 'none' }}
                // Binding value ke state
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </InputGroup>
          </Col>

          <Col md={4} className="d-flex justify-content-end gap-2">
            <Link href="/keranjang" passHref legacyBehavior>
              <Button 
                variant="primary" 
                className="fw-bold" 
                style={{ padding: '0.6rem 1.2rem' }}
              >
                <ShoppingCart size={20} className="me-2" />
                Keranjang
              </Button>
            </Link>
          </Col>
          
        </Row>
      </Container>
    </div>
  );
}