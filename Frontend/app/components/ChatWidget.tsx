// app/components/ChatWidget.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Minimize2, MessageCircle, User } from "lucide-react";
import { Image } from "react-bootstrap";

interface Product {
  _id: string;
  nama: string;
  imageUrl: string;
  harga: number;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  productContext: Product | null; // Produk yang sedang ditanyakan
}

export default function ChatWidget({ isOpen, onClose, productContext }: ChatWidgetProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // State lokal untuk menyimpan produk context agar tidak hilang saat props berubah
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  // 1. Inisialisasi User & Produk
  useEffect(() => {
    if (isOpen) {
      const userStr = localStorage.getItem("userInfo");
      if (userStr) setUserInfo(JSON.parse(userStr));

      // Jika ada produk baru yang dikirim dari props, update state lokal
      if (productContext) {
        setCurrentProduct(productContext);
      }
    }
  }, [isOpen, productContext]);

  // 2. Polling Pesan
  useEffect(() => {
    if (!isOpen || !userInfo) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/history?userId=${userInfo.userId}`);
        const data = await res.json();
        if (data.success) setMessages(data.data);
      } catch (err) { console.error(err); }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [isOpen, userInfo]);

  // 3. Auto Scroll
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, currentProduct]);

  // 4. Kirim Pesan
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !userInfo) return;

    let finalMessage = inputText;

    if (currentProduct) {
      finalMessage = `#PRODUK#|${currentProduct.nama}|${currentProduct.harga}|${currentProduct.imageUrl}|${inputText}`;
      setCurrentProduct(null); 
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
    } catch (err) { console.error(err); }
  };

  const handleCancelProduct = () => setCurrentProduct(null);

  if (!isOpen) return null; 

  return (
    <div 
      className="position-fixed bottom-0 end-0 m-3 shadow-lg rounded-4 overflow-hidden bg-white d-flex flex-column border" 
      style={{ width: '350px', height: '500px', zIndex: 9999, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
    >
      {/* HEADER WIDGET */}
      <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
           <div 
             className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center"
             style={{ width: '40px', height: '40px', minWidth: '40px' }} // Ukuran Tetap
           >
             <User size={20}/>
           </div>
           
           <div style={{lineHeight: 1}}>
             <span className="fw-bold d-block" style={{fontSize: '14px'}}>Admin Ponti Jaya</span>
             <small style={{fontSize: '10px'}} className="opacity-75">● Online</small>
           </div>
        </div>
        <button onClick={onClose} className="btn btn-sm text-white p-0 hover-opacity">
          <Minimize2 size={20} />
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-grow-1 overflow-auto p-3" style={{ backgroundColor: "#eef2f5" }}>
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
                <div key={idx} className={`d-flex mb-2 ${isAdmin ? 'justify-content-start' : 'justify-content-end'}`}>
                  <div 
                      className={`p-2 shadow-sm ${isAdmin ? 'bg-white text-dark rounded-end-3 rounded-bottom-3' : 'bg-primary text-white rounded-start-3 rounded-top-3'}`}
                      style={{ maxWidth: '85%', fontSize: '13px', whiteSpace: 'pre-wrap' }}
                  >
                      {productData && (
                          <div className={`d-flex gap-2 mb-2 p-1 rounded-2 ${isAdmin ? 'bg-light border' : 'bg-white bg-opacity-25'}`}>
                              <img src={productData.image} style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}} />
                              <div style={{lineHeight: 1.1, overflow: 'hidden', minWidth: 0}}>
                                  <div className="fw-bold text-truncate" style={{fontSize: 11}}>{productData.nama}</div>
                                  <div style={{fontSize: 10, opacity: 0.9}}>Rp {parseInt(productData.harga).toLocaleString('id-ID')}</div>
                              </div>
                          </div>
                      )}
                      {displayMessage}
                  </div>
                </div>
            );
        })}
        <div ref={bottomRef} />
      </div>

      {/* PREVIEW PRODUK */}
      {currentProduct && (
        <div className="px-3 pt-2 pb-0 bg-white border-top">
            <div className="bg-light border rounded-3 p-2 position-relative d-flex align-items-center gap-2">
                <button onClick={handleCancelProduct} className="position-absolute top-0 end-0 btn btn-sm text-muted p-0 me-1 mt-1"><X size={14}/></button>
                <Image src={currentProduct.imageUrl} style={{width:'40px', height:'40px', objectFit:'cover', borderRadius: '4px'}} />
                <div className="flex-grow-1" style={{minWidth:0}}>
                    <small className="d-block text-muted" style={{fontSize: '9px'}}>Menanyakan:</small>
                    <div className="fw-bold text-truncate" style={{fontSize: '12px'}}>{currentProduct.nama}</div>
                </div>
            </div>
        </div>
      )}

      {/* INPUT */}
      <div className="p-2 border-top bg-white">
         <form onSubmit={handleSend} className="d-flex gap-2">
            <input 
                className="form-control form-control-sm rounded-pill bg-light border-0 px-3"
                placeholder="Tulis pesan..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={!userInfo}
            />
            <button type="submit" className="btn btn-primary btn-sm rounded-circle p-2" style={{backgroundColor: '#0d6efd'}} disabled={!userInfo}>
                <Send size={16} />
            </button>
         </form>
      </div>
    </div>
  );
}