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
      className="main-navbar"
    >
      <Container className="container-figma"> 
        {/* PERBAIKAN: Gunakan Link biasa */}
        <Link 
          href="/" 
          passHref 
          legacyBehavior
        >
          <Navbar.Brand 
            className="fw-bold"
            style={{ letterSpacing: '1px' }}
          >
            PONTI JAYA MOTOR
          </Navbar.Brand>
        </Link>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Link href="/#hero" className="nav-link mx-2">Home</Link>
            <Link href="/#jasa" className="nav-link mx-2">Jasa</Link>
            <Link href="/produk" className="nav-link mx-2">Produk</Link>
            <Link href="/#hubungi" className="nav-link mx-2">Hubungi Kami</Link>
            
            {/* PERBAIKAN: Bungkus Button di dalam Link */}
            <Link href="/login" passHref legacyBehavior>
              <Button 
                variant="primary" 
                className="ms-3"
              >
                Masuk
              </Button>
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarGuest;