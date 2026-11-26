'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  HelpCircle,
  X,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  ListOrdered,
} from 'lucide-react';
import { SCREEN_HELP_REGISTRY, ScreenHelpInfo } from '../../config/screenHelp';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from './Button';

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  customSteps?: string[];
  stepsHi?: string[];
  titleHi?: string;
  titleEn?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  customSteps,
  stepsHi,
  titleHi,
  titleEn,
}) => {
  const pathname = usePathname();
  const { lang, t } = useLanguage();
  const [selectedRoute, setSelectedRoute] = useState<string>(pathname || '/factory/dashboard');
  const [activeTab, setActiveTab] = useState<'STEPS' | 'AUTO' | 'PRECAUTIONS'>('STEPS');

  useEffect(() => {
    if (pathname && SCREEN_HELP_REGISTRY[pathname]) {
      setSelectedRoute(pathname);
    }
  }, [pathname, isOpen]);

  if (!isOpen) return null;

  const currentInfo: ScreenHelpInfo = SCREEN_HELP_REGISTRY[selectedRoute] || {
    titleHi: 'सिस्टम निर्देश एवं सहायता',
    titleEn: 'System Guide & Help',
    summaryHi: 'यह मोल्डिन्स ईआरपी की सहायता प्रणाली है। नीचे दिए गए चरणों का पालन करके इस स्क्रीन पर आसानी से कार्य करें।',
    stepsHi: customSteps || [
      'फॉर्म में आवश्यक जानकारी भरें (लाल * वाले फील्ड अनिवार्य हैं)।',
      'AUTO फील्ड्स में लाइव सूत्र द्वारा स्वतः गणना होगी।',
      'फोटो अपलोड करते समय कैमरे से लाइव फोटो लें ताकि GPS दर्ज हो सके।',
      'कार्य पूरा होने पर "सुरक्षित करें" बटन दबाएं।',
    ],
    autoFieldsHi: [
      'AUTO फ़ील्ड्स में आपको स्वयं गणना करने की आवश्यकता नहीं है, सिस्टम अपने आप हिसाब लगाता है।',
    ],
    precautionsHi: [
      'रिकॉर्ड सेव करने से पहले दर्ज की गई मात्रा एवं दर की जांच कर लें।',
    ],
  };

  const allRegisteredRoutes = Object.keys(SCREEN_HELP_REGISTRY);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative bg-surface rounded max-w-2xl w-full border border-border shadow-modal flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand text-white rounded flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <div className="text-xs text-text-muted font-medium">
                {lang === 'hi' ? currentInfo.titleEn : currentInfo.titleHi}
              </div>
              <h3 className="text-lg font-semibold text-text-primary leading-tight mt-0.5">
                {lang === 'hi' ? currentInfo.titleHi : currentInfo.titleEn}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded hover:bg-page transition-colors cursor-pointer"
            aria-label="Close Help"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Screen Switcher Bar */}
        <div className="px-4 py-2 bg-page border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs text-text-secondary font-medium">
            {lang === 'hi' ? 'स्क्रीन गाइड चुनें:' : 'Select Screen Guide:'}
          </span>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="text-xs bg-surface border border-border rounded px-2.5 py-1 text-text-primary focus:outline-none focus:border-brand cursor-pointer"
          >
            {allRegisteredRoutes.map((route) => (
              <option key={route} value={route}>
                {lang === 'hi'
                  ? `${SCREEN_HELP_REGISTRY[route].titleHi} (${route})`
                  : `${SCREEN_HELP_REGISTRY[route].titleEn} (${route})`}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-surface px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('STEPS')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'STEPS'
                ? 'border-brand text-brand font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>{lang === 'hi' ? 'कार्य चरण (Step-by-Step)' : 'Process Steps'}</span>
          </button>

          {currentInfo.autoFieldsHi && currentInfo.autoFieldsHi.length > 0 && (
            <button
              onClick={() => setActiveTab('AUTO')}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'AUTO'
                  ? 'border-brand text-brand font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{lang === 'hi' ? 'ऑटो फ़ील्ड्स (AUTO)' : 'Auto Fields'}</span>
            </button>
          )}

          {currentInfo.precautionsHi && currentInfo.precautionsHi.length > 0 && (
            <button
              onClick={() => setActiveTab('PRECAUTIONS')}
              className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'PRECAUTIONS'
                  ? 'border-brand text-brand font-semibold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{lang === 'hi' ? 'सावधानियां (Rules)' : 'Important Rules'}</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[50vh]">
          {activeTab === 'STEPS' && (
            <div className="space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                {currentInfo.summaryHi}
              </p>
              <div className="space-y-2 mt-3">
                {currentInfo.stepsHi.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded border border-border bg-page flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-brand-subtle text-brand text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-xs text-text-primary leading-relaxed">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'AUTO' && currentInfo.autoFieldsHi && (
            <div className="space-y-2">
              {currentInfo.autoFieldsHi.map((autoText, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded border border-border bg-brand-subtle/40 flex items-start gap-2.5"
                >
                  <Calculator className="w-4 h-4 text-brand flex-shrink-0 mt-0.5 stroke-[1.75]" />
                  <span className="text-xs text-text-primary leading-relaxed">
                    {autoText}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'PRECAUTIONS' && currentInfo.precautionsHi && (
            <div className="space-y-2">
              {currentInfo.precautionsHi.map((precaution, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded border border-warning/30 bg-warning-bg flex items-start gap-2.5"
                >
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5 stroke-[1.75]" />
                  <span className="text-xs text-warning leading-relaxed font-medium">
                    {precaution}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-page border-t border-border flex items-center justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
