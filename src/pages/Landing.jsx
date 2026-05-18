import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

// Vite'in base URL'sini alarak deploy ortamlarında (örn. GitHub Pages) yol bozulmalarını önlüyoruz
const baseUrl = import.meta.env.BASE_URL || '/';
const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

// Dinamik olarak 1'den 50'ye kadar yerel resim adaylarını farklı uzantılarla üretiyoruz
const generateCandidates = () => {
  const candidates = [];
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'JPG', 'JPEG', 'PNG', 'WEBP'];
  for (let i = 1; i <= 50; i++) {
    for (const ext of extensions) {
      candidates.push({
        slot: i,
        path: `${cleanBaseUrl}/images/klinik${i}.${ext}`
      });
    }
  }
  return candidates;
};

const LOCAL_CANDIDATES = generateCandidates();

// Görsel bulunamazsa devreye girecek 5 adet premium yedek klinik görseli
const FALLBACK_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1512223792601-592a9809eed4?auto=format&fit=crop&w=1600&q=80'
];

// Alt Bileşen: Saf Opacity Cross-Fade Modeli (Üst düzey donanım hızlandırmalı geçiş)
const GridSlot = ({ src }) => {
    const [imgA, setImgA] = useState(src);
    const [imgB, setImgB] = useState(src);
    const [activeLayer, setActiveLayer] = useState('A');
    const prevSrcRef = useRef(src);

    useEffect(() => {
        // Resim değiştiğinde pürüzsüz cross-fade geçişini başlat
        if (src === prevSrcRef.current) return;
        
        if (activeLayer === 'A') {
            setImgB(src);
            setActiveLayer('B');
        } else {
            setImgA(src);
            setActiveLayer('A');
        }
        
        prevSrcRef.current = src;
    }, [src, activeLayer]);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-2xl border border-white/10 shadow-lg bg-rose-950">
            {/* Katman A (Layer A) */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out scale-100"
                style={{ 
                    backgroundImage: `url(${imgA})`,
                    opacity: activeLayer === 'A' ? 1 : 0
                }}
            />
            {/* Katman B (Layer B) */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out"
                style={{ 
                    backgroundImage: `url(${imgB})`,
                    opacity: activeLayer === 'B' ? 1 : 0
                }}
            />
        </div>
    );
};

export default function Landing() {
    const [validImages, setValidImages] = useState([]);
    const [visibleImages, setVisibleImages] = useState([]);

    useEffect(() => {
        // Kullanıcının yüklediği yerel resimleri paralel ve ultra hızlı bir şekilde denetle
        const detectAvailableImages = async () => {
            const checks = LOCAL_CANDIDATES.map(cand => {
                return new Promise((resolve) => {
                    const img = new Image();
                    const timer = setTimeout(() => resolve(null), 1000);
                    
                    img.onload = () => {
                        clearTimeout(timer);
                        resolve({ slot: cand.slot, path: cand.path });
                    };
                    img.onerror = () => {
                        clearTimeout(timer);
                        resolve(null);
                    };
                    img.src = cand.path;
                });
            });

            const results = await Promise.all(checks);
            
            const slotMap = {};
            for (const res of results) {
                if (res && !slotMap[res.slot]) {
                    slotMap[res.slot] = res.path;
                }
            }

            const detectedPaths = Object.values(slotMap);

            if (detectedPaths.length > 0) {
                setValidImages(detectedPaths);
            } else {
                setValidImages(FALLBACK_BACKGROUNDS);
            }
        };

        detectAvailableImages();
    }, []);

    // Merkezi Senkronizasyon Zamanlayıcısı: Karelerde asla aynı görselin aynı anda görünmemesini garanti eder
    useEffect(() => {
        if (validImages.length === 0) return;

        // İlk 6 görseli benzersiz şekilde yerleştir
        const initial = [];
        for (let i = 0; i < 6; i++) {
            initial.push(validImages[i % validImages.length]);
        }
        setVisibleImages(initial);

        if (validImages.length <= 1) return;

        let nextPoolIndex = 6 % validImages.length;
        let nextSlotIndex = 0;

        // Her 5 saniyede sadece 1 kareyi pürüzsüzce değiştir (Mükemmel sakinlik ve koreografi)
        const intervalId = setInterval(() => {
            setVisibleImages(prev => {
                const nextImages = [...prev];
                let candidate = validImages[nextPoolIndex];

                if (validImages.length > 6) {
                    // Eğer havuzda yeterince benzersiz resim varsa, ekrandaki diğer 5 resimle asla çakışmamasını sağla
                    let attempts = 0;
                    while (nextImages.includes(candidate) && attempts < validImages.length) {
                        nextPoolIndex = (nextPoolIndex + 1) % validImages.length;
                        candidate = validImages[nextPoolIndex];
                        attempts++;
                    }
                } else {
                    // Havuz küçükse sadece kendi karesindeki bir önceki resimle aynı olmamasını sağla
                    let attempts = 0;
                    while (nextImages[nextSlotIndex] === candidate && attempts < validImages.length) {
                        nextPoolIndex = (nextPoolIndex + 1) % validImages.length;
                        candidate = validImages[nextPoolIndex];
                        attempts++;
                    }
                }

                nextImages[nextSlotIndex] = candidate;

                // İndeksleri birer adım ileri kaydır
                nextSlotIndex = (nextSlotIndex + 1) % 6;
                nextPoolIndex = (nextPoolIndex + 1) % validImages.length;

                return nextImages;
            });
        }, 5000);

        return () => clearInterval(intervalId);
    }, [validImages]);

    return (
        <div className="login-container">
            {/* 1. Canlı, Eşsiz ve Senkronize Mozaik Arka Plan Grid Sistemi */}
            <div className="mosaic-grid">
                {visibleImages.map((src, i) => (
                    <GridSlot 
                        key={`slot-${i}`} 
                        src={src} 
                    />
                ))}
            </div>

            {/* 2. Karartma ve Premium Cam Efekti overlay */}
            <div className="bg-overlay"></div>

            {/* 3. Giriş / Karşılama Kartı */}
            <div className="login-card-wrapper px-4">
                <div 
                    className="backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md text-center border border-slate-200/50 relative z-10 hover:shadow-red-500/5 transition-all duration-300"
                    style={{ backgroundColor: 'rgba(247, 245, 240, 0.96)' }}
                >
                    <div className="flex justify-center mb-6">
                        {/* Premium Kırmızı Halka ve Gri Diş Sembolü */}
                        <div 
                            className="p-3 border-[4px] border-red-500 rounded-full shadow-lg flex items-center justify-center animate-pulse"
                            style={{ backgroundColor: '#f7f5f0' }}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-slate-400">
                                <path 
                                    d="M12 4C9.5 2 7.5 3 6.5 5.5C5.5 7.5 6.5 11 6.5 13C6.5 15.5 5.5 18 5.5 20.5C5.5 21.5 6.2 22 7.2 22C8.5 22 9.5 20.5 10.5 19.5C11 19 11.5 19 12 19C12.5 19 13 19 13.5 19.5C14.5 20.5 15.5 22 16.8 22C17.8 22 18.5 21.5 18.5 20.5C18.5 18 17.5 15.5 17.5 13C17.5 11 18.5 7.5 17.5 5.5C16.5 3 14.5 2 12 4Z" 
                                    fill="#f1f5f9" 
                                />
                                <path d="M12 4V19" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-800 mb-6 tracking-tight">
                        Dental Diagnostik Asistanı
                    </h1>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {/* Kırmızı çerçeve, içi beyaz ve gölgeli premium butonlar */}
                        <Link
                            to="/kayit"
                            className="flex-1 bg-white hover:bg-red-50/50 text-black border-2 border-red-500 font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-md shadow-red-100 hover:shadow-red-200 active:scale-95 text-center"
                        >
                            Kayıt Ol
                        </Link>
                        <Link
                            to="/giris"
                            className="flex-1 bg-white hover:bg-red-50/50 text-black border-2 border-red-500 font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-md shadow-red-100 hover:shadow-red-200 active:scale-95 text-center"
                        >
                            Giriş Yap
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
