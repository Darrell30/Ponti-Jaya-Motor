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
      // Asumsi font Roboto sudah di-apply di layout.tsx (Opsi 1)
    >
      <Container className='container-figma'>
        {/* Brand/Logo di Kiri */}
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
          {/* Navigasi Link & Tombol di Kanan */}
          <Nav className="ms-auto align-items-center">
            <Link href="/" className="nav-link mx-2">Home</Link>
            <Link href="/jasa" className="nav-link mx-2">Jasa</Link>
            <Link href="/sparepart" className="nav-link mx-2">Sparepart</Link>
            <Link href="/kontak" className="nav-link mx-2">Hubungi Kami</Link>
            <Button 
              as={Link} // 'as={Link}' di Button biasanya aman dari error TS
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