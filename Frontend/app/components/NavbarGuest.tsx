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
    >
      <Container className="container-figma"> 
        <Navbar.Brand 
          as={Link} 
          href="/" // Link logo biarkan ke "/"
          className="fw-bold"
          style={{ letterSpacing: '1px' }}
        >
          PONTI JAYA MOTOR
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            
            {/* --- INI PERUBAHANNYA --- */}
            <Link href="/#hero" className="nav-link mx-2">Home</Link>
            <Link href="/#jasa" className="nav-link mx-2">Jasa</Link>
            
            {/* Link "Sparepart" biarkan, karena ini halaman terpisah */}
            <Link href="/produk" className="nav-link mx-2">Produk</Link> 
            
            <Link href="/#hubungi" className="nav-link mx-2">Hubungi Kami</Link>
            {/* --- AKHIR PERUBAHAN --- */}

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