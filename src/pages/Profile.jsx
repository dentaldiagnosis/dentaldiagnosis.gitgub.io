import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Calendar, FileText, Edit2, Save, X, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function Profile() {
    const { user: currentUser, updateUser, users, updateSpecificUser } = useAuth();
    const { username } = useParams();
    const navigate = useNavigate();

    // Admin view check
    const isAdminView = !!username;
    const targetUser = isAdminView ? users?.find(u => u.username === username || u.phone === username) : currentUser;

    // Local state for personal info editing
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [personalData, setPersonalData] = useState(null);

    useEffect(() => {
        if (targetUser) {
            setPersonalData({
                name: targetUser.name || '',
                surname: targetUser.surname || '',
                birthDate: targetUser.birthDate || '',
                gender: targetUser.gender || ''
            });
        }
    }, [targetUser]);

    if (!targetUser) return <div className="p-8 text-center">Kullanıcı bulunamadı.</div>;

    const handlePersonalChange = (e) => {
        const { name, value } = e.target;
        setPersonalData(prev => ({ ...prev, [name]: value }));
    };

    const handlePersonalSave = () => {
        try {
            if (isAdminView) {
                updateSpecificUser(targetUser.username || targetUser.phone, personalData);
            } else {
                updateUser(personalData);
            }
            setIsEditingPersonal(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const latestDiagnosis = targetUser.diagnoses && targetUser.diagnoses.length > 0
        ? targetUser.diagnoses[targetUser.diagnoses.length - 1]
        : null;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatBirthDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Navigation Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(isAdminView ? '/admin-dashboard' : '/dashboard')}
                        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Ana Ekrana Dön
                    </button>
                </div>

                {/* Admin Banner */}
                {isAdminView && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-amber-800 mb-6">
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Admin Modu: {targetUser.name} {targetUser.surname} kullanıcısını görüntülüyorsunuz.</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Personal Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-900 p-6 text-center">
                                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                                    {targetUser.name?.[0]}{targetUser.surname?.[0]}
                                </div>
                                <h1 className="text-xl font-bold text-white">{targetUser.name} {targetUser.surname}</h1>
                                <p className="text-slate-400 text-sm">Kayıt: {new Date(targetUser.registrationDate).toLocaleDateString('tr-TR')}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Kişisel Bilgiler</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">İsim Soyisim</label>
                                        {isEditingPersonal ? (
                                            <div className="flex gap-2">
                                                <input
                                                    name="name"
                                                    value={personalData.name}
                                                    onChange={handlePersonalChange}
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="İsim"
                                                />
                                                <input
                                                    name="surname"
                                                    value={personalData.surname}
                                                    onChange={handlePersonalChange}
                                                    className="w-full p-2 border rounded text-sm"
                                                    placeholder="Soyisim"
                                                />
                                            </div>
                                        ) : (
                                            <div className="font-medium text-slate-800">{targetUser.name} {targetUser.surname}</div>
                                        )}
                                    </div>


                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Doğum Tarihi</label>
                                            {isEditingPersonal ? (
                                                <input
                                                    type="date"
                                                    name="birthDate"
                                                    value={personalData.birthDate}
                                                    onChange={handlePersonalChange}
                                                    className="w-full p-2 border rounded text-sm"
                                                />
                                            ) : (
                                                <div className="font-medium text-slate-800">{formatBirthDate(targetUser.birthDate)}</div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Cinsiyet</label>
                                            {isEditingPersonal ? (
                                                <select
                                                    name="gender"
                                                    value={personalData.gender}
                                                    onChange={handlePersonalChange}
                                                    className="w-full p-2 border rounded text-sm"
                                                >
                                                    <option value="Erkek">Erkek</option>
                                                    <option value="Kadın">Kadın</option>
                                                </select>
                                            ) : (
                                                <div className="font-medium text-slate-800">{targetUser.gender}</div>
                                            )}
                                        </div>
                                    </div>



                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={() => isEditingPersonal ? handlePersonalSave() : setIsEditingPersonal(true)}
                                        className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${isEditingPersonal
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                            }`}
                                    >
                                        {isEditingPersonal ? <><Save className="w-4 h-4" /> Kaydet</> : <><Edit2 className="w-4 h-4" /> Düzenle</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Medical Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {latestDiagnosis ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Son Teşhis Bilgileri
                                    </h2>
                                    <span className="text-xs text-slate-500">{formatDate(latestDiagnosis.date)}</span>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {/* Systemic Diseases */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-slate-800">Sistemik Hastalıklar</h3>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                            {latestDiagnosis.data.systemicDiseases.length > 0 && !latestDiagnosis.data.systemicDiseases.includes("Yok") ? (
                                                <ul className="space-y-2">
                                                    {latestDiagnosis.data.systemicDiseases.map(disease => (
                                                        <li key={disease} className="text-sm text-slate-700">
                                                            <span className="font-medium">{disease}</span>
                                                            {latestDiagnosis.data.diseaseDetails[disease] && (
                                                                <span className="text-slate-500 ml-2">
                                                                    ({latestDiagnosis.data.diseaseDetails[disease].selection ||
                                                                        latestDiagnosis.data.diseaseDetails[disease].inputValue ||
                                                                        latestDiagnosis.data.diseaseDetails[disease].selections?.join(", ")})
                                                                </span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <p className="text-sm text-slate-500 italic">Yok</p>}
                                        </div>
                                        <button
                                            onClick={() => navigate('/diagnosis', {
                                                state: {
                                                    initialData: latestDiagnosis.data,
                                                    initialStep: 1,
                                                    targetUsername: isAdminView ? (targetUser.username || targetUser.phone) : null
                                                }
                                            })}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3" /> Düzenle
                                        </button>
                                    </div>

                                    {/* Allergies */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-slate-800">Alerjiler</h3>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                            {latestDiagnosis.data.allergies.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {latestDiagnosis.data.allergies.map(allergy => (
                                                        <li key={allergy} className="text-sm text-slate-700">
                                                            • {allergy}
                                                            {allergy === "Diğer" && latestDiagnosis.data.otherAllergyDetails && (
                                                                <span className="text-slate-500"> ({latestDiagnosis.data.otherAllergyDetails})</span>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <p className="text-sm text-slate-500 italic">Yok</p>}
                                        </div>
                                        <button
                                            onClick={() => navigate('/diagnosis', {
                                                state: {
                                                    initialData: latestDiagnosis.data,
                                                    initialStep: 3,
                                                    targetUsername: isAdminView ? (targetUser.username || targetUser.phone) : null
                                                }
                                            })}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3" /> Düzenle
                                        </button>
                                    </div>

                                    {/* Medications */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-slate-800">İlaçlar</h3>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                            {(latestDiagnosis.data.medications.isRelatedSelected || latestDiagnosis.data.medications.isOtherSelected) ? (
                                                <ul className="space-y-1">
                                                    {latestDiagnosis.data.medications.isRelatedSelected && latestDiagnosis.data.medications.relatedToDiseases.map(d => (
                                                        <li key={d} className="text-sm text-slate-700">• {d} ile ilgili ilaçlar</li>
                                                    ))}
                                                    {latestDiagnosis.data.medications.isOtherSelected && (
                                                        <li className="text-sm text-slate-700">• Diğer: {latestDiagnosis.data.medications.otherMedsDetails}</li>
                                                    )}
                                                </ul>
                                            ) : <p className="text-sm text-slate-500 italic">Yok</p>}
                                        </div>
                                        <button
                                            onClick={() => navigate('/diagnosis', {
                                                state: {
                                                    initialData: latestDiagnosis.data,
                                                    initialStep: 4,
                                                    targetUsername: isAdminView ? (targetUser.username || targetUser.phone) : null
                                                }
                                            })}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3" /> Düzenle
                                        </button>
                                    </div>

                                    {/* Dental Problems */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-bold text-slate-800">Diş Problemleri</h3>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                            {latestDiagnosis.data.quadrants.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {latestDiagnosis.data.quadrants.map(quadrant => (
                                                        <div key={quadrant} className="bg-white p-2 rounded border border-slate-200 text-sm">
                                                            <span className="font-bold text-blue-600">{quadrant}:</span> {latestDiagnosis.data.quadrantConditions[quadrant] || "Belirtilmedi"}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-sm text-slate-500 italic">Yok</p>}
                                        </div>
                                        <button
                                            onClick={() => navigate('/diagnosis', {
                                                state: {
                                                    initialData: latestDiagnosis.data,
                                                    initialStep: 5,
                                                    targetUsername: isAdminView ? (targetUser.username || targetUser.phone) : null
                                                }
                                            })}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3" /> Düzenle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Henüz Teşhis Kaydı Yok</h3>
                                <p className="text-slate-500 mb-6">Diş sağlığı durumunuzu belirlemek için teşhis formunu doldurun.</p>
                                <button
                                    onClick={() => navigate('/diagnosis')}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Teşhis Başlat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
