import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KVKK_TEXT, CONSENT_TEXT } from '../data/consentTexts';
import dentalChartImage from '../assets/dental-chart.jpg';

const SYSTEMIC_DISEASES = [
    "Diyabet",
    "Hipertansiyon",
    "Kalp hastalığı",
    "Böbrek hastalığı",
    "Tiroid hastalığı",
    "Astım/KOAH",
    "Romatizmal hastalık",
    "Kanser",
    "Diğer",
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
    },
    "Diğer": {
        type: "text_only",
        inputLabel: "Rahatsızlığınızı belirtiniz"
    }
};

const ALLERGIES = [
    "Penisilin",
    "Astım",
    "Alerjik rinit",
    "Ürtiker",
    "Gıda alerjisi",
    "Anafilaksi (alerjik şok)",
    "Diğer",
    "Yok"
];

const QUADRANTS = [
    { id: "sag_ust", label: "Sağ Üst", position: "top-0 left-0" },
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
    "apse",
    "Diğer"
];

export default function Diagnosis() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, updateUser, saveDiagnosis, updateSpecificUser, users } = useAuth();

    // Check if we are in edit mode (passed from Profile)
    const initialData = location.state?.initialData;
    const initialStep = location.state?.initialStep || 1;
    const targetUsername = location.state?.targetUsername;

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
                isOtherSelected: false,
                isNoneSelected: false
            },
            quadrants: [],
            quadrantConditions: {},
            consents: {
                kvkkApproved: false,
                dentalConsentApproved: false,
                dataSharingChoice: ''
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

            if (allergy === "Yok") {
                return {
                    ...prev,
                    allergies: currentAllergies.includes("Yok") ? [] : ["Yok"],
                    otherAllergyDetails: '' // Clear details
                };
            }

            let newAllergies = currentAllergies.filter(a => a !== "Yok"); // Uncheck Yok if other selected

            if (newAllergies.includes(allergy)) {
                newAllergies = newAllergies.filter(a => a !== allergy);
                if (allergy === "Diğer") {
                    return { ...prev, allergies: newAllergies, otherAllergyDetails: '' };
                }
            } else {
                newAllergies = [...newAllergies, allergy];
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
                        relatedToDiseases: !prev.medications.isRelatedSelected ? [] : prev.medications.relatedToDiseases
                    }
                };
            } else if (type === 'other') {
                return {
                    ...prev,
                    medications: {
                        ...prev.medications,
                        isOtherSelected: !prev.medications.isOtherSelected,
                        otherMedsDetails: !prev.medications.isOtherSelected ? '' : prev.medications.otherMedsDetails,
                        isNoneSelected: false // Deselect None if Other is selected
                    }
                };
            } else if (type === 'none') {
                return {
                    ...prev,
                    medications: {
                        ...prev.medications,
                        isNoneSelected: !prev.medications.isNoneSelected,
                        isRelatedSelected: false, // Deselect others if None is selected
                        isOtherSelected: false,
                        relatedToDiseases: [],
                        otherMedsDetails: ''
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

            // Save Diagnosis Data
            if (targetUsername) {
                // Admin saving for a specific user
                const targetUser = users.find(u => u.username === targetUsername || u.phone === targetUsername);
                if (targetUser) {
                    const newDiagnosis = {
                        id: Date.now(),
                        date: new Date().toISOString(),
                        data: answers
                    };
                    const currentDiagnoses = targetUser.diagnoses || [];
                    const updatedDiagnoses = [...currentDiagnoses, newDiagnosis];

                    updateSpecificUser(targetUsername, { diagnoses: updatedDiagnoses });
                    alert("Teşhis kaydı başarıyla güncellendi! Admin paneline yönlendiriliyorsunuz.");
                    navigate(`/admin/profile/${targetUsername}`);
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
            if (targetUsername) {
                // If admin is editing, go back to patient profile in admin view
                navigate(`/admin/profile/${targetUsername}`);
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
                                        {config.type === 'text_only' ? (
                                            <div className="animate-fade-in">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    {config.inputLabel}
                                                </label>
                                                <textarea
                                                    value={answers.diseaseDetails[disease]?.inputValue || ''}
                                                    onChange={(e) => handleDetailChange(disease, e.target.value, 'input')}
                                                    placeholder="Detayları yazınız..."
                                                    rows={3}
                                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                                />
                                            </div>
                                        ) : (
                                            <>
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
                                            </>
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

                            {/* Option 3: None */}
                            <div className={`
                                border-2 rounded-xl p-4 transition-all duration-200
                                ${answers.medications.isNoneSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}
                            `}>
                                <button
                                    onClick={() => handleMedicationMainToggle('none')}
                                    className="flex items-center w-full text-left"
                                >
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3
                                        ${answers.medications.isNoneSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}
                                    `}>
                                        {answers.medications.isNoneSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <span className="font-medium text-slate-800">Yok</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div className="animate-fade-in space-y-8">
                        <h2 className="text-2xl font-bold text-slate-800 text-center">
                            Problem yaşadığınız bölgeyi işaretleyiniz
                        </h2>

                        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
                            {/* Left Side: Dental Chart */}
                            <div className="relative w-full max-w-md mx-auto lg:mx-0 flex-shrink-0 group cursor-pointer">
                                <img
                                    src={dentalChartImage}
                                    alt="Dental Chart"
                                    className="w-full h-auto rounded-xl shadow-md border border-slate-200 select-none block"
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
                                    <div className="h-full flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 text-center">
                                        <p>Lütfen görsel üzerinden problem yaşadığınız bölgeleri seçiniz.</p>
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

                        {/* KVKK Consent */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-start gap-4">
                                <input
                                    type="checkbox"
                                    id="kvkk"
                                    checked={answers.consents.kvkkApproved}
                                    readOnly
                                    disabled
                                    className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 opacity-50 cursor-not-allowed"
                                />
                                <div>
                                    <label htmlFor="kvkk" className="font-medium text-slate-800 cursor-pointer">
                                        KVKK Aydınlatma Metni'ni okudum ve onaylıyorum.
                                    </label>
                                    <button
                                        onClick={() => setActiveModal('kvkk')}
                                        className="text-blue-600 text-sm hover:underline ml-2"
                                    >
                                        Metni Görüntüle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dental Consent */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-start gap-4">
                                <input
                                    type="checkbox"
                                    id="dental"
                                    checked={answers.consents.dentalConsentApproved}
                                    readOnly
                                    disabled
                                    className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 opacity-50 cursor-not-allowed"
                                />
                                <div>
                                    <label htmlFor="dental" className="font-medium text-slate-800 cursor-pointer">
                                        Diş Hekimliği Onam Formu'nu okudum ve onaylıyorum.
                                    </label>
                                    <button
                                        onClick={() => setActiveModal('consent')}
                                        className="text-blue-600 text-sm hover:underline ml-2"
                                    >
                                        Metni Görüntüle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Data Sharing Choice */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-medium text-slate-800 mb-4">
                                Verilerimin bilimsel çalışmalarda anonim olarak kullanılmasına:
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dataSharing"
                                        value="yes"
                                        checked={answers.consents.dataSharingChoice === 'yes'}
                                        onChange={(e) => setAnswers(prev => ({
                                            ...prev,
                                            consents: { ...prev.consents, dataSharingChoice: e.target.value }
                                        }))}
                                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-3 text-slate-700">İzin Veriyorum</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dataSharing"
                                        value="no"
                                        checked={answers.consents.dataSharingChoice === 'no'}
                                        onChange={(e) => setAnswers(prev => ({
                                            ...prev,
                                            consents: { ...prev.consents, dataSharingChoice: e.target.value }
                                        }))}
                                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-3 text-slate-700">İzin Vermiyorum</span>
                                </label>
                            </div>
                        </div>


                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className={`
                            px-6 py-3 rounded-xl font-medium transition-all
                            ${currentStep === 1
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-slate-600 hover:bg-slate-100'
                            }
                        `}
                        disabled={currentStep === 1}
                    >
                        Geri
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentStep === 6 && (!answers.consents.kvkkApproved || !answers.consents.dentalConsentApproved)}
                        className={`
                            px-8 py-3 rounded-xl font-medium shadow-lg transition-all flex items-center gap-2
                            ${currentStep === 6 && (!answers.consents.kvkkApproved || !answers.consents.dentalConsentApproved)
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                            }
                        `}
                    >
                        {currentStep === 6 ? 'Tamamla' : 'Devam Et'}
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Modal */}
            {
                activeModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">
                                    {activeModal === 'kvkk' ? 'KVKK Aydınlatma Metni' : 'Diş Hekimliği Onam Formu'}
                                </h3>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div
                                className="p-6 overflow-y-auto flex-1 text-slate-600 text-sm leading-relaxed space-y-4"
                                onScroll={handleScroll}
                            >
                                {activeModal === 'kvkk' ? (
                                    <div className="whitespace-pre-wrap">{KVKK_TEXT}</div>
                                ) : (
                                    <div className="whitespace-pre-wrap">{CONSENT_TEXT}</div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                                <button
                                    onClick={() => {
                                        if (activeModal === 'kvkk') {
                                            setAnswers(prev => ({ ...prev, consents: { ...prev.consents, kvkkApproved: true } }));
                                        } else {
                                            setAnswers(prev => ({ ...prev, consents: { ...prev.consents, dentalConsentApproved: true } }));
                                        }
                                        setActiveModal(null);
                                    }}
                                    disabled={!hasScrolledToBottom}
                                    className={`
                                    px-6 py-2 rounded-lg font-medium transition-all
                                    ${hasScrolledToBottom
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }
                                `}
                                >
                                    {hasScrolledToBottom ? 'Okudum, Onaylıyorum' : 'Lütfen metni sonuna kadar okuyunuz'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
