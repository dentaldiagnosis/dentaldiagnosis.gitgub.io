import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer, Group, Line, Circle } from 'react-konva';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Alt Bileşen: Seçilebilir ve Boyutlandırılabilir Diş Şablonu
const SmileTemplate = ({ imageObj, shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <KonvaImage
        image={imageObj}
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable
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
          keepRatio={false} // En-boy oranını kilitlemeden her yöne serbestçe esnetebilmek için
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

  // 1. Hasta Fotoğrafı Yükleme
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          // Görüntünün en boy oranını bozmadan maksimum 800x600 alanına sığdıracak şekilde boyutları hesapla
          const maxWidth = 800;
          const maxHeight = 600;
          const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
          
          setImageSize({
            width: img.naturalWidth * ratio,
            height: img.naturalHeight * ratio
          });
          setBgImage(img);
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
    setIsDrawingMode(!isDrawingMode);
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
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.image() === bgImage;
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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center', backgroundColor: '#e8f4f8', padding: '10px', borderRadius: '6px' }}>
            <button 
              onClick={toggleDrawingMode}
              style={{ padding: '8px 16px', backgroundColor: isDrawingMode ? '#e74c3c' : '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isDrawingMode ? '🛑 Çizimi Bitir / Kilitle' : '✏️ Dudak Sınırını Çiz'}
            </button>
            
            {mouthPoints.length > 0 && (
              <button onClick={() => setMouthPoints([])} style={{ padding: '8px 16px', backgroundColor: '#95a5a6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                🗑️ Sınırı Temizle
              </button>
            )}
            
            <span style={{ fontSize: '13px', color: '#34495e', marginLeft: '10px' }}>
              {isDrawingMode 
                ? "Dudakların iç kısmına tıklayarak noktalar ekleyin. Çizgi otomatik olarak yumuşatılacaktır." 
                : "Maske kilitli. Dişi seçip sürükleyebilirsiniz, sadece maskeli alandan görünecektir."}
            </span>
          </div>
          
          {/* Çalışma Alanı */}
          <div style={{ overflow: 'auto', border: '1px solid #bdc3c7', borderRadius: '4px' }}>
            <Stage
              width={imageSize.width}
              height={imageSize.height}
              onMouseDown={handleStageClick}
              onTouchStart={handleStageClick}
              style={{ cursor: isDrawingMode ? 'crosshair' : 'default', backgroundColor: '#ecf0f1' }}
            >
              {/* Katman 1: Orijinal Fotoğraf */}
              <Layer>
                {bgImage && <KonvaImage image={bgImage} width={imageSize.width} height={imageSize.height} />}
              </Layer>

              {/* Katman 2: Dişler ve Silici (Destination-Out) Maske */}
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
                  />
                )}

                {/* Çizilen Poligon: İçini SİLER (dişleri silerek alttaki dudağın görünmesini sağlar) */}
                {mouthPoints.length >= 6 && !isDrawingMode && (
                  <Line
                    points={mouthPoints}
                    closed={true}
                    fill="black"
                    tension={0} // Düz çizgiler
                    globalCompositeOperation="destination-out"
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
