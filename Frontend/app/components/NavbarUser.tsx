// app/components/NavbarUser.tsx
'use client';

import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import Link from 'next/link';

function NavbarUser() {
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
            
            {/* --- INI PERUBAHANNYA --- */}
            <NavDropdown 
              // Tombol ikon profil biru
              title={
                <div 
                  className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                  style={{ width: '40px', height: '40px' }}
                >
                  <i className="bi bi-person-fill text-white fs-5"></i>
                </div>
              } 
              id="user-dropdown" 
              align="end"
              className="user-avatar-dropdown" // Class kustom (lihat CSS di bawah)
            >
              <NavDropdown.Item as={Link} href="/profil">Profil Saya</NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/pesanan">Riwayat Pesanan</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} href="/logout" className="text-danger fw-bold">
                Keluar
              </NavDropdown.Item>
            </NavDropdown>
            {/* --- AKHIR PERUBAHAN --- */}

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarUser;