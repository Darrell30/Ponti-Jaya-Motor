// app/components/NavbarUser.tsx
'use client';

// 1. Impor komponen Modal, Button, dan Form dari react-bootstrap
import { Navbar, Nav, Container, NavDropdown, Modal, Button, Form } from 'react-bootstrap';
import Link from 'next/link';
import { useState, useEffect } from 'react';
// Impor ikon untuk field
import { User, Phone, Home as HomeIcon } from 'lucide-react';

function NavbarUser() {
  // State untuk nama di Navbar (dari langkah sebelumnya)
  const [userName, setUserName] = useState("Memuat...");

  // --- STATE BARU UNTUK MODAL PROFIL ---
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // --- STATE BARU UNTUK FIELD DI DALAM MODAL ---
  const [nama, setNama] = useState("");
  const [telpon, setTelpon] = useState("");
  const [alamat, setAlamat] = useState("");

  // State untuk proses simpan
  const [isSaving, setIsSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // --- EFEK UNTUK MEMUAT DATA USER ---
  useEffect(() => {
    // Efek ini akan memuat data saat komponen pertama kali di-render
    loadUserDataFromStorage();
  }, []); // [] = jalankan sekali

  // Fungsi untuk memuat data dari localStorage
  const loadUserDataFromStorage = () => {
    if (typeof window !== 'undefined') {
      const userInfoString = localStorage.getItem("userInfo");
      
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        
        // 1. Set nama di Navbar
        setUserName(userInfo.username || "User");
        
        // 2. Set field untuk form di modal
        setNama(userInfo.username || "User");
        setTelpon(userInfo.telpon || ""); // (Akan kosong jika belum ada)
        setAlamat(userInfo.alamat || ""); // (Akan kosong jika belum ada)
        
      } else {
        setUserName("User");
        setNama("User");
      }
    }
  };

  // --- FUNGSI UNTUK MENGONTROL MODAL ---
  const handleShowProfileModal = () => {
    // Panggil fungsi load lagi untuk memastikan data form adalah yang terbaru
    loadUserDataFromStorage(); 
    setModalMessage(""); // Bersihkan pesan error/sukses sebelumnya
    setShowProfileModal(true);
  };
  
  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  // --- FUNGSI UNTUK SIMPAN PERUBAHAN ---
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setModalMessage("Menyimpan...");

    // Simulasi proses simpan ke backend
    // (Nanti, di sini Anda perlu memanggil API 'PUT /api/users/update')
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    try {
      // --- LOGIKA SEMENTARA: Simpan ke localStorage ---
      // (Ini agar datanya tidak hilang saat di-refresh,
      //  sampai Anda siap membuat API backend-nya)
      const userInfoString = localStorage.getItem("userInfo");
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        
        // Update data di objek
        userInfo.username = nama;
        userInfo.telpon = telpon;
        userInfo.alamat = alamat;
        
        // Simpan kembali ke localStorage
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        // Update juga nama di Navbar secara langsung
        setUserName(nama);
      }
      
      setModalMessage("Data berhasil disimpan!");
      
      // Tutup modal setelah 1 detik
      setTimeout(() => {
        handleCloseProfileModal();
      }, 1000);

    } catch (error) {
      setModalMessage("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Gunakan Fragment (<>) agar bisa me-return Navbar dan Modal
    <>
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
                {/* *** PERUBAHAN UTAMA DI SINI ***
                  Ubah NavDropdown.Item dari 'Link' menjadi 'Button' (onClick)
                */}
                <NavDropdown.Item 
                  onClick={handleShowProfileModal} 
                  className="dropdown-user-item"
                >
                  {userName}
                </NavDropdown.Item>
                {/* *** AKHIR PERUBAHAN *** */}

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

      {/* *** KODE MODAL BARU ***
        Modal ini akan tampil saat 'showProfileModal' bernilai true
      */}
      <Modal show={showProfileModal} onHide={handleCloseProfileModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">Edit Profil Saya</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                <User size={16} /> Nama Pengguna (Username)
              </Form.Label>
              <Form.Control 
                type="text" 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
                disabled={isSaving}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                <Phone size={16} /> Nomor Telepon
              </Form.Label>
              <Form.Control 
                type="tel" 
                placeholder="Misal: 081234567890" 
                value={telpon} 
                onChange={(e) => setTelpon(e.target.value)} 
                disabled={isSaving}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted d-flex align-items-center gap-2">
                <HomeIcon size={16} /> Alamat Pengiriman
              </Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Masukkan alamat lengkap Anda..." 
                value={alamat} 
                onChange={(e) => setAlamat(e.target.value)} 
                disabled={isSaving}
              />
            </Form.Group>
          </Form>
          {/* Tampilkan pesan status saat menyimpan */}
          {modalMessage && (
            <div className={`text-muted small mt-3 ${isSaving ? '' : 'text-success'}`}>
              {modalMessage}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleCloseProfileModal} disabled={isSaving}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveChanges} disabled={isSaving} className="fw-bold">
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default NavbarUser;