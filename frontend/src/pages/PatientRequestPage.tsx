import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BellRing,
  GlassWater,
  Accessibility,
  HelpCircle,
  MessageSquare,
  Bed as BedIcon,
  MapPin,
  Send,
  Loader2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { assistanceApi } from '../services/api';
import { Bed, RequestType, REQUEST_TYPE_CONFIG } from '../types/assistance';
import { SafetyNoticeBanner } from '../components/SafetyNoticeBanner';

export const PatientRequestPage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const navigate = useNavigate();

  const [bed, setBed] = useState<Bed | null>(null);
  const [loadingBed, setLoadingBed] = useState<boolean>(true);
  const [bedError, setBedError] = useState<string | null>(null);

  // Selected assistance type and optional note
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [customNote, setCustomNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!qrToken) {
      setBedError('Missing QR token in URL. Please scan a valid bed QR code.');
      setLoadingBed(false);
      return;
    }

    async function loadBed() {
      try {
        setLoadingBed(true);
        setBedError(null);
        const data = await assistanceApi.getBedByToken(qrToken!);
        setBed(data);
      } catch (err: any) {
        setBedError(err.message || 'Unable to identify bed. Please contact hospital staff.');
      } finally {
        setLoadingBed(false);
      }
    }

    loadBed();
  }, [qrToken]);

  const handleSelectType = (type: RequestType) => {
    setSelectedType(type);
    setSubmitError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bed || !selectedType || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const newRequest = await assistanceApi.createRequest({
        bedId: bed.id,
        requestType: selectedType,
        customNote: customNote.trim() || undefined,
      });

      // Navigate to Screen 3: Request Confirmation View with request ID and bed token
      navigate(`/request/${newRequest.id}`, {
        state: { request: newRequest, bedToken: qrToken },
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit assistance request. Please try again.');
      setSubmitting(false);
    }
  };

  const getIcon = (type: RequestType) => {
    switch (type) {
      case 'NURSE_CALL':
        return <BellRing className="w-6 h-6 sm:w-7 sm:h-7" />;
      case 'DRINKING_WATER':
        return <GlassWater className="w-6 h-6 sm:w-7 sm:h-7" />;
      case 'HELP_OUT_OF_BED':
        return <Accessibility className="w-6 h-6 sm:w-7 sm:h-7" />;
      case 'GENERAL_ASSISTANCE':
        return <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7" />;
      case 'OTHER':
        return <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />;
      default:
        return <HelpCircle className="w-6 h-6" />;
    }
  };

  if (loadingBed) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Reading Bed QR Code...</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Connecting to MediFlow Core Hospital System to verify your bedside location.
        </p>
      </div>
    );
  }

  if (bedError || !bed) {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-8 mt-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-200 shadow-xl shadow-red-50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4 text-red-600">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Bed Location Not Found</h2>
          <p className="text-sm text-slate-600 mt-2 mb-6">{bedError}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-teal-600 text-white rounded-xl font-semibold shadow hover:bg-teal-700 transition"
            >
              Retry Scanning
            </button>
            <button
              onClick={() => navigate('/qr-directory')}
              className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition"
            >
              Browse Demo Bed QR Codes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Bed Location Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-inner flex-shrink-0">
            <BedIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Active Bed Station
              </span>
              <span className="text-xs text-slate-400 font-mono">#{bed.qrToken}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">
              Room {bed.roomNumber} <span className="text-teal-600">•</span> {bed.bedNumber}
            </h1>
            <p className="text-xs text-slate-500 flex items-center mt-0.5">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> Inpatient Care Ward
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-slate-700">Staff Station Online</span>
        </div>
      </div>

      {/* Prominent Emergency Safety Warning Banner */}
      <SafetyNoticeBanner />

      {/* Request Options Selection */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            What assistance do you need?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a service category below to alert the nursing station directly.
          </p>
        </div>

        {/* Assistance Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(Object.keys(REQUEST_TYPE_CONFIG) as RequestType[]).map((type) => {
            const config = REQUEST_TYPE_CONFIG[type];
            const isSelected = selectedType === type;
            const isNurseCall = type === 'NURSE_CALL';

            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelectType(type)}
                className={`relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 flex items-start space-x-4 ${
                  isSelected
                    ? `${config.borderColor} bg-slate-50 shadow-md ring-2 ring-teal-500/30 scale-[1.01]`
                    : `border-slate-200 bg-white ${config.buttonHover} hover:shadow-sm`
                } ${isNurseCall ? 'sm:col-span-2 bg-gradient-to-r from-white to-rose-50/40' : ''}`}
              >
                {/* Icon Badge */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                    isSelected
                      ? `${config.buttonBg}`
                      : `${config.badgeColor} border`
                  }`}
                >
                  {getIcon(type)}
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-slate-900">
                      {config.label}
                    </span>
                    {isNurseCall && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-xs">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {config.description}
                  </p>
                </div>

                {/* Selection Checkmark */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 fill-current" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Note Input (optional) */}
        {selectedType && (
          <div className="mt-6 pt-5 border-t border-slate-200 animate-fadeIn">
            <label htmlFor="customNote" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Add optional note for the nurse:
            </label>
            <div className="relative">
              <textarea
                id="customNote"
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please bring extra blanket, glass of warm water, or feeling slight pain..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
                maxLength={240}
              />
              <span className="absolute bottom-2.5 right-3 text-[11px] text-slate-400">
                {customNote.length}/240
              </span>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            disabled={!selectedType || submitting}
            onClick={() => handleSubmit()}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center space-x-2.5 shadow-lg transition duration-200 ${
              !selectedType || submitting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : selectedType === 'NURSE_CALL'
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 active:scale-[0.99]'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 active:scale-[0.99]'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Transmitting Request to Nurses...</span>
              </>
            ) : selectedType ? (
              <>
                <Send className="w-5 h-5" />
                <span>
                  Submit {REQUEST_TYPE_CONFIG[selectedType].label} Request
                </span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
              </>
            ) : (
              <span>Please select an assistance type above</span>
            )}
          </button>
        </div>

        {/* Fast assurance footnote */}
        <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Logged directly to Central Nurse Station Dashboard</span>
        </div>
      </div>
    </div>
  );
};
