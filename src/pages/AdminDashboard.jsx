import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Search, X, Trash2, FileText, AlertTriangle, Plus, Key } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
    const { user, logout, users, deleteUser, updateSpecificUser } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [noteModal, setNoteModal] = useState({ isOpen: false, userId: null, note: '' });
    const [passwordModal, setPasswordModal] = useState({ isOpen: false, password: '', name: '' });

    const openNoteModal = (patient) => {
        setNoteModal({
            isOpen: true,
            userId: patient.username || patient.phone,
            note: patient.adminNote || ''
        });
    };

    const handleSaveNote = async () => {
        if (noteModal.userId) {
            await updateSpecificUser(noteModal.userId, { adminNote: noteModal.note });
            setNoteModal({ isOpen: false, userId: null, note: '' });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/giris');
    };

    const handleDeleteAllUsers = async () => {
        if (window.confirm("DİKKAT! Admin hariç TÜM kullanıcıları silmek üzeresiniz. Bu işlem geri alınamaz. Onaylıyor musunuz?")) {
            if (window.confirm("Gerçekten emin misiniz? Tüm hasta kayıtları kalıcı olarak silinecek.")) {
                try {
                    const nonAdminUsers = users.filter(u => u.role !== 'admin');
                    for (const u of nonAdminUsers) {
                        await deleteUser(u.phone);
                    }
                    alert("Tüm kullanıcılar başarıyla silindi.");
                } catch (error) {
                    console.error("Toplu silme hatası:", error);
                    alert("Silme işlemi sırasında bir hata oluştu.");
                }
            }
        }
    };

    // Filter users (excluding admins)
    const patientList = (users || []).filter(u => u.role !== 'admin' && (
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.includes(searchTerm) ||
        u.phone?.includes(searchTerm)
    ));

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white shadow-lg px-4 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2 rounded-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Admin Paneli</h1>
                            <p className="text-xs text-slate-400">Hoş geldin, {user?.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium px-4 py-2 rounded-lg"
                    >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                    </button>
                </div>
                <div className="max-w-6xl mx-auto mt-4 flex justify-end">
                    <button
                        onClick={handleDeleteAllUsers}
                        className="flex items-center gap-2 text-red-300 hover:text-red-100 hover:bg-red-900/30 transition-all text-xs font-medium px-3 py-1.5 rounded-lg border border-red-900/30"
                    >
                        <AlertTriangle className="w-3 h-3" />
                        Tüm Kullanıcıları Sil (Sıfırla)
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-800">Hasta Listesi</h2>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Hasta ara (İsim, Tel)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-64 transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Hasta Adı</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Kullanıcı Adı (Şifre)</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Kayıt Tarihi</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Son Teşhis</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {patientList.length > 0 ? (
                                    patientList.map((patient, index) => (
                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-slate-900">{patient.name} {patient.surname}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('tr-TR') : '-'}, {patient.gender}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`${patient.name} ${patient.surname} isimli hastayı silmek istediğinize emin misiniz?`)) {
                                                                deleteUser(patient.username || patient.phone);
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                                                        title="Hastayı Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (patient.username) {
                                                                setPasswordModal({
                                                                    isOpen: true,
                                                                    password: patient.username,
                                                                    name: `${patient.name} ${patient.surname}`
                                                                });
                                                            } else if (patient.password) {
                                                                setPasswordModal({
                                                                    isOpen: true,
                                                                    password: patient.password,
                                                                    name: `${patient.name} ${patient.surname}`
                                                                });
                                                            } else {
                                                                alert("Bu kullanıcının şifresi sistemde kayıtlı değil (Eski kayıt).");
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-green-600 transition-colors p-1 rounded-full hover:bg-green-50 ml-1"
                                                        title="Şifreyi Göster"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => openNoteModal(patient)}
                                                        className={`text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-50 ${patient.adminNote ? 'text-blue-500' : ''}`}
                                                        title="Not Ekle/Düzenle"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{patient.username || patient.phone}</td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString('tr-TR') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {patient.diagnoses?.length > 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {new Date(patient.diagnoses[patient.diagnoses.length - 1].date).toLocaleDateString('tr-TR')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                        Yok
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => navigate(`/admin/treatment/${patient.username || patient.phone}`)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                                    >
                                                        Yeni Tedavi Girişi
                                                    </button>
                                                    <button
                                                        className="text-orange-600 hover:text-orange-800 font-medium text-sm hover:underline"
                                                        onClick={() => navigate(`/admin/protez-guncelle/${patient.username || patient.phone}`)}
                                                    >
                                                        Protez Durumu Gir
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/profile/${patient.username || patient.phone}`)}
                                                        className="text-slate-600 hover:text-slate-800 font-medium text-sm hover:underline"
                                                    >
                                                        Profili
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/odeme/${patient.username || patient.phone}`)}
                                                        className="text-green-600 hover:text-green-800 font-medium text-sm hover:underline"
                                                    >
                                                        İşlem Takibi
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            Kayıtlı hasta bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Note Modal */}
            {noteModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Yönetici Notu</h3>
                            <button onClick={() => setNoteModal({ ...noteModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <textarea
                            value={noteModal.note}
                            onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
                            placeholder="Bu hasta için sadece yöneticilerin görebileceği bir not ekleyin..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setNoteModal({ ...noteModal, isOpen: false })}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveNote}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {passwordModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Key className="w-5 h-5 text-blue-500" />
                                Kullanıcı Şifresi
                            </h3>
                            <button onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm text-slate-500 mb-1">Kullanıcı: <span className="font-medium text-slate-900">{passwordModal.name}</span></p>
                            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 font-mono text-lg text-center select-all">
                                {passwordModal.password}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
                            >
                                Tamam
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
