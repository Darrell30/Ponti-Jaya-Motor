// app/components/NavbarProdukGuest.tsx
'use client';

import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NavbarProdukGuest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
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
            <Link href="/" passHref legacyBehavior className="navbar-brand-link">
              <h5 className="fw-bold text-dark mb-0">PONTI JAYA MOTOR</h5>
            </Link>
          </Col>

          {/* Kolom 2: Search Bar */}
          <Col md={5}>
            <InputGroup className="search-input-group">
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </InputGroup>
          </Col>

          {/* Kolom 3: Tombol */}
          <Col md={4} className="d-flex justify-content-end gap-2">
            <Link href="/login" passHref legacyBehavior>
              <Button variant="outline-primary" className="fw-bold">Masuk</Button>
            </Link>
            <Link href="/daftar" passHref legacyBehavior>
              <Button variant="primary" className="fw-bold">Daftar</Button>
            </Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
}