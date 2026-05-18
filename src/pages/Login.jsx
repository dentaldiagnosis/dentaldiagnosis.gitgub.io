import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, ArrowLeft } from 'lucide-react';
import './Landing.css'; // Mozaik arka plan stillerini paylaşıyoruz

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

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const [error, setError] = useState('');
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

        // Her 5 saniyede sadece 1 kareyi pürüzsüzce değiştir
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(formData.identifier, formData.password);

            if (user.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            if (err.message === 'USER_AUTO_DELETED') {
                // Silent redirect to register
                navigate('/kayit', { state: { phone: formData.identifier, autoDeleted: true } });
            } else {
                setError(err.message);
            }
        }
    };

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

            {/* 2. Karartma Perdesi */}
            <div className="bg-overlay"></div>

            {/* 3. Giriş Kartı */}
            <div className="login-card-wrapper px-4">
                <div 
                    className="backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/50 relative z-10 hover:shadow-red-500/5 transition-all duration-300"
                    style={{ backgroundColor: 'rgba(247, 245, 240, 0.96)' }}
                >
                    <div className="flex items-center mb-6">
                        <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h2 className="text-2xl font-bold text-slate-800 ml-4">Giriş Yap</h2>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kullanıcı Adı</label>
                            <input
                                required
                                type="text"
                                name="identifier"
                                value={formData.identifier}
                                onChange={handleChange}
                                placeholder="Örn: 20260501"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                            <input
                                required
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>

                        <div className="flex justify-end">
                            <Link to="/sifre-unuttum" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                Şifremi Unuttum
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 mt-6 flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-5 h-5" />
                            Giriş Yap
                        </button>
                    </form>
                    <div className="mt-4 text-center text-xs text-slate-400">
                        v1.1
                    </div>
                </div>
            </div>
        </div>
    );
}
