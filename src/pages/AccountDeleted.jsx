import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function AccountDeleted() {
    const { deleteMyAccount, logout } = useAuth();
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (window.confirm("Hesabınızı kalıcı olarak silmek ve telefon numaranızı boşa çıkarmak üzeresiniz. Onaylıyor musunuz?")) {
            try {
                await deleteMyAccount();
                alert("Hesabınız tamamen silindi. Artık aynı numara ile tekrar kayıt olabilirsiniz.");
                navigate('/giris');
            } catch (error) {
                console.error("Hesap silme hatası:", error);
                alert("Hesap silinirken bir hata oluştu: " + error.message);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-2">Hesabınız Silinmiş</h2>
                <p className="text-slate-600 mb-8">
                    Yönetici tarafından hesabınızın kaydı silinmiştir.
                    <br /><br />
                    Aynı telefon numarası ile tekrar kayıt olabilmek için mevcut giriş hesabınızı tamamen kapatmanız gerekmektedir.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleDelete}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                    >
                        <Trash2 className="w-5 h-5" />
                        Kaydı Tamamla ve Sil
                    </button>

                    <button
                        onClick={() => {
                            logout();
                            navigate('/giris');
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-medium transition-all"
                    >
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </div>
    );
}
