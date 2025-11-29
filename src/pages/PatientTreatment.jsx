import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import dentalChartAdmin from '../assets/dental-chart-admin.jpg';

// Reusing coordinates from TreatmentPlanning (should ideally be shared constant)
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

export default function PatientTreatment() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const treatmentPlan = user?.treatmentPlan || {};

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Tedavi Planım</h1>
                        <p className="text-sm text-slate-500">Doktorunuz tarafından oluşturulan tedavi planı</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 flex justify-center">
                    <div className="relative inline-block">
                        <img
                            src={dentalChartAdmin}
                            alt="Dental Chart"
                            className="max-w-3xl w-full h-auto object-contain"
                        />

                        {/* Tooth Overlays (Read-only) */}
                        {Object.entries(TEETH_COORDINATES).map(([toothNumber, coords]) => {
                            const hasTreatment = treatmentPlan[toothNumber] && treatmentPlan[toothNumber].length > 0;
                            return (
                                <div
                                    key={toothNumber}
                                    style={{ top: coords.top, left: coords.left }}
                                    className={`
                                        absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10
                                        ${hasTreatment
                                            ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-110'
                                            : 'bg-white/30 border-slate-300 text-slate-500'
                                        }
                                    `}
                                >
                                    {toothNumber}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Treatment List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 px-2">Yapılacak İşlemler</h2>

                    {Object.keys(treatmentPlan).length > 0 ? (
                        Object.entries(treatmentPlan).map(([toothNumber, conditions]) => (
                            <div key={toothNumber} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                                    {toothNumber}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 mb-1">{toothNumber} Numaralı Diş</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {conditions.map((condition, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                                                {condition}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500">
                            Henüz oluşturulmuş bir tedavi planınız bulunmamaktadır.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
