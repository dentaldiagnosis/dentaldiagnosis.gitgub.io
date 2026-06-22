import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, Calendar, CreditCard, FileText, Save, Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';

const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export default function PaymentTracking() {
    const { username } = useParams(); // If username exists, it's admin view
    const navigate = useNavigate();
    const { user: currentUser, users, updateSpecificUser } = useAuth();

    const isAdminView = !!username;
    const targetUser = isAdminView ? users?.find(u => u.username === username || u.phone === username) : currentUser;

    const [paymentStatus, setPaymentStatus] = useState({});
    const [adminNotes, setAdminNotes] = useState('');
    const [notesPhotos, setNotesPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (targetUser) {
            setPaymentStatus(targetUser.paymentStatus || {});
            setAdminNotes(targetUser.paymentNotes || '');
            setNotesPhotos(targetUser.notesPhotos || []);
        }
    }, [targetUser]);

    if (!targetUser) return <div className="p-8 text-center">Kullanıcı bulunamadı.</div>;

    // Flatten treatment plan into a list of items
    // treatmentPlan is { "13": ["Kesim", "Dolgu"], "24": ["..."] }
    const treatmentItems = [];
    if (targetUser.treatmentPlan) {
        Object.entries(targetUser.treatmentPlan).forEach(([tooth, conditions]) => {
            conditions.forEach(condition => {
                treatmentItems.push({
                    id: `${tooth}-${condition}`, // Unique ID for the item
                    tooth,
                    condition
                });
            });
        });
    }

    const handleStatusChange = (itemId, field) => {
        if (!isAdminView) return;

        setPaymentStatus(prev => {
            const currentItem = prev[itemId] || {};
            const newValue = !currentItem[field];

            return {
                ...prev,
                [itemId]: {
                    ...currentItem,
                    [field]: newValue,
                    [`${field}Date`]: newValue ? new Date().toISOString() : null
                }
            };
        });
    };

    const handleSave = () => {
        if (!isAdminView) return;

        const updatedUser = {
            ...targetUser,
            paymentStatus,
            paymentNotes: adminNotes,
            notesPhotos: notesPhotos
        };

        updateSpecificUser(targetUser.username || targetUser.phone, updatedUser);
        alert('İşlem bilgileri kaydedildi.');
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const base64Photo = await compressImage(file);
            setNotesPhotos(prev => [...prev, base64Photo]);
        } catch (error) {
            console.error("Fotoğraf yükleme hatası:", error);
            alert("Fotoğraf yüklenirken bir hata oluştu.");
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input to allow selecting same file again
        }
    };

    const handleDeletePhoto = (indexToDelete) => {
        if (window.confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
            setNotesPhotos(prev => prev.filter((_, index) => index !== indexToDelete));
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(isAdminView ? '/admin-dashboard' : '/dashboard')}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                                İşlem Takip
                            </h1>
                            {isAdminView && (
                                <p className="text-sm text-slate-500">
                                    Hasta: {targetUser.name} {targetUser.surname}
                                </p>
                            )}
                        </div>
                    </div>
                    {isAdminView && (
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            Kaydet
                        </button>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Treatment List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800">Yapılan İşlemler ve Durumları</h2>
                    </div>

                    {treatmentItems.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {treatmentItems.map((item) => {
                                const status = paymentStatus[item.id] || {};

                                return (
                                    <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                                                {item.tooth}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{item.condition}</div>
                                                <div className="text-xs text-slate-500">Diş No: {item.tooth}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                            {/* Procedure Done Checkbox */}
                                            <div
                                                onClick={() => handleStatusChange(item.id, 'isProcedureDone')}
                                                className={`
                                                    flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer select-none
                                                    ${status.isProcedureDone
                                                        ? 'bg-green-50 border-green-200 text-green-700'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }
                                                    ${!isAdminView ? 'pointer-events-none' : ''}
                                                `}
                                            >
                                                <div className={`
                                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                    ${status.isProcedureDone ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}
                                                `}>
                                                    {status.isProcedureDone && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">İşlem Yapıldı</span>
                                                    {status.isProcedureDone && (
                                                        <span className="text-[10px] opacity-75">{formatDate(status.isProcedureDoneDate)}</span>
                                                    )}
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-500 italic">
                            Henüz planlanmış bir tedavi bulunmuyor.
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h2 className="font-bold text-slate-800">Notlar ve Tedavi Görselleri</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Text Notes */}
                        <div>
                            {isAdminView ? (
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="İşlem veya tedavi ile ilgili notlar..."
                                    rows={4}
                                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                />
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[100px] text-slate-700 whitespace-pre-wrap">
                                    {adminNotes || <span className="text-slate-400 italic">Henüz bir not eklenmemiş.</span>}
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2 mb-4">
                                <ImageIcon className="w-4 h-4 text-slate-500" />
                                Tedavi Görselleri
                                {isAdminView && <span className="text-xs font-normal text-slate-400">(Değişiklikleri kaydetmek için yukarıdaki Kaydet butonunu kullanın)</span>}
                            </h3>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {notesPhotos.map((photo, index) => (
                                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm hover:shadow transition-all">
                                        <img 
                                            src={photo} 
                                            alt={`Tedavi Görseli ${index + 1}`}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                            onClick={() => setSelectedPhoto(photo)}
                                        />
                                        
                                        {isAdminView && (
                                            <button
                                                onClick={() => handleDeletePhoto(index)}
                                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow transition-colors"
                                                title="Fotoğrafı Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {isAdminView && (
                                    <label className={`
                                        border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl 
                                        flex flex-col items-center justify-center cursor-pointer aspect-square p-4 
                                        bg-slate-50 hover:bg-blue-50/20 transition-all text-slate-500 hover:text-blue-600
                                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                                    `}>
                                        <Plus className="w-8 h-8 mb-1.5" />
                                        <span className="text-xs font-semibold text-center">
                                            {isUploading ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
                                        </span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handlePhotoUpload} 
                                            className="hidden" 
                                            disabled={isUploading}
                                        />
                                    </label>
                                )}
                            </div>

                            {notesPhotos.length === 0 && !isAdminView && (
                                <div className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                    Henüz görsel eklenmemiş.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>

            {/* Full Screen Photo Modal (Lightbox) */}
            {selectedPhoto && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all cursor-pointer"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute -top-12 right-0 text-white hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800/80 p-2 rounded-full transition-all"
                            title="Kapat"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img
                            src={selectedPhoto}
                            alt="Görsel Detayı"
                            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
