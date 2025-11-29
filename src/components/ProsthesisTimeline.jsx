import React from 'react';
import { Check, Activity } from 'lucide-react';

// Custom icons for the stages
const ToothIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4.2 12l1.4-1.4a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 0 2.8 0l.7-.7a2 2 0 0 1 2.8 0l1.4 1.4" />
        <path d="M20 12c0 5.5-4.5 10-10 10S0 17.5 0 12" transform="translate(2 0)" />
    </svg>
);

const LabIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
        <path d="M10 2h4" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
    </svg>
);

const stages = [
    { id: 1, text: "Ölçü Alınmıştır", icon: ToothIcon },
    { id: 2, text: "Ölçü Laboratuvar'a Ulaştı", icon: LabIcon },
    { id: 3, text: "İşiniz Yapım Aşamasında", icon: LabIcon },
    { id: 4, text: "İşiniz Kliniğe Ulaştı, En Yakın Zamanda Size Ulaşacağız", icon: ToothIcon },
];

export default function ProsthesisTimeline({ currentStep, isEditable, onStepChange }) {
    // currentStep: 0 (none) to 4 (completed)

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="relative">
                {stages.map((stage, index) => {
                    const isCompleted = currentStep >= stage.id;
                    const isNext = currentStep === stage.id - 1;
                    const isLast = index === stages.length - 1;

                    return (
                        <div key={stage.id} className="relative flex items-start gap-6 pb-12 last:pb-0">
                            {/* Connecting Line */}
                            {!isLast && (
                                <div className="absolute left-[19px] top-10 bottom-0 w-0.5 border-l-2 border-dashed border-slate-300 h-full"></div>
                            )}

                            {/* Animated Flashing Tooth on the line */}
                            {!isLast && isCompleted && currentStep === stage.id && (
                                <div className="absolute left-[11px] top-1/2 -translate-y-1/2 z-10 animate-bounce">
                                    <div className="bg-blue-100 p-1 rounded-full border border-blue-200">
                                        <ToothIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                            )}

                            {/* Icon Circle */}
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                                    : 'bg-white border-slate-200 text-slate-300'
                                }`}>
                                <stage.icon className="w-5 h-5" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-2 flex justify-between items-start gap-4">
                                <div>
                                    <h3 className={`font-bold text-lg transition-colors ${isCompleted ? 'text-slate-800' : 'text-slate-400'
                                        }`}>
                                        {stage.text}
                                    </h3>
                                    {isCompleted && (
                                        <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Tamamlandı
                                        </p>
                                    )}
                                </div>

                                {/* Checkbox / Status Indicator */}
                                <div className="pt-1">
                                    {isEditable ? (
                                        <input
                                            type="checkbox"
                                            checked={isCompleted}
                                            onChange={() => onStepChange(isCompleted ? stage.id - 1 : stage.id)}
                                            className="w-6 h-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    ) : (
                                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${isCompleted ? 'bg-green-500 border-green-500' : 'border-slate-200'
                                            }`}>
                                            {isCompleted && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
