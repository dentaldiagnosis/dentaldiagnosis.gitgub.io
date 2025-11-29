import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Search, X, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
    const { user, logout, users, deleteUser } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/giris');
    };

    // Filter users (excluding admins)
    const patientList = (users || []).filter(u => u.role !== 'admin' && (
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Telefon</th>
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
                                                                deleteUser(patient.phone);
                                                            }
                                                        }}
                                                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"
                                                        title="Hastayı Sil"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{patient.phone}</td>
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
                                                        onClick={() => navigate(`/admin/treatment/${patient.phone}`)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                                    >
                                                        Yeni Tedavi Girişi
                                                    </button>
                                                    <button
                                                        className="text-orange-600 hover:text-orange-800 font-medium text-sm hover:underline"
                                                        onClick={() => navigate(`/admin/protez-guncelle/${patient.phone}`)}
                                                    >
                                                        Protez Durumu Gir
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/profile/${patient.phone}`)}
                                                        className="text-slate-600 hover:text-slate-800 font-medium text-sm hover:underline"
                                                    >
                                                        Profili
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/admin/odeme/${patient.phone}`)}
                                                        className="text-green-600 hover:text-green-800 font-medium text-sm hover:underline"
                                                    >
                                                        Ödeme
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
        </div>
    );
}
