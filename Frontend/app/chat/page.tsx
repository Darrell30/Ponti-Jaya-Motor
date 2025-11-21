// app/chat/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, ArrowLeft, User, X } from "lucide-react";
import { Container, Card, Form, Button, Spinner, Row, Col, Image } from "react-bootstrap";

// Tipe data Produk
interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
  stok?: number;
}

export default function UserChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [productContext, setProductContext] = useState<Product | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0); 

  // 1. Cek Login & Cek Konteks
  useEffect(() => {
    const userStr = localStorage.getItem("userInfo");
    if (!userStr) {
        alert("Silakan login dulu untuk chat.");
        router.push("/login");
        return;
    }
    setUserInfo(JSON.parse(userStr));
    setLoading(false);

    const productCtxStr = localStorage.getItem("chat_product_context");
    if (productCtxStr) {
        setProductContext(JSON.parse(productCtxStr));
    }
  }, [router]);

  // 2. Fetch Pesan
  const fetchMessages = async () => {
    if (!userInfo) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/history?userId=${userInfo.userId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (err) { 
      console.error("Gagal ambil pesan:", err); 
    }
  };

  useEffect(() => {
    if (userInfo) {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        return () => clearInterval(interval);
    }
  }, [userInfo]);

  // Auto scroll pintar
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        lastMessageCount.current = messages.length;
    } else if (productContext) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, productContext]);

  // 3. Kirim Pesan
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !userInfo) return;

    let finalMessage = inputText;

    if (productContext) {
      finalMessage = `#PRODUK#|${productContext.nama}|${productContext.harga}|${productContext.imageUrl}|${inputText}`;
      setProductContext(null);
      localStorage.removeItem("chat_product_context");
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          senderId: userInfo.userId,
          senderName: userInfo.username,
          receiverId: 'admin',
          text: finalMessage,
          isFromAdmin: false
        })
      });
      setInputText("");
      fetchMessages();
    } catch (err) { 
      console.error("Gagal kirim:", err); 
    }
  };
  
  const handleCancelContext = () => {
    setProductContext(null);
    localStorage.removeItem("chat_product_context");
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }} className="d-flex align-items-center justify-content-center py-4">
      <Container style={{ maxWidth: "500px" }}>
        
        <Card className="shadow-lg border-0 rounded-4 overflow-hidden" style={{ height: "80vh", display: 'flex', flexDirection: 'column' }}>
          <div className="bg-white border-bottom p-3 d-flex align-items-center gap-3 sticky-top" style={{ zIndex: 10 }}>
            <Link href="/produk" className="text-dark text-decoration-none d-flex align-items-center">
              <ArrowLeft />
            </Link>
            
            <div 
                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-primary"
                style={{ width: '50px', height: '50px', minWidth: '50px' }}
            >
                <User size={24} />
            </div>

            <div>
              <h6 className="fw-bold mb-0 text-dark">Admin Ponti Jaya Motor</h6>
              <small className="text-success fw-bold" style={{ fontSize: '12px' }}>● Online</small>
            </div>
          </div>

          {/* BODY CHAT */}
          <div className="card-body overflow-auto p-3" style={{ backgroundColor: "#eef2f5", flexGrow: 1 }}>
             
             {messages.length === 0 && !productContext && (
                 <div className="text-center mt-5">
                     <p className="text-muted small bg-white d-inline-block px-3 py-1 rounded-pill shadow-sm">
                        👋 Halo! Ada yang bisa kami bantu?
                     </p>
                 </div>
             )}

             {messages.map((msg, idx) => {
               const isAdmin = msg.isFromAdmin;
               const isProductMsg = msg.text.startsWith("#PRODUK#|");
               let productData = null;
               let displayMessage = msg.text;

               if (isProductMsg) {
                   const parts = msg.text.split("|");
                   if (parts.length >= 5) {
                       productData = { nama: parts[1], harga: parts[2], image: parts[3] };
                       displayMessage = parts.slice(4).join("|");
                   }
               }

               return (
                 <div key={idx} className={`d-flex mb-3 ${isAdmin ? 'justify-content-start' : 'justify-content-end'}`}>
                    <div 
                      className={`p-3 shadow-sm ${isAdmin ? 'bg-white text-dark rounded-end-4 rounded-bottom-4' : 'bg-primary text-white rounded-start-4 rounded-top-4'}`}
                      style={{ maxWidth: '85%', borderRadius: '15px', fontSize: '15px', whiteSpace: 'pre-wrap' }}
                    >
                       {productData && (
                           <div className={`d-flex gap-2 mb-2 p-2 rounded-3 ${isAdmin ? 'bg-light border' : 'bg-white bg-opacity-25'}`}>
                               <img 
                                 src={productData.image} 
                                 style={{width: 50, height: 50, objectFit: 'cover', borderRadius: 6, backgroundColor: '#fff'}} 
                               />
                               <div style={{lineHeight: 1.2, overflow: 'hidden', minWidth: 0}}>
                                   <div className="fw-bold text-truncate" style={{fontSize: 13}}>{productData.nama}</div>
                                   <div style={{fontSize: 12, opacity: 0.9}}>Rp {parseInt(productData.harga).toLocaleString('id-ID')}</div>
                               </div>
                           </div>
                       )}
                       {displayMessage}
                       <div className={`text-end mt-1 ${isAdmin ? 'text-muted' : 'text-white-50'}`} style={{ fontSize: '10px' }}>
                         {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </div>
                    </div>
                 </div>
               );
             })}
             <div ref={bottomRef} />
          </div>

          {/* PREVIEW PRODUK */}
          {productContext && (
            <div className="px-3 pt-2 pb-0 bg-white border-top">
                <div className="bg-light border rounded-3 p-2 position-relative d-flex align-items-center gap-3">
                    <button onClick={handleCancelContext} className="position-absolute top-0 end-0 btn btn-sm text-muted p-1" style={{marginTop: '-5px', marginRight: '-5px'}}>
                        <X size={14} />
                    </button>
                    <div style={{width: '50px', height: '50px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden'}}>
                        <Image src={productContext.imageUrl} alt={productContext.nama} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    </div>
                    <div className="flex-grow-1" style={{minWidth: 0}}>
                        <p className="mb-0 small text-muted" style={{fontSize: '10px'}}>Menanyakan produk:</p>
                        <h6 className="mb-0 fw-bold text-dark text-truncate" style={{fontSize: '13px'}}>{productContext.nama}</h6>
                    </div>
                </div>
            </div>
          )}

          {/* INPUT */}
          <div className="bg-white p-3">
              <Form onSubmit={handleSend} className="d-flex gap-2">
                  <Form.Control 
                    type="text"
                    className="rounded-pill bg-light border-0 px-4"
                    placeholder={productContext ? "Tulis pertanyaan..." : "Tulis pesan..."}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="rounded-circle p-0 d-flex align-items-center justify-content-center" 
                    style={{ width: '40px', height: '40px', backgroundColor: '#0d6efd' }}
                  >
                      <Send size={18} />
                  </Button>
              </Form>
          </div>

        </Card>
      </Container>
    </div>
  );
}