import React from 'react';
import { useAuth } from '../context/AuthContext';
import ProsthesisTimeline from '../components/ProsthesisTimeline';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProsthesisTracking() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Default to step 0 if not defined
    const currentStep = user?.prosthesisStep || 0;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Ana Sayfaya Dön
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <h1 className="text-2xl font-bold">Protez Takip Sistemi</h1>
                        <p className="text-slate-400 mt-1">Protez yapım aşamalarını buradan takip edebilirsiniz.</p>
                    </div>

                    <div className="p-8">
                        <ProsthesisTimeline
                            currentStep={currentStep}
                            isEditable={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
