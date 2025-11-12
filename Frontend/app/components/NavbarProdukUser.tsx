// app/components/NavbarProdukUser.tsx
'use client';

import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';

export default function NavbarProdukUser() {
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
              <InputGroup.Text className="border-0 bg-white">
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                className="border-0"
                placeholder="Cari di Ponti Jaya Motor"
                style={{ boxShadow: 'none' }}
              />
            </InputGroup>
          </Col>

          {/* --- INI PERUBAHANNYA --- */}
          <Col md={4} className="d-flex justify-content-end gap-2">
            <Button 
              variant="primary" 
              className="fw-bold" 
              href="/keranjang" 
              as={Link}
              style={{ padding: '0.6rem 1.2rem' }}
            >
              <i className="bi bi-cart-fill me-2"></i>
              Keranjang
            </Button>
          </Col>
          {/* --- AKHIR PERUBAHAN --- */}
          
        </Row>
      </Container>
    </div>
  );
}