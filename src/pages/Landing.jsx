import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

export default function Landing() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-blue-100">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-100 rounded-full">
                        <Stethoscope className="w-12 h-12 text-blue-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    Dental Diagnostik Asistanı
                </h1>


                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/kayit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200"
                    >
                        Kayıt Ol
                    </Link>
                    <Link
                        to="/giris"
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                    >
                        Giriş Yap
                    </Link>
                </div>
            </div>
        </div>
    );
}
