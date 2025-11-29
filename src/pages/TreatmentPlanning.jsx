import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Check, X } from 'lucide-react';
import dentalChartAdmin from '../assets/dental-chart-admin.jpg';

// Tooth coordinates (percentages for responsiveness)
// These are approximate and might need fine-tuning based on the actual image
const TEETH_COORDINATES = {
    // Upper Jaw (18-28)
    18: { top: '25%', left: '5%' },
    17: { top: '25%', left: '12%' },
    16: { top: '25%', left: '19%' },
    15: { top: '25%', left: '26%' },
    14: { top: '25%', left: '31%' },
    13: { top: '25%', left: '36%' },
    12: { top: '25%', left: '41%' },
    11: { top: '25%', left: '46%' },
    21: { top: '25%', left: '54%' },
    22: { top: '25%', left: '59%' },
    23: { top: '25%', left: '64%' },
    24: { top: '25%', left: '69%' },
    25: { top: '25%', left: '74%' },
    26: { top: '25%', left: '81%' },
    27: { top: '25%', left: '88%' },
    28: { top: '25%', left: '95%' },

    // Lower Jaw (48-38)
    48: { top: '65%', left: '5%' },
    47: { top: '65%', left: '12%' },
    46: { top: '65%', left: '19%' },
    45: { top: '65%', left: '26%' },
    44: { top: '65%', left: '31%' },
    43: { top: '65%', left: '36%' },
    42: { top: '65%', left: '41%' },
    41: { top: '65%', left: '46%' },
    31: { top: '65%', left: '54%' },
    32: { top: '65%', left: '59%' },
    33: { top: '65%', left: '64%' },
    34: { top: '65%', left: '69%' },
    35: { top: '65%', left: '74%' },
    36: { top: '65%', left: '81%' },
    37: { top: '65%', left: '88%' },
    38: { top: '65%', left: '95%' },
};

const CONDITIONS = [
    "Sınıf 1 Çürük",
    "Sınıf 2 Çürük",
    "Sınıf 3 Çürük",
    "Sınıf 4 Çürük",
    "Sınıf 5 Çürük",
    "Kanal Tedavisi",
    "Kesim (Kron)",
    "İmplant",
    "Çekim",
    "Diğer"
];

export default function TreatmentPlanning() {
    const { phone } = useParams();
    const navigate = useNavigate();
    const { users, updateSpecificUser } = useAuth();
    const [selectedTooth, setSelectedTooth] = useState(null);
    const [treatmentPlan, setTreatmentPlan] = useState({}); // { toothNumber: [conditions] }
    const [otherText, setOtherText] = useState('');
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        const foundPatient = users?.find(u => u.phone === phone);
        if (foundPatient) {
            setPatient(foundPatient);
            if (foundPatient.treatmentPlan) {
                setTreatmentPlan(foundPatient.treatmentPlan);
            }
        }
    }, [users, phone]);

    const handleToothClick = (toothNumber) => {
        setSelectedTooth(toothNumber);
        setOtherText('');
    };

    const handleConditionToggle = (condition) => {
        if (!selectedTooth) return;

        setTreatmentPlan(prev => {
            const currentConditions = prev[selectedTooth] || [];
            let newConditions;

            if (currentConditions.includes(condition)) {
                newConditions = currentConditions.filter(c => c !== condition);
            } else {
                newConditions = [...currentConditions, condition];
            }

            // If "Diğer" is selected/deselected, handle it separately if needed
            // For now, we just toggle it like any other string

            if (newConditions.length === 0) {
                const { [selectedTooth]: removed, ...rest } = prev;
                return rest;
            }

            return { ...prev, [selectedTooth]: newConditions };
        });
    };

    const handleOtherTextChange = (e) => {
        setOtherText(e.target.value);
    };

    const addOtherCondition = () => {
        if (otherText.trim()) {
            handleConditionToggle(`Diğer: ${otherText}`);
            setOtherText('');
        }
    };

    const handleSave = () => {
        if (patient) {
            const updatedPatient = {
                ...patient,
                treatmentPlan: treatmentPlan
            };

            // Use updateSpecificUser to update the PATIENT'S data, not the admin's
            updateSpecificUser(patient.phone, updatedPatient);

            // Update local patient state to reflect changes immediately
            setPatient(updatedPatient);

            alert('Tedavi planı başarıyla kaydedildi.');
            // Do NOT navigate away automatically
        }
    };

    if (!patient) return <div>Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col h-screen">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin-dashboard')} className="text-slate-500 hover:text-slate-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Tedavi Planlaması</h1>
                        <p className="text-sm text-slate-500">{patient.name} {patient.surname}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Kaydet
                </button>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Dental Chart */}
                <div className="flex-1 bg-slate-100 p-8 overflow-auto flex items-center justify-center relative">
                    <div className="relative inline-block shadow-2xl rounded-xl overflow-hidden bg-white">
                        <img
                            src={dentalChartAdmin}
                            alt="Dental Chart"
                            className="max-w-4xl w-full h-auto object-contain"
                        />

                        {/* Tooth Overlays */}
                        {Object.entries(TEETH_COORDINATES).map(([toothNumber, coords]) => (
                            <button
                                key={toothNumber}
                                onClick={() => handleToothClick(toothNumber)}
                                style={{ top: coords.top, left: coords.left }}
                                className={`
                                    absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all z-10
                                    ${selectedTooth === toothNumber
                                        ? 'bg-blue-600 border-blue-600 text-white scale-125 shadow-lg ring-4 ring-blue-200'
                                        : treatmentPlan[toothNumber]
                                            ? 'bg-orange-500 border-orange-500 text-white'
                                            : 'bg-white/50 border-slate-400 text-slate-700 hover:bg-blue-50 hover:border-blue-400'
                                    }
                                `}
                            >
                                {toothNumber}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">
                            {selectedTooth ? `${selectedTooth} Numaralı Diş` : 'Diş Seçiniz'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {selectedTooth ? 'Uygulanacak tedavileri seçin' : 'İşlem yapmak için şemadan bir diş seçin'}
                        </p>
                    </div>

                    {selectedTooth ? (
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {CONDITIONS.map(condition => {
                                const isSelected = treatmentPlan[selectedTooth]?.includes(condition);
                                return (
                                    <div
                                        key={condition}
                                        className={`
                                            w-full rounded-xl border transition-all mb-3 overflow-hidden
                                            ${isSelected
                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <div
                                            onClick={() => condition !== 'Diğer' && handleConditionToggle(condition)}
                                            className={`
                                                px-4 py-3 flex items-center justify-between cursor-pointer
                                                ${condition === 'Diğer' ? 'cursor-default' : ''}
                                            `}
                                        >
                                            <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                                                {condition}
                                            </span>
                                            {isSelected && condition !== 'Diğer' && <Check className="w-4 h-4 text-blue-600" />}
                                        </div>

                                        {condition === 'Diğer' && (
                                            <div className="px-4 pb-3 pt-0">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={otherText}
                                                        onChange={handleOtherTextChange}
                                                        placeholder="Diğer işlem..."
                                                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={addOtherCondition}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                                    >
                                                        Ekle
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Display custom 'Diğer' entries */}
                            {treatmentPlan[selectedTooth]?.filter(c => c.startsWith('Diğer:')).map(customCondition => (
                                <div key={customCondition} className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-xl border border-blue-200 text-blue-700">
                                    <span className="font-medium text-sm">{customCondition}</span>
                                    <button
                                        onClick={() => handleConditionToggle(customCondition)}
                                        className="text-blue-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                                    <ArrowLeft className="w-8 h-8 text-slate-300" />
                                </div>
                                <p>Sol taraftaki şemadan işlem yapmak istediğiniz dişi seçiniz.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
