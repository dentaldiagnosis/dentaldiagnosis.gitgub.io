import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KVKK_TEXT, CONSENT_TEXT } from '../data/consentTexts';

const SYSTEMIC_DISEASES = [
    "Diyabet",
    "Hipertansiyon",
    "Kalp hastalığı",
    "Böbrek hastalığı",
    "Tiroid hastalığı",
    "Astım/KOAH",
    "Romatizmal hastalık",
    "Kanser",
    "Yok"
];

const DISEASE_DETAILS = {
    "Diyabet": {
        type: "radio",
        options: ["Tip 1 Diyabet", "Tip 2 Diyabet", "Gestasyonel Diyabet"],
        hasInput: true,
        inputLabel: "Son HbA1c değeriniz",
        inputType: "number"
    },
    "Hipertansiyon": {
        type: "radio",
        options: [
            "İyi kontrol (120/80 mmHg altı)",
            "Sınırda (120-139/80-89 mmHg)",
            "Yüksek (140/90 mmHg üstü)"
        ]
    },
    "Kalp hastalığı": {
        type: "checkbox",
        options: [
            "Koroner arter hastalığı",
            "Kalp yetmezliği",
            "Kalp kapak hastalığı",
            "Ritim bozukluğu",
            "Geçirilmiş kalp krizi"
        ]
    },
    "Böbrek hastalığı": {
        type: "checkbox",
        options: [
            "Kronik böbrek yetmezliği",
            "Böbrek taşı",
            "Böbrek enfeksiyonu",
            "Diyaliz hastası",
            "Diğer"
        ]
    },
    "Tiroid hastalığı": {
        type: "checkbox",
        options: [
            "Hipertiroidi",
            "Hipotiroidi",
            "Tiroid nodülü",
            "Tiroid kanseri"
        ]
    },
    "Astım/KOAH": {
        type: "checkbox",
        options: [
            "Astım",
            "KOAH",
            "Kronik bronşit",
            "Amfizem"
        ]
    },
    "Romatizmal hastalık": {
        type: "checkbox",
        options: [
            "Romatoid artrit",
            "Sistemik lupus eritematozus",
            "Sjögren sendromu",
            "Ankilozan spondilit",
            "Psöriyatik artrit"
        ]
    },
    "Kanser": {
        type: "radio",
        options: [
            "Aktif tedavi görüyorum",
            "Tedavi tamamlandı",
            "Takip aşamasındayım"
        ]
    }
};

const ALLERGIES = [
    "Penisilin",
    "Astım",
    "Alerjik rinit",
    "Ürtiker",
    "Gıda alerjisi",
    "Anafilaksi (alerjik şok)",
    "Diğer"
];

const QUADRANTS = [
    { id: "sag_ust", label: "Sağ Üst", position: "top-0 left-0" }, // Adjust positioning classes as needed
    { id: "sol_ust", label: "Sol Üst", position: "top-0 right-0" },
    { id: "sag_alt", label: "Sağ Alt", position: "bottom-0 left-0" },
    { id: "sol_alt", label: "Sol Alt", position: "bottom-0 right-0" }
];

const DENTAL_CONDITIONS = [
    "kaplama",
    "implant",
    "barlı protez",
    "damak",
    "koku şikayeti",
    "temizlik",
    "gece ağrısı",
    "sızlama",
    "apse"
];

export default function Diagnosis() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, updateUser, saveDiagnosis, updateSpecificUser, users } = useAuth();

    // Check if we are in edit mode (passed from Profile)
    const initialData = location.state?.initialData;
    const initialStep = location.state?.initialStep || 1;
    const targetPhone = location.state?.targetPhone;

    const [currentStep, setCurrentStep] = useState(initialStep);
    const [answers, setAnswers] = useState(() => {
        // If editing existing data passed from profile
        if (initialData) {
            return initialData;
        }

        // Pre-fill with latest diagnosis if available (fallback)
        if (user?.diagnoses?.length > 0) {
            return user.diagnoses[user.diagnoses.length - 1].data;
        }

        return {
            systemicDiseases: [],
            diseaseDetails: {},
            allergies: [],
            otherAllergyDetails: '',
            medications: {
                relatedToDiseases: [],
                otherMedsDetails: '',
                isRelatedSelected: false,
                isOtherSelected: false
            },
            quadrants: [],
            quadrantConditions: {},
            consents: {
                kvkkApproved: false,
                dentalConsentApproved: false,
                tckn: user?.tckn || '',
                dataSharingChoice: '',
                handwrittenConfirmation: ''
            }
        };
    });

    const [activeModal, setActiveModal] = useState(null); // 'kvkk' or 'consent' or null
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const modalContentRef = useRef(null);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Check if scrolled to bottom (with small buffer)
        if (scrollHeight - scrollTop <= clientHeight + 10) {
            setHasScrolledToBottom(true);
        }
    };

    useEffect(() => {
        if (activeModal) {
            setHasScrolledToBottom(false);
        }
    }, [activeModal]);

    const handleDiseaseToggle = (disease) => {
        setAnswers(prev => {
            const currentDiseases = prev.systemicDiseases;

            if (disease === "Yok") {
                return {
                    ...prev,
                    systemicDiseases: currentDiseases.includes("Yok") ? [] : ["Yok"],
                    diseaseDetails: {} // Clear details if Yok is selected
                };
            }

            let newDiseases = currentDiseases.filter(d => d !== "Yok");

            if (newDiseases.includes(disease)) {
                newDiseases = newDiseases.filter(d => d !== disease);
                // Remove details for deselected disease
                const newDetails = { ...prev.diseaseDetails };
                delete newDetails[disease];
                return { ...prev, systemicDiseases: newDiseases, diseaseDetails: newDetails };
            } else {
                newDiseases.push(disease);
                return { ...prev, systemicDiseases: newDiseases };
            }
        });
    };

    const handleAllergyToggle = (allergy) => {
        setAnswers(prev => {
            const currentAllergies = prev.allergies;
            let newAllergies;

            if (currentAllergies.includes(allergy)) {
                newAllergies = currentAllergies.filter(a => a !== allergy);
                // If "Diğer" is deselected, clear the details
                if (allergy === "Diğer") {
                    return { ...prev, allergies: newAllergies, otherAllergyDetails: '' };
                }
            } else {
                newAllergies = [...currentAllergies, allergy];
            }

            return { ...prev, allergies: newAllergies };
        });
    };

    const handleMedicationMainToggle = (type) => {
        setAnswers(prev => {
            if (type === 'related') {
                return {
                    ...prev,
                    medications: {
                        ...prev.medications,
                        isRelatedSelected: !prev.medications.isRelatedSelected,
                        relatedToDiseases: !prev.medications.isRelatedSelected ? [] : prev.medications.relatedToDiseases // Clear if unchecking? Or keep? Let's clear for clarity.
                    }
                };
            } else if (type === 'other') {
                return {
                    ...prev,
                    medications: {
                        ...prev.medications,
                        isOtherSelected: !prev.medications.isOtherSelected,
                        otherMedsDetails: !prev.medications.isOtherSelected ? '' : prev.medications.otherMedsDetails
                    }
                };
            }
            return prev;
        });
    };

    const handleRelatedDiseaseToggle = (disease) => {
        setAnswers(prev => {
            const current = prev.medications.relatedToDiseases;
            let newRelated;
            if (current.includes(disease)) {
                newRelated = current.filter(d => d !== disease);
            } else {
                newRelated = [...current, disease];
            }
            return {
                ...prev,
                medications: {
                    ...prev.medications,
                    relatedToDiseases: newRelated
                }
            };
        });
    };

    const handleQuadrantToggle = (quadrantLabel) => {
        setAnswers(prev => {
            const current = prev.quadrants;
            let newQuadrants;
            if (current.includes(quadrantLabel)) {
                newQuadrants = current.filter(q => q !== quadrantLabel);
                // Remove condition if quadrant is deselected
                const newConditions = { ...prev.quadrantConditions };
                delete newConditions[quadrantLabel];
                return { ...prev, quadrants: newQuadrants, quadrantConditions: newConditions };
            } else {
                newQuadrants = [...current, quadrantLabel];
                return { ...prev, quadrants: newQuadrants };
            }
        });
    };

    const handleQuadrantConditionChange = (quadrantLabel, condition) => {
        setAnswers(prev => ({
            ...prev,
            quadrantConditions: {
                ...prev.quadrantConditions,
                [quadrantLabel]: condition
            }
        }));
    };

    const handleDetailChange = (disease, value, type) => {
        setAnswers(prev => {
            const currentDetails = prev.diseaseDetails[disease] || {};
            let newValues;

            if (type === 'checkbox') {
                const currentList = currentDetails.selections || [];
                if (currentList.includes(value)) {
                    newValues = currentList.filter(v => v !== value);
                } else {
                    newValues = [...currentList, value];
                }
                return {
                    ...prev,
                    diseaseDetails: {
                        ...prev.diseaseDetails,
                        [disease]: { ...currentDetails, selections: newValues }
                    }
                };
            } else if (type === 'radio') {
                return {
                    ...prev,
                    diseaseDetails: {
                        ...prev.diseaseDetails,
                        [disease]: { ...currentDetails, selection: value }
                    }
                };
            } else if (type === 'input') {
                return {
                    ...prev,
                    diseaseDetails: {
                        ...prev.diseaseDetails,
                        [disease]: { ...currentDetails, inputValue: value }
                    }
                };
            }
            return prev;
        });
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (answers.systemicDiseases.includes("Yok")) {
                // Skip details if "Yok" -> Go to Step 3 (Allergies)
                setCurrentStep(3);
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(3);
        } else if (currentStep === 3) {
            setCurrentStep(4);
        } else if (currentStep === 4) {
            setCurrentStep(5);
        } else if (currentStep === 5) {
            if (answers.quadrants.length === 0) {
                alert("Lütfen problem yaşadığınız en az bir bölgeyi işaretleyiniz.");
                return;
            }
            setCurrentStep(6);
        } else if (currentStep === 6) {
            if (!answers.consents.kvkkApproved || !answers.consents.dentalConsentApproved) {
                alert("Lütfen tüm onam formlarını okuyup onaylayınız.");
                return;
            }

            // Save TCKN to user profile if not already set or updated
            if (answers.consents.tckn) {
                if (targetPhone) {
                    // If admin is editing, update specific user's TCKN
                    const targetUser = users.find(u => u.phone === targetPhone);
                    if (targetUser) {
                        updateSpecificUser(targetPhone, { tckn: answers.consents.tckn });
                    }
                } else {
                    updateUser({ tckn: answers.consents.tckn });
                }
            }

            // Save Diagnosis Data
            if (targetPhone) {
                // Admin saving for a specific user
                const targetUser = users.find(u => u.phone === targetPhone);
                if (targetUser) {
                    const newDiagnosis = {
                        id: Date.now(),
                        date: new Date().toISOString(),
                        data: answers
                    };
                    const currentDiagnoses = targetUser.diagnoses || [];
                    const updatedDiagnoses = [...currentDiagnoses, newDiagnosis];

                    updateSpecificUser(targetPhone, { diagnoses: updatedDiagnoses });
                    alert("Teşhis kaydı başarıyla güncellendi! Admin paneline yönlendiriliyorsunuz.");
                    navigate(`/admin/profile/${targetPhone}`);
                }
            } else {
                // Regular user saving
                saveDiagnosis(answers);
                alert("Teşhis süreci başarıyla tamamlandı! Profilinize yönlendiriliyorsunuz.");
                navigate('/profile');
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        } else {
            if (targetPhone) {
                // If admin is editing, go back to patient profile in admin view
                navigate(`/admin/profile/${targetPhone}`);
            } else {
                // Regular user goes back to dashboard
                navigate('/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm border-b border-slate-100 flex items-center">
                <button onClick={handleBack} className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="ml-4 text-lg font-bold text-slate-800">Yeni Teşhis</h1>
                <div className="ml-auto text-sm text-slate-500 font-medium">
                    Adım {currentStep}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 max-w-2xl mx-auto w-full pb-24">
                {currentStep === 1 && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">
                            Daha önce teşhis edilmiş herhangi bir sistemik hastalığınız var mı?
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {SYSTEMIC_DISEASES.map((disease) => {
                                const isSelected = answers.systemicDiseases.includes(disease);
                                return (
                                    <button
                                        key={disease}
                                        onClick={() => handleDiseaseToggle(disease)}
                                        className={`
                      p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                      ${isSelected
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50'
                                            }
                    `}
                                    >
                                        <span className="font-medium">{disease}</span>
                                        {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="animate-fade-in space-y-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            Hastalık Detayları
                        </h2>

                        {answers.systemicDiseases.map((disease) => {
                            const config = DISEASE_DETAILS[disease];
                            if (!config) return null;

                            return (
                                <div key={disease} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                        {disease}
                                    </h3>

                                    <div className="space-y-3">
                                        {config.options.map((option) => {
                                            const isSelected = config.type === 'radio'
                                                ? answers.diseaseDetails[disease]?.selection === option
                                                : answers.diseaseDetails[disease]?.selections?.includes(option);

                                            return (
                                                <label
                                                    key={option}
                                                    className={`
                            flex items-center p-3 rounded-lg border cursor-pointer transition-all
                            ${isSelected
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-slate-200 hover:bg-slate-50'
                                                        }
                          `}
                                                >
                                                    <input
                                                        type={config.type}
                                                        name={disease}
                                                        value={option}
                                                        checked={isSelected || false}
                                                        onChange={() => handleDetailChange(disease, option, config.type)}
                                                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-3 text-slate-700">{option}</span>
                                                </label>
                                            );
                                        })}

                                        {/* Special Input for Diabetes */}
                                        {config.hasInput && answers.diseaseDetails[disease]?.selection && (
                                            <div className="mt-4 pl-4 border-l-2 border-blue-100 animate-fade-in">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    {config.inputLabel}
                                                </label>
                                                <input
                                                    type={config.inputType}
                                                    value={answers.diseaseDetails[disease]?.inputValue || ''}
                                                    onChange={(e) => handleDetailChange(disease, e.target.value, 'input')}
                                                    placeholder="Örn: 6.5"
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            Mevcut bir alerjiniz var mı?
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ALLERGIES.map((allergy) => {
                                const isSelected = answers.allergies.includes(allergy);
                                return (
                                    <button
                                        key={allergy}
                                        onClick={() => handleAllergyToggle(allergy)}
                                        className={`
                      p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group
                      ${isSelected
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50'
                                            }
                    `}
                                    >
                                        <span className="font-medium">{allergy}</span>
                                        {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>

                        {answers.allergies.includes("Diğer") && (
                            <div className="mt-6 animate-fade-in">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Alerji Detayları
                                </label>
                                <textarea
                                    value={answers.otherAllergyDetails}
                                    onChange={(e) => setAnswers(prev => ({ ...prev, otherAllergyDetails: e.target.value }))}
                                    placeholder="Detayları yazınız"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                />
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            Düzenli kullanmakta olduğunuz bir ilacınız var mı?
                        </h2>

                        <div className="space-y-4">
                            {/* Option 1: Related to existing diseases */}
                            <div className={`
                                border-2 rounded-xl p-4 transition-all duration-200
                                ${answers.medications.isRelatedSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}
                            `}>
                                <button
                                    onClick={() => handleMedicationMainToggle('related')}
                                    className="flex items-center w-full text-left"
                                >
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3
                                        ${answers.medications.isRelatedSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}
                                    `}>
                                        {answers.medications.isRelatedSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="font-medium text-slate-800">İşaretlemiş olduğum mevcut hastalıklarla alakalı</span>
                                </button>

                                {answers.medications.isRelatedSelected && (
                                    <div className="mt-4 pl-9 animate-fade-in space-y-2">
                                        {answers.systemicDiseases.filter(d => d !== "Yok").length > 0 ? (
                                            answers.systemicDiseases.filter(d => d !== "Yok").map(disease => (
                                                <label key={disease} className="flex items-center cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={answers.medications.relatedToDiseases.includes(disease)}
                                                        onChange={() => handleRelatedDiseaseToggle(disease)}
                                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="ml-3 text-slate-700">{disease}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">Herhangi bir hastalık işaretlemediniz.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Option 2: Other */}
                            <div className={`
                                border-2 rounded-xl p-4 transition-all duration-200
                                ${answers.medications.isOtherSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}
                            `}>
                                <button
                                    onClick={() => handleMedicationMainToggle('other')}
                                    className="flex items-center w-full text-left"
                                >
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3
                                        ${answers.medications.isOtherSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}
                                    `}>
                                        {answers.medications.isOtherSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="font-medium text-slate-800">Diğer</span>
                                </button>

                                {answers.medications.isOtherSelected && (
                                    <div className="mt-4 pl-9 animate-fade-in">
                                        <textarea
                                            value={answers.medications.otherMedsDetails}
                                            onChange={(e) => setAnswers(prev => ({
                                                ...prev,
                                                medications: { ...prev.medications, otherMedsDetails: e.target.value }
                                            }))}
                                            placeholder="İlaç bilgilerinizi kısaca tarif edin"
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none bg-white"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="animate-fade-in space-y-8">
                        <h2 className="text-2xl font-bold text-slate-800 text-center">
                            Problem yaşadığınız bölgeyi işaretleyiniz
                        </h2>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Left Side: Dental Chart */}
                            <div className="relative max-w-sm mx-auto lg:mx-0 flex-shrink-0 group cursor-pointer">
                                <img
                                    src="/dental-chart.jpg"
                                    alt="Dental Chart"
                                    className="w-full h-auto rounded-xl shadow-md border border-slate-200 select-none"
                                />

                                {/* Clickable Grid Overlay */}
                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden">
                                    {/* Top Left (Sağ Üst) */}
                                    <button
                                        onClick={() => handleQuadrantToggle("Sağ Üst")}
                                        className={`
                                            relative w-full h-full transition-all duration-200 border-r border-b border-slate-200/20
                                            ${answers.quadrants.includes("Sağ Üst")
                                                ? 'bg-blue-500/30 hover:bg-blue-500/40'
                                                : 'hover:bg-slate-900/5'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm transition-colors
                                            ${answers.quadrants.includes("Sağ Üst")
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/90 text-slate-700'
                                            }
                                        `}>
                                            Sağ Üst
                                            {answers.quadrants.includes("Sağ Üst") && <Check className="inline-block w-3 h-3 ml-1" />}
                                        </div>
                                    </button>

                                    {/* Top Right (Sol Üst) */}
                                    <button
                                        onClick={() => handleQuadrantToggle("Sol Üst")}
                                        className={`
                                            relative w-full h-full transition-all duration-200 border-b border-slate-200/20
                                            ${answers.quadrants.includes("Sol Üst")
                                                ? 'bg-blue-500/30 hover:bg-blue-500/40'
                                                : 'hover:bg-slate-900/5'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm transition-colors
                                            ${answers.quadrants.includes("Sol Üst")
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/90 text-slate-700'
                                            }
                                        `}>
                                            Sol Üst
                                            {answers.quadrants.includes("Sol Üst") && <Check className="inline-block w-3 h-3 ml-1" />}
                                        </div>
                                    </button>

                                    {/* Bottom Left (Sağ Alt) */}
                                    <button
                                        onClick={() => handleQuadrantToggle("Sağ Alt")}
                                        className={`
                                            relative w-full h-full transition-all duration-200 border-r border-slate-200/20
                                            ${answers.quadrants.includes("Sağ Alt")
                                                ? 'bg-blue-500/30 hover:bg-blue-500/40'
                                                : 'hover:bg-slate-900/5'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            absolute bottom-2 left-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm transition-colors
                                            ${answers.quadrants.includes("Sağ Alt")
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/90 text-slate-700'
                                            }
                                        `}>
                                            Sağ Alt
                                            {answers.quadrants.includes("Sağ Alt") && <Check className="inline-block w-3 h-3 ml-1" />}
                                        </div>
                                    </button>

                                    {/* Bottom Right (Sol Alt) */}
                                    <button
                                        onClick={() => handleQuadrantToggle("Sol Alt")}
                                        className={`
                                            relative w-full h-full transition-all duration-200
                                            ${answers.quadrants.includes("Sol Alt")
                                                ? 'bg-blue-500/30 hover:bg-blue-500/40'
                                                : 'hover:bg-slate-900/5'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            absolute bottom-2 right-2 px-2 py-1 rounded-md text-xs font-bold shadow-sm transition-colors
                                            ${answers.quadrants.includes("Sol Alt")
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white/90 text-slate-700'
                                            }
                                        `}>
                                            Sol Alt
                                            {answers.quadrants.includes("Sol Alt") && <Check className="inline-block w-3 h-3 ml-1" />}
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Condition Details */}
                            <div className="flex-1 w-full">
                                {answers.quadrants.length > 0 ? (
                                    <div className="space-y-4 animate-fade-in bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                                        <h3 className="text-lg font-bold text-slate-800 mb-4">Detaylar</h3>
                                        {answers.quadrants.map(quadrant => (
                                            <div key={quadrant} className="flex flex-col gap-2 text-slate-700 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-slate-600">Bölge:</span>
                                                    <span className="font-bold text-blue-600">{quadrant}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="whitespace-nowrap text-sm">Durum:</span>
                                                    <select
                                                        value={answers.quadrantConditions[quadrant] || ""}
                                                        onChange={(e) => handleQuadrantConditionChange(quadrant, e.target.value)}
                                                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white text-sm"
                                                    >
                                                        <option value="">Seçiniz</option>
                                                        {DENTAL_CONDITIONS.map(cond => (
                                                            <option key={cond} value={cond}>{cond}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-center">
                                        <p>Detayları görmek için soldaki şemadan bölge seçiniz.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 6 && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            Onam Formları
                        </h2>

                        <div className="space-y-4">
                            {/* KVKK Consent */}
                            <div className="flex items-center p-4 border-2 border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                                <div className={`
                                    w-6 h-6 rounded border-2 flex items-center justify-center mr-4 flex-shrink-0
                                    ${answers.consents.kvkkApproved ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-100'}
                                `}>
                                    {answers.consents.kvkkApproved && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <button
                                    onClick={() => setActiveModal('kvkk')}
                                    className="text-left text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                    Kişisel Verilerin Koruma Kanunu Kapsamında Aydınlatma Metni
                                </button>
                            </div>

                            {/* Dental Procedure Consent */}
                            <div className="flex items-center p-4 border-2 border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                                <div className={`
                                    w-6 h-6 rounded border-2 flex items-center justify-center mr-4 flex-shrink-0
                                    ${answers.consents.dentalConsentApproved ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-100'}
                                `}>
                                    {answers.consents.dentalConsentApproved && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <button
                                    onClick={() => setActiveModal('consent')}
                                    className="text-left text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                    Dental İşlem Onam Formu
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shadow-lg">
                <div className="max-w-2xl mx-auto flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                    >
                        Geri
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={
                            (currentStep === 1 && answers.systemicDiseases.length === 0) ||
                            (currentStep === 3 && answers.allergies.length === 0 && !answers.allergies.includes("Diğer")) ||
                            (currentStep === 6 && (!answers.consents.kvkkApproved || !answers.consents.dentalConsentApproved))
                        }
                        className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200
              ${(currentStep === 1 && answers.systemicDiseases.length === 0) ||
                                (currentStep === 3 && answers.allergies.length === 0 && !answers.allergies.includes("Diğer")) ||
                                (currentStep === 6 && (!answers.consents.kvkkApproved || !answers.consents.dentalConsentApproved))
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                            }
            `}
                    >
                        {currentStep === 6 ? 'Tamamla' : 'Devam Et'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Modals */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">
                                {activeModal === 'kvkk' ? 'Aydınlatma Metni' : 'Onam Formu'}
                            </h3>
                            <button
                                onClick={() => setActiveModal(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div
                            ref={modalContentRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-6 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap"
                        >
                            {activeModal === 'kvkk' ? KVKK_TEXT : CONSENT_TEXT}

                            {/* Dynamic Fields for KVKK */}
                            {activeModal === 'kvkk' && (
                                <div className="mt-8 space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ad Soyad</label>
                                            <div className="font-medium text-slate-800">{user?.name} {user?.surname}</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TCKN</label>
                                            <input
                                                type="text"
                                                value={answers.consents.tckn}
                                                onChange={(e) => setAnswers(prev => ({
                                                    ...prev,
                                                    consents: { ...prev.consents, tckn: e.target.value }
                                                }))}
                                                placeholder="TC Kimlik No Giriniz"
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Fields for Consent */}
                            {activeModal === 'consent' && (
                                <div className="mt-8 space-y-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-800 mb-2">
                                            Kişisel verilerimin paylaşılmasına izin...
                                        </label>
                                        <input
                                            type="text"
                                            value={answers.consents.dataSharingChoice}
                                            onChange={(e) => setAnswers(prev => ({
                                                ...prev,
                                                consents: { ...prev.consents, dataSharingChoice: e.target.value }
                                            }))}
                                            placeholder='El yazınız ile "veriyorum" ya da "vermiyorum" yazınız'
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-800 mb-2">
                                            Onay Beyanı
                                        </label>
                                        <input
                                            type="text"
                                            value={answers.consents.handwrittenConfirmation}
                                            onChange={(e) => setAnswers(prev => ({
                                                ...prev,
                                                consents: { ...prev.consents, handwrittenConfirmation: e.target.value }
                                            }))}
                                            placeholder='El yazınız ile "okuduğumu anladım, kabul ediyorum" yazınız'
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                                        <div>
                                            <span className="font-bold">Tarih:</span> {new Date().toLocaleDateString('tr-TR')}
                                        </div>
                                        <div>
                                            <span className="font-bold">Hasta:</span> {user?.name} {user?.surname}
                                        </div>
                                        <div>
                                            <span className="font-bold">Telefon:</span> {user?.phone}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                            <button
                                disabled={!hasScrolledToBottom || (activeModal === 'kvkk' && !answers.consents.tckn) || (activeModal === 'consent' && (!answers.consents.dataSharingChoice || !answers.consents.handwrittenConfirmation))}
                                onClick={() => {
                                    if (activeModal === 'kvkk') {
                                        setAnswers(prev => ({ ...prev, consents: { ...prev.consents, kvkkApproved: true } }));
                                    } else {
                                        setAnswers(prev => ({ ...prev, consents: { ...prev.consents, dentalConsentApproved: true } }));
                                    }
                                    setActiveModal(null);
                                }}
                                className={`
                                    px-6 py-2 rounded-lg font-bold transition-all
                                    ${(!hasScrolledToBottom || (activeModal === 'kvkk' && !answers.consents.tckn) || (activeModal === 'consent' && (!answers.consents.dataSharingChoice || !answers.consents.handwrittenConfirmation)))
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                    }
                                `}
                            >
                                Onayla ve Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

