import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowLeft } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        birthDate: '',
        gender: '',
        termsAccepted: false
    });
    const [registeredCredentials, setRegisteredCredentials] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.autoDeleted ? 'Eski kaydınız başarıyla silindi. Şimdi yeni kaydınızı oluşturabilirsiniz.' : '');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const newUserProfile = await register(formData);
            setRegisteredCredentials({
                username: newUserProfile.username,
                password: newUserProfile.username
            });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
                <div className="flex items-center mb-6">
                    <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 ml-4">Kayıt Ol</h2>
                </div>

                {successMessage && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm font-medium border border-green-100">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">İsim</label>
                            <input
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Soyisim</label>
                            <input
                                required
                                type="text"
                                name="surname"
                                value={formData.surname}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Doğum Tarihi</label>
                            <input
                                required
                                type="date"
                                name="birthDate"
                                value={formData.birthDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cinsiyet</label>
                            <select
                                required
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
                            >
                                <option value="">Seçiniz</option>
                                <option value="Erkek">Erkek</option>
                                <option value="Kadın">Kadın</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                        </div>
                    </div>


                    <div className="flex items-center pt-2">
                        <input
                            required
                            type="checkbox"
                            name="termsAccepted"
                            checked={formData.termsAccepted}
                            onChange={handleChange}
                            id="terms"
                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="terms" className="ml-2 text-sm text-slate-600">
                            <span className="font-medium text-blue-600 cursor-pointer">Kullanım Koşullarını</span> kabul ediyorum.
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 mt-6 flex items-center justify-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Kayıt Ol
                    </button>
                </form>
            </div>

            {registeredCredentials && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Kayıt Başarılı!</h3>
                        <p className="text-slate-600 mb-6 text-sm">Lütfen sisteme giriş yapmak için aşağıdaki bilgileri not ediniz. Bu bilgiler bir daha gösterilmeyecektir.</p>
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-3">
                            <div>
                                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Kullanıcı Adı</span>
                                <span className="block text-lg font-bold text-blue-600">{registeredCredentials.username}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3">
                                <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Şifre</span>
                                <span className="block text-lg font-bold text-blue-600">{registeredCredentials.password}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                        >
                            Devam Et
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
