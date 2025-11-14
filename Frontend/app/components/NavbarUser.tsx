// app/components/NavbarUser.tsx
'use client';

import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import Link from 'next/link';
// 1. Impor useState dan useEffect dari React
import { useState, useEffect } from 'react';

function NavbarUser() {
  // 2. Ganti const statis dengan useState
  //    "Memuat..." akan tampil singkat sebelum nama asli muncul
  const [userName, setUserName] = useState("Memuat...");

  // 3. Gunakan useEffect untuk membaca localStorage setelah komponen dimuat
  useEffect(() => {
    // Pastikan kode ini hanya berjalan di sisi client (browser)
    if (typeof window !== 'undefined') {
      
      // Ambil data user yang Anda simpan saat login
      const userInfoString = localStorage.getItem("userInfo");
      
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        
        // Cek apakah data username ada, lalu update state
        if (userInfo && userInfo.username) {
          setUserName(userInfo.username);
        } else {
          setUserName("User"); // Fallback jika tidak ada nama
        }
      } else {
        // Fallback jika tidak ada data userInfo (seharusnya tidak terjadi jika sudah login)
        setUserName("User");
      }
    }
  }, []); // [] berarti efek ini hanya berjalan sekali saat komponen dimuat

  return (
    <Navbar 
      bg="dark" 
      variant="dark" 
      expand="lg" 
      sticky="top"
      className="main-navbar"
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
            
            <NavDropdown 
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
              className="user-avatar-dropdown"
              menuVariant="dark" 
            >
              {/* 4. Tampilkan nama dari state di sini */}
              <NavDropdown.Item as={Link} href="/profil" className="dropdown-user-item">
                {userName}
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/pembelian" className="dropdown-user-item">
                Pembelian
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/keranjang" className="dropdown-user-item">
                Keranjang
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} href="/logout" className="dropdown-user-logout">
                Keluar
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarUser;