import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, PlusCircle, User, Calendar, Activity, ChevronRight, CreditCard } from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/giris');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-100 px-4 py-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Dental Asistan</h1>
                        <p className="text-xs text-slate-500">Hoş geldin, {user?.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/smile-design')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
                        >
                            <span className="text-lg">✨</span>
                            Gülüşünü Tasarla
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50"
                        >
                            <User className="w-4 h-4" />
                            Profilim
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50"
                        >
                            <LogOut className="w-4 h-4" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 py-8">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 mb-8">
                    <h2 className="text-2xl font-bold mb-2">Merhaba, {user?.name}!</h2>
                    <p className="text-blue-100">Bugün diş sağlığın için ne yapmak istersin?</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/diagnosis')}
                        className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group flex items-center gap-4 text-left"
                    >
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <PlusCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">
                                {user?.diagnoses?.length > 0 ? "Teşhisi Güncelle" : "Yeni Teşhis Başlat"}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {user?.diagnoses?.length > 0 ? "Mevcut durumunu düzenle" : "Semptomlarını kontrol et"}
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => navigate('/treatment-plan')}
                        className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-500 hover:shadow-md transition-all group text-left flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                                <Calendar className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Tedavi Planlaması</h3>
                                <p className="text-sm text-slate-500">Mevcut tedavi planınızı ve durumunu görüntüleyin.</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </button>

                    <button
                        onClick={() => navigate('/protez-takip')}
                        className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group text-left flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                                <Activity className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Protez Takip</h3>
                                <p className="text-sm text-slate-500">Protez durumunuzu sorgulayın</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                    </button>

                    <button
                        onClick={() => navigate('/odeme')}
                        className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-500 hover:shadow-md transition-all group text-left flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                                <CreditCard className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:text-green-600 transition-colors">İşlem Takip</h3>
                                <p className="text-sm text-slate-500">İşlem geçmişinizi görüntüleyin</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-green-600 transition-colors" />
                    </button>
                </div>
            </main>
        </div>
    );
}
