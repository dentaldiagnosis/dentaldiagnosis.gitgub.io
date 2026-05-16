import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Check, Calendar, CreditCard, FileText, Save } from 'lucide-react';

export default function PaymentTracking() {
    const { username } = useParams(); // If username exists, it's admin view
    const navigate = useNavigate();
    const { user: currentUser, users, updateSpecificUser } = useAuth();

    const isAdminView = !!username;
    const targetUser = isAdminView ? users?.find(u => u.username === username || u.phone === username) : currentUser;

    const [paymentStatus, setPaymentStatus] = useState({});
    const [adminNotes, setAdminNotes] = useState('');

    useEffect(() => {
        if (targetUser) {
            setPaymentStatus(targetUser.paymentStatus || {});
            setAdminNotes(targetUser.paymentNotes || '');
        }
    }, [targetUser]);

    if (!targetUser) return <div className="p-8 text-center">Kullanıcı bulunamadı.</div>;

    // Flatten treatment plan into a list of items
    // treatmentPlan is { "13": ["Kesim", "Dolgu"], "24": ["..."] }
    const treatmentItems = [];
    if (targetUser.treatmentPlan) {
        Object.entries(targetUser.treatmentPlan).forEach(([tooth, conditions]) => {
            conditions.forEach(condition => {
                treatmentItems.push({
                    id: `${tooth}-${condition}`, // Unique ID for the item
                    tooth,
                    condition
                });
            });
        });
    }

    const handleStatusChange = (itemId, field) => {
        if (!isAdminView) return;

        setPaymentStatus(prev => {
            const currentItem = prev[itemId] || {};
            const newValue = !currentItem[field];

            return {
                ...prev,
                [itemId]: {
                    ...currentItem,
                    [field]: newValue,
                    [`${field}Date`]: newValue ? new Date().toISOString() : null
                }
            };
        });
    };

    const handleSave = () => {
        if (!isAdminView) return;

        const updatedUser = {
            ...targetUser,
            paymentStatus,
            paymentNotes: adminNotes
        };

        updateSpecificUser(targetUser.username || targetUser.phone, updatedUser);
        alert('İşlem bilgileri kaydedildi.');
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(isAdminView ? '/admin-dashboard' : '/dashboard')}
                            className="text-slate-500 hover:text-slate-700"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard className="w-6 h-6 text-blue-600" />
                                İşlem Takip
                            </h1>
                            {isAdminView && (
                                <p className="text-sm text-slate-500">
                                    Hasta: {targetUser.name} {targetUser.surname}
                                </p>
                            )}
                        </div>
                    </div>
                    {isAdminView && (
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            Kaydet
                        </button>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Treatment List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800">Yapılan İşlemler ve Durumları</h2>
                    </div>

                    {treatmentItems.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {treatmentItems.map((item) => {
                                const status = paymentStatus[item.id] || {};

                                return (
                                    <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                                                {item.tooth}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{item.condition}</div>
                                                <div className="text-xs text-slate-500">Diş No: {item.tooth}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                            {/* Procedure Done Checkbox */}
                                            <div
                                                onClick={() => handleStatusChange(item.id, 'isProcedureDone')}
                                                className={`
                                                    flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer select-none
                                                    ${status.isProcedureDone
                                                        ? 'bg-green-50 border-green-200 text-green-700'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                    }
                                                    ${!isAdminView ? 'pointer-events-none' : ''}
                                                `}
                                            >
                                                <div className={`
                                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                    ${status.isProcedureDone ? 'bg-green-500 border-green-500' : 'bg-white border-slate-300'}
                                                `}>
                                                    {status.isProcedureDone && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">İşlem Yapıldı</span>
                                                    {status.isProcedureDone && (
                                                        <span className="text-[10px] opacity-75">{formatDate(status.isProcedureDoneDate)}</span>
                                                    )}
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-500 italic">
                            Henüz planlanmış bir tedavi bulunmuyor.
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <h2 className="font-bold text-slate-800">Notlar</h2>
                    </div>
                    <div className="p-6">
                        {isAdminView ? (
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="İşlem veya tedavi ile ilgili notlar..."
                                rows={4}
                                className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                            />
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[100px] text-slate-700 whitespace-pre-wrap">
                                {adminNotes || <span className="text-slate-400 italic">Henüz bir not eklenmemiş.</span>}
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
