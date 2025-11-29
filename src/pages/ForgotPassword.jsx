import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
    const { requestPasswordReset } = useAuth();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        try {
            requestPasswordReset(phone);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
                <div className="flex items-center mb-6">
                    <Link to="/giris" className="text-slate-400 hover:text-slate-600 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-2xl font-bold text-slate-800 ml-4">Şifremi Unuttum</h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">E-posta Gönderildi!</h3>
                        <p className="text-slate-600 mb-6">
                            Şifre sıfırlama bağlantısı kayıtlı e-posta adresinize gönderilmiştir. Lütfen gelen kutunuzu kontrol edin.
                        </p>
                        <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 mb-6 text-left">
                            <p className="font-bold mb-1">Simülasyon Notu:</p>
                            <p>Bu bir demo uygulamasıdır. E-posta gönderimi simüle edilmiştir. Lütfen tarayıcı konsolunu (F12) kontrol edin, sıfırlama linki orada yazdırılmıştır.</p>
                        </div>
                        <Link
                            to="/giris"
                            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                        >
                            Giriş Ekranına Dön
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <p className="text-slate-600 text-sm">
                            Hesabınıza kayıtlı telefon numarasını girin. Size şifrenizi sıfırlamanız için bir bağlantı göndereceğiz.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefon Numarası</label>
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0555 555 55 55"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                        >
                            <KeyRound className="w-5 h-5" />
                            Sıfırlama Bağlantısı Gönder
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
