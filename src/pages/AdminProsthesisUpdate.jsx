import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProsthesisTimeline from '../components/ProsthesisTimeline';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function AdminProsthesisUpdate() {
    const { users, updateSpecificUser } = useAuth();
    const { username } = useParams();
    const navigate = useNavigate();

    const [targetUser, setTargetUser] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (users && username) {
            const foundUser = users.find(u => u.username === username || u.phone === username);
            if (foundUser) {
                setTargetUser(foundUser);
                setCurrentStep(foundUser.prosthesisStep || 0);
            }
        }
    }, [users, username]);

    const handleStepChange = (newStep) => {
        setCurrentStep(newStep);
        // Auto-save on change
        if (targetUser) {
            updateSpecificUser(targetUser.username || targetUser.phone, {
                prosthesisStep: newStep
            });
        }
    };

    if (!targetUser) return <div className="p-8 text-center">Kullanıcı bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/admin-dashboard')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Admin Paneline Dön
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Protez Durumu Güncelle</h1>
                            <p className="text-slate-400 mt-1">Hasta: {targetUser.name} {targetUser.surname}</p>
                        </div>
                        <div className="bg-blue-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                            Admin Modu
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 text-sm">
                            <p className="font-bold mb-1">Nasıl Kullanılır?</p>
                            Kutucukları işaretleyerek aşamaları tamamlayabilirsiniz. Değişiklikler anında hastanın ekranına yansıyacaktır.
                        </div>

                        <ProsthesisTimeline
                            currentStep={currentStep}
                            isEditable={true}
                            onStepChange={handleStepChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
