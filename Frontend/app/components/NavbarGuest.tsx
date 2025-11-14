// app/components/NavbarGuest.tsx
'use client';

import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import Link from 'next/link';

function NavbarGuest() {
  return (
    <Navbar 
      bg="dark" 
      variant="dark" 
      expand="lg" 
      sticky="top"
      className="main-navbar" // <-- TAMBAHKAN CLASS INI
    >
      <Container className="container-figma"> 
        <Navbar.Brand 
          as={Link} 
          href="/" 
          className="fw-bold"
          style={{ letterSpacing: '1px' }}
        >
          PONTI JAYA MOTOR
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Link href="/#hero" className="nav-link mx-2">Home</Link>
            <Link href="/#jasa" className="nav-link mx-2">Jasa</Link>
            <Link href="/produk" className="nav-link mx-2">Produk</Link>
            <Link href="/#hubungi" className="nav-link mx-2">Hubungi Kami</Link>
            <Button 
              as={Link} 
              href="/login" 
              variant="primary" 
              className="ms-3"
            >
              Masuk
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarGuest;