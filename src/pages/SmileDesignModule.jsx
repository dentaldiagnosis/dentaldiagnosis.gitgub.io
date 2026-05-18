import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Group, Line, Circle } from 'react-konva';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Alt Bileşen: Seçilebilir ve Boyutlandırılabilir Diş Şablonu
// Alt Bileşen: Seçilebilir ve Boyutlandırılabilir Diş Şablonu (Gelişmiş Hizalama ve Maskeleme Sistemi)
const SmileTemplate = ({ imageObj, shapeProps, isSelected, onSelect, onChange, clipPoints, imageSize, isMaskActive }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Maskeleme aktif mi ve dudak noktaları mevcut mu kontrol et
  const shouldClip = isMaskActive && clipPoints && clipPoints.length >= 6;

  return (
    <React.Fragment>
      {/* Eğer maske aktifse ve nesne SEÇİLİ DEĞİLSE kırpılmış olarak göster; 
          eğer maske kapalıysa veya nesne SEÇİLİYSE (düzenleme modundaysa) dişleri TAM görünür, net ve kırpılmamış göster! */}
      {shouldClip && !isSelected ? (
        // 1. Kırpılmış Katman (Deseçiliyken dudak arkasına gizlenir, tıklanıp tekrar seçilebilir)
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.moveTo(clipPoints[0], clipPoints[1]);
            for (let i = 2; i < clipPoints.length; i += 2) {
              ctx.lineTo(clipPoints[i], clipPoints[i+1]);
            }
            ctx.closePath();
          }}
        >
          <KonvaImage
            image={imageObj}
            {...shapeProps}
            opacity={shapeProps.opacity || 0.9}
            onClick={onSelect}
            onTap={onSelect}
          />
        </Group>
      ) : (
        // 2. Tam Görünür Katman (Seçiliyken veya maske devre dışıyken dişlerin tamamını netlikte ve serbestçe gösterir)
        <KonvaImage
          image={imageObj}
          ref={shapeRef}
          {...shapeProps}
          opacity={shapeProps.opacity || 0.95} // Tam netlikte görünürlük
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => {
            onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={(e) => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            
            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
              rotation: node.rotation(),
            });
          }}
        />
      )}

      {/* 3. Boyutlandırma ve Kontrol Çerçevesi (Sadece seçiliyken görünür) */}
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-left',
            'middle-right',
            'bottom-left',
            'bottom-center',
            'bottom-right'
          ]}
          keepRatio={false} // Serbest esnetme
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const TEMPLATE_LIST = [
  'templates/dis1.png', 
  'templates/dis2.png',
  'templates/dis3.png',
  'templates/dis4.png',
  'templates/dis5.png',
  'templates/dis6.png'
];

const SmileDesignModule = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Admin Kilit State'leri
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [bgImage, setBgImage] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [templateProps, setTemplateProps] = useState(null);
  const [selectedId, selectShape] = useState(null);

  // Maskeleme (Dudak Sınırı) State'leri
  const [mouthPoints, setMouthPoints] = useState([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [isMaskActive, setIsMaskActive] = useState(true);
  const [isAILoading, setIsAILoading] = useState(false);

  // Yapay Zeka ile Otomatik Dudak Algılama (MediaPipe Face Landmarker)
  const detectMouthWithAI = async (imageElement, width, height) => {
    setIsAILoading(true);
    try {
      // 1. WASM Çözümleyici hazırlığı (Dış sunuculardan engellenmemek için LOKAL public/wasm dizininden yüklenir!)
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
      const wasmPath = `${window.location.origin}${cleanBaseUrl}wasm`;
      
      const vision = await FilesetResolver.forVisionTasks(wasmPath);
      
      // 2. Yüz haritalandırma modelini yüklüyoruz (CORS veya AdBlock engellerine karşı LOKAL model kullanılır!)
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${cleanBaseUrl}models/face_landmarker.task`,
          delegate: "CPU"
        },
        runningMode: "IMAGE",
        numFaces: 1
      });

      // 3. Resim üzerinde analizi başlat
      const results = faceLandmarker.detect(imageElement);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        
        // İç dudak sınırını çizen 20 kilit nokta (MediaPipe)
        const innerLipIndices = [
          78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, // Üst iç dudak
          324, 318, 402, 317, 14, 87, 178, 88, 95           // Alt iç dudak
        ];

        // 3D koordinatları (0-1 arası) tuvalimizin piksel boyutlarına uyarla
        const autoMouthPoints = [];
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        innerLipIndices.forEach(index => {
          const point = landmarks[index];
          const px = point.x * width;
          const py = point.y * height;
          autoMouthPoints.push(px); 
          autoMouthPoints.push(py);

          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        });

        // Dudak noktalarını maske dizisine ata
        setMouthPoints(autoMouthPoints);

        // OTOMATİK KONUMLANDIRMA VE ÖLÇEKLENDİRME:
        // Diş şablonunu ağız boşluğunun genişlik ve yüksekliğine göre mükemmel şekilde uyarla ve ortala!
        if (minX !== Infinity && maxX !== -Infinity) {
          const mouthW = maxX - minX;
          const mouthH = maxY - minY;
          
          // Diş şablonunu ağız sınırlarından biraz daha küçük ve ağzın tam ortasında başlat
          const templateW = mouthW * 0.85;
          const templateH = mouthH * 0.75;
          const templateX = minX + (mouthW - templateW) / 2;
          const templateY = minY + (mouthH - templateH) / 2;

          setTemplateProps({
            id: 'smile1',
            x: templateX,
            y: templateY,
            width: templateW,
            height: templateH,
            opacity: 0.9,
            rotation: 0
          });

          // Şablonu otomatik olarak seçili hale getir (Transformer ve ghost önizleme hemen görünür!)
          selectShape('smile1');
        }
      } else {
        alert("Yapay zeka fotoğrafta bir yüz veya dudak tespit edemedi. Lütfen daha net bir fotoğraf yükleyin.");
      }
    } catch (error) {
      console.error("Yapay Zeka Hatası:", error);
      const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || "Model veya WASM dosyaları yüklenemedi (Yerel sunucunun dosyaları düzgün sunabildiğinden emin olun)";
      alert("Dudak tespiti yapılırken yapay zeka hatası oluştu: " + errMsg);
    } finally {
      setIsAILoading(false);
    }
  };

  // 1. Hasta Fotoğrafı Yükleme ve AI Dudak Tespiti
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          // Maksimum 800x600 sığdırma hesaplaması
          const maxWidth = 800;
          const maxHeight = 600;
          const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
          const calculatedWidth = img.naturalWidth * ratio;
          const calculatedHeight = img.naturalHeight * ratio;
          
          setImageSize({
            width: calculatedWidth,
            height: calculatedHeight
          });
          setBgImage(img);
          
          // FOTOĞRAF YÜKLENDİĞİ AN YAPAY ZEKAYI TETİKLE
          detectMouthWithAI(img, calculatedWidth, calculatedHeight); 
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Şablonları Otomatik Yükleme
  useEffect(() => {
    const loadedTemplates = new Array(TEMPLATE_LIST.length).fill(null);
    let loadedCount = 0;
    
    // Vite'nin base URL'sini al, eğer yoksa '/' kullan
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    TEMPLATE_LIST.forEach((path, index) => {
      const img = new window.Image();
      // Sunucudan (public/templates/) çekiyoruz
      img.src = `${cleanBaseUrl}/${path}`;
      img.onload = () => {
        loadedTemplates[index] = img;
        loadedCount++;
        if (loadedCount === TEMPLATE_LIST.length) {
          setTemplates(loadedTemplates);
          setTemplateIndex(0);
          setTemplateProps({ x: 300, y: 250, width: 200, height: 80, id: 'smile1', opacity: 0.9, rotation: 0 });
        }
      };
      // Hata olursa en azından sayacı artır ki takılı kalmasın
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TEMPLATE_LIST.length) {
           setTemplates(loadedTemplates.filter(t => t !== null));
        }
      };
    });
  }, []);

  const toggleDrawingMode = () => {
    const nextDrawingMode = !isDrawingMode;
    setIsDrawingMode(nextDrawingMode);
    
    // Eğer çizim bitirildiyse ve manuel noktalar varsa diş şablonunu otomatik ortala ve ölçeklendir!
    if (!nextDrawingMode && mouthPoints.length >= 6) {
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < mouthPoints.length; i += 2) {
        const x = mouthPoints[i];
        const y = mouthPoints[i+1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      
      if (minX !== Infinity && maxX !== -Infinity) {
        const mouthW = maxX - minX;
        const mouthH = maxY - minY;
        
        const templateW = mouthW * 0.85;
        const templateH = mouthH * 0.75;
        const templateX = minX + (mouthW - templateW) / 2;
        const templateY = minY + (mouthH - templateH) / 2;

        setTemplateProps({
          id: 'smile1',
          x: templateX,
          y: templateY,
          width: templateW,
          height: templateH,
          opacity: 0.9,
          rotation: 0
        });
        selectShape('smile1');
      }
    }
  };

  const handleNextTemplate = () => {
    if (templates.length > 0) {
      setTemplateIndex((prevIndex) => (prevIndex + 1) % templates.length);
    }
  };

  // Sahne Tıklama Olayları: Kavisli Çizim İçin Nokta Ekleme
  const handleStageClick = (e) => {
    if (isDrawingMode) {
      const pos = e.target.getStage().getPointerPosition();
      setMouthPoints([...mouthPoints, pos.x, pos.y]); // Kavisli çizgi (Line) için noktaları düz dizi olarak tutuyoruz [x1, y1, x2, y2...]
    } else {
      // Stage'e (boşluğa) veya arka plan resmine tıklandığında seçimi kaldır
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'bg-image';
      if (clickedOnEmpty) {
        selectShape(null);
      }
    }
  };

  // Kavisli Maskeleme Fonksiyonu iptal edildi, destination-out kullanılacak.

  // Admin Girişini Kontrol Et
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUsername === 'mehmetgucel' && adminPassword === 'APPLEagree123.') {
      setIsUnlocked(true);
      setLoginError('');
    } else {
      setLoginError('Hatalı Admin Kullanıcı Adı veya Şifre!');
    }
  };

  // Çizim noktalarını küçük daireler olarak göstermek için yardımcı fonksiyon
  const renderDrawingPoints = () => {
    const points = [];
    for (let i = 0; i < mouthPoints.length; i += 2) {
      points.push(
        <Circle key={`point-${i}`} x={mouthPoints[i]} y={mouthPoints[i+1]} radius={3} fill="#e74c3c" />
      );
    }
    return points;
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-slate-800">Dijital Gülüş Tasarımı</h1>
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-red-50 text-red-500 rounded-full">
                <Lock className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Bölüm Kilitli</h2>
              <p className="text-sm font-semibold text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Bu kısım sadece hekiminiz eşliğinde açılabilir.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Kullanıcı adı girin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Şifre</label>
                <input
                  type="password"
                  required
                  placeholder="Şifre girin"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-500 text-center font-medium bg-red-50/55 py-1.5 rounded">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 text-center"
              >
                Giriş Yap ve Kilidi Aç
              </button>
            </form>

            {user?.role === 'admin' && (
              <div className="pt-4 border-t border-slate-100 flex flex-col items-center space-y-2">
                <p className="text-xs text-slate-400 italic text-center">
                  Hekim (Admin) olarak giriş yapmış durumdasınız.
                </p>
                <button
                  onClick={() => setIsUnlocked(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Doğrudan Kilidi Aç &rarr;
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Geri Dön
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <button
                      onClick={() => navigate('/dashboard')}
                      className="text-slate-500 hover:text-slate-700"
                  >
                      <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-xl font-bold text-slate-800">Dijital Gülüş Tasarımı</h1>
              </div>
          </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {/* Kontrol Paneli */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d' }}>1. Hasta Fotoğrafı:</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            </div>

            {/* 2. Diş Şablonları kısmı kaldırıldı, otomatik yükleniyor */}

            {templates.length > 0 && (
              <button onClick={handleNextTemplate} style={{ padding: '8px 12px', backgroundColor: '#2980b9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}>
                🔄 Formu Değiştir ({templateIndex + 1}/{templates.length})
              </button>
            )}
          </div>

          {/* Dudak Maskeleme Paneli */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', backgroundColor: '#e8f4f8', padding: '10px', borderRadius: '6px', flexWrap: 'wrap' }}>
            <button 
              onClick={toggleDrawingMode}
              style={{ padding: '8px 16px', backgroundColor: isDrawingMode ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isDrawingMode ? '🛑 Çizimi Bitir / Kilitle' : '✏️ Dudak Sınırını Çiz'}
            </button>
            
            {mouthPoints.length > 0 && (
              <button 
                onClick={() => setIsMaskActive(!isMaskActive)}
                style={{ padding: '8px 16px', backgroundColor: isMaskActive ? '#8e44ad' : '#16a085', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isMaskActive ? "🔓 Maskeyi Kaldır (Tam Göster)" : "🔒 Maskeyi Uygula (Dudak Arkasına Al)"}
              </button>
            )}

            {mouthPoints.length > 0 && (
              <button onClick={() => { setMouthPoints([]); setIsMaskActive(true); }} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                🗑️ Sınırı Temizle
              </button>
            )}
            
            <span style={{ fontSize: '13px', color: '#34495e', marginLeft: '10px' }}>
              {isDrawingMode 
                ? "Dudakların iç kısmına tıklayarak noktalar ekleyin. Çizgi otomatik olarak yumuşatılacaktır." 
                : (isMaskActive ? "Maske kilitli. Dişler sadece dudakların arkasından görünür." : "Maske kaldırıldı. Dişlerin tamamını görebilirsiniz.")}
            </span>
          </div>
          
          {/* Çalışma Alanı */}
          <div style={{ overflow: 'auto', border: '1px solid #bdc3c7', borderRadius: '4px', position: 'relative' }}>
            {/* Yapay Zeka Yükleme Perdesi */}
            {isAILoading && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white rounded-lg p-6 space-y-4">
                <div className="w-16 h-16 border-4 border-t-red-500 border-red-200 rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-lg text-white">🤖 Yapay Zeka Dudak Sınırını Tespit Ediyor...</h4>
                  <p className="text-sm text-slate-300">MediaPipe Face Landmarker modeli yükleniyor ve yüz hatları analiz ediliyor.</p>
                </div>
              </div>
            )}

            <Stage
              width={imageSize.width}
              height={imageSize.height}
              onMouseDown={handleStageClick}
              onTouchStart={handleStageClick}
              style={{ cursor: isDrawingMode ? 'crosshair' : 'default', backgroundColor: '#ecf0f1' }}
            >
              {/* Katman 1: Orijinal Fotoğraf */}
              <Layer>
                {bgImage && <KonvaImage name="bg-image" image={bgImage} width={imageSize.width} height={imageSize.height} />}
              </Layer>

              {/* Katman 2: Dişler ve Maskeleme */}
              <Layer>
                {/* Diş Şablonları */}
                {templates.length > 0 && templateProps && (
                  <SmileTemplate
                    imageObj={templates[templateIndex]}
                    shapeProps={templateProps}
                    isSelected={templateProps.id === selectedId && !isDrawingMode}
                    onSelect={() => {
                      if (!isDrawingMode) selectShape(templateProps.id);
                    }}
                    onChange={(newProps) => setTemplateProps(newProps)}
                    clipPoints={mouthPoints}
                    imageSize={imageSize}
                    isMaskActive={isMaskActive}
                  />
                )}

                {/* Çizim Aşamasında Görsel Rehber (Silici değil, kırmızı çizgi) */}
                {(isDrawingMode || (mouthPoints.length > 0 && isDrawingMode)) && (
                  <Line
                    points={mouthPoints}
                    tension={0} 
                    closed={false}
                    stroke="#e74c3c"
                    strokeWidth={2}
                    dash={[5, 5]}
                  />
                )}
                
                {/* Tıklanan Noktalar (Sadece Çizim Modunda) */}
                {isDrawingMode && renderDrawingPoints()}

              </Layer>
            </Stage>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SmileDesignModule;
