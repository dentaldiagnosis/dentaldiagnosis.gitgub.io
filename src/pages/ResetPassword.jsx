import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { resetPassword } = useAuth();

    const username = searchParams.get('username');

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!username) {
            setError('Geçersiz sıfırlama bağlantısı.');
        }
    }, [username]);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Şifreler eşleşmiyor.');
            return;
        }

        try {
            resetPassword(username, passwords.newPassword);
            setSuccess(true);
            setTimeout(() => {
                navigate('/giris');
            }, 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    if (!username) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100 text-center">
                    <div className="text-red-500 font-bold mb-4">Hata</div>
                    <p className="text-slate-600">Geçersiz veya eksik şifre sıfırlama bağlantısı.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Yeni Şifre Belirle</h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Şifre Güncellendi!</h3>
                        <p className="text-slate-600 mb-6">
                            Şifreniz başarıyla değiştirildi. Giriş ekranına yönlendiriliyorsunuz...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
                            <input
                                required
                                type="password"
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre Tekrarı</label>
                            <input
                                required
                                type="password"
                                name="confirmPassword"
                                value={passwords.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 mt-4 flex items-center justify-center gap-2"
                        >
                            <Lock className="w-5 h-5" />
                            Şifreyi Güncelle
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
