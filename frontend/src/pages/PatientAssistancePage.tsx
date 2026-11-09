import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Bell,
  GlassWater,
  Accessibility,
  HelpCircle,
  MessageSquare,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Bed as BedIcon,
  RotateCw,
  PlusCircle,
} from 'lucide-react';
import { assistanceApi } from '../services/api';
import {
  Bed,
  RequestType,
  RequestStatus,
  PatientAssistanceRequest,
} from '../types/assistance';

export const PatientAssistancePage: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();

  // Bed state
  const [bed, setBed] = useState<Bed | null>(null);
  const [loadingBed, setLoadingBed] = useState<boolean>(true);
  const [bedError, setBedError] = useState<string | null>(null);

  // Form state
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [customNote, setCustomNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Submitted request confirmation state
  const [activeRequest, setActiveRequest] = useState<PatientAssistanceRequest | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState<boolean>(false);

  // 1. Fetch Bed details dynamically on mount
  useEffect(() => {
    let isMounted = true;

    async function loadBedDetails() {
      if (!qrToken) {
        setBedError('No bed QR token found. Please rescan the bedside QR code.');
        setLoadingBed(false);
        return;
      }

      try {
        setLoadingBed(true);
        setBedError(null);
        const data = await assistanceApi.getBedByToken(qrToken.trim());
        if (isMounted) {
          setBed(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setBedError(err.message || 'Unable to locate bed. Please ask a nurse for assistance.');
        }
      } finally {
        if (isMounted) {
          setLoadingBed(false);
        }
      }
    }

    loadBedDetails();

    return () => {
      isMounted = false;
    };
  }, [qrToken]);

  // 2. Poll active request status if submitted
  useEffect(() => {
    if (!activeRequest || activeRequest.status === 'RESOLVED') return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        setIsPollingStatus(true);
        const latest = await assistanceApi.getRequestById(activeRequest.id);
        if (isMounted && latest) {
          setActiveRequest(latest);
        }
      } catch (err) {
        console.error('Error polling request status:', err);
      } finally {
        if (isMounted) {
          setIsPollingStatus(false);
        }
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeRequest?.id, activeRequest?.status]);

  // 3. Handle request submission
  const handleSubmitRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bed || !selectedType || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const request = await assistanceApi.createRequest({
        bedId: bed.id,
        requestType: selectedType,
        customNote: customNote.trim() || undefined,
      });

      // Smooth transition to confirmation view
      setActiveRequest(request);
      // Reset form fields
      setSelectedType(null);
      setCustomNote('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit request. Please try again or alert staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pending Nurse Pickup
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            Nurse In Progress / En Route
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Completed
          </span>
        );
    }
  };

  const getReadableType = (type: RequestType) => {
    switch (type) {
      case 'NURSE_CALL':
        return 'Urgent Nurse Call';
      case 'DRINKING_WATER':
        return 'Drinking Water';
      case 'HELP_OUT_OF_BED':
        return 'Help Out of Bed';
      case 'GENERAL_ASSISTANCE':
        return 'General Assistance';
      case 'OTHER':
        return 'Other Assistance';
      default:
        return type;
    }
  };

  // --------------------------------------------------------------------------
  // Loading & Error States
  // --------------------------------------------------------------------------
  if (loadingBed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mb-4 shadow-sm">
          <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Verifying Bed Location...</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Scanning MediFlow Core system for bedside station #{qrToken}
        </p>
      </div>
    );
  }

  if (bedError || !bed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-rose-200 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Bed Identification Failed</h2>
          <p className="text-xs text-slate-600 mt-1.5 mb-5">{bedError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-teal-600 text-white rounded-xl text-sm font-bold shadow hover:bg-teal-700 transition"
          >
            Retry Scan
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Screen: Request Confirmation Screen (Active Request)
  // --------------------------------------------------------------------------
  if (activeRequest) {
    const isResolved = activeRequest.status === 'RESOLVED';

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-4 sm:p-6">
        <div className="space-y-4">
          {/* Bed header */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <BedIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Patient Bedside
                </span>
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  Room {bed.roomNumber} • {bed.bedNumber}
                </h2>
              </div>
            </div>
            {isPollingStatus && (
              <span className="flex items-center text-[10px] text-teal-600 font-semibold">
                <RotateCw className="w-3 h-3 animate-spin mr-1" />
                Syncing
              </span>
            )}
          </div>

          {/* Active Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center shadow-sm">
              {isResolved ? (
                <div className="w-full h-full rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : activeRequest.status === 'IN_PROGRESS' ? (
                <div className="w-full h-full rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <UserCheck className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {isResolved
                ? 'Request Resolved'
                : activeRequest.status === 'IN_PROGRESS'
                ? 'Nurse is Attending'
                : 'Call Dispatched'}
            </h3>

            <p className="text-xs text-slate-500 mt-1">
              {isResolved
                ? 'Your request has been marked complete by the nurse.'
                : activeRequest.status === 'IN_PROGRESS'
                ? 'A nurse has acknowledged your call and is coming to your bed.'
                : 'Your call is queued at the Central Nurse Station.'}
            </p>

            <div className="mt-4 flex justify-center">
              {renderStatusBadge(activeRequest.status)}
            </div>

            {/* Request Summary */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Request:</span>
                <span className="font-bold text-slate-900">
                  {getReadableType(activeRequest.requestType)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Logged at:</span>
                <span className="font-mono text-slate-700">
                  {new Date(activeRequest.submittedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {activeRequest.customNote && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Your Note:
                  </span>
                  <p className="italic text-slate-700 mt-0.5">"{activeRequest.customNote}"</p>
                </div>
              )}
            </div>
          </div>

          {/* New Request Button */}
          <button
            onClick={() => setActiveRequest(null)}
            className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-2xl shadow-sm flex items-center justify-center space-x-2 transition"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Need Something Else? Request Again</span>
          </button>
        </div>

        {/* Required Safety Disclaimer */}
        <div className="mt-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
          <p className="text-[11px] font-bold text-rose-900 leading-tight">
            ⚠️ Auxiliary assistance channel. For emergencies, use physical nurse call buttons.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Screen: Patient Request Selection Screen (Mobile Optimized)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between max-w-md mx-auto p-4 sm:p-5">
      <div className="space-y-4">
        {/* Bed Location Identification Header */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shadow-inner">
              <BedIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Bed Station
              </span>
              <h1 className="text-xl font-black text-slate-900 leading-none mt-0.5">
                Room {bed.roomNumber} • {bed.bedNumber}
              </h1>
            </div>
          </div>
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
            Connected
          </span>
        </div>

        {/* Prominent Emergency Warning */}
        <div className="p-3.5 bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-2 border-rose-300 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center flex-shrink-0 font-black text-xs">
              !
            </div>
            <p className="text-xs font-bold text-rose-950 leading-tight">
              ⚠️ Auxiliary assistance channel. For emergencies, use physical nurse call buttons.
            </p>
          </div>
        </div>

        {/* Assistance Quick-Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* 1. Nurse Call (Emergency Style) */}
          <button
            type="button"
            onClick={() => setSelectedType('NURSE_CALL')}
            className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-200 shadow-sm ${
              selectedType === 'NURSE_CALL'
                ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400/40 shadow-rose-100 scale-[1.01]'
                : 'border-rose-200 bg-white hover:border-rose-300'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-200 flex-shrink-0">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-black text-rose-950">
                    Nurse Call
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white">
                    Emergency Style
                  </span>
                </div>
                <p className="text-xs text-rose-800 mt-0.5">
                  Direct urgent call to attending bedside nurse
                </p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'NURSE_CALL'
                  ? 'border-rose-600 bg-rose-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedType === 'NURSE_CALL' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* 2. Need Drinking Water */}
          <button
            type="button"
            onClick={() => setSelectedType('DRINKING_WATER')}
            className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-150 ${
              selectedType === 'DRINKING_WATER'
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400/30 shadow-sm scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                <GlassWater className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Need Drinking Water
                </span>
                <span className="text-xs text-slate-500">Fresh water or warm beverage refill</span>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'DRINKING_WATER'
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedType === 'DRINKING_WATER' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* 3. Help Out of Bed */}
          <button
            type="button"
            onClick={() => setSelectedType('HELP_OUT_OF_BED')}
            className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-150 ${
              selectedType === 'HELP_OUT_OF_BED'
                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/30 shadow-sm scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Accessibility className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Help Out of Bed
                </span>
                <span className="text-xs text-slate-500">Walking, washroom, or wheelchair support</span>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'HELP_OUT_OF_BED'
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedType === 'HELP_OUT_OF_BED' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* 4. General Assistance */}
          <button
            type="button"
            onClick={() => setSelectedType('GENERAL_ASSISTANCE')}
            className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-150 ${
              selectedType === 'GENERAL_ASSISTANCE'
                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400/30 shadow-sm scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  General Assistance
                </span>
                <span className="text-xs text-slate-500">Pillow, blanket, lighting, or room help</span>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'GENERAL_ASSISTANCE'
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedType === 'GENERAL_ASSISTANCE' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          {/* 5. Other */}
          <button
            type="button"
            onClick={() => setSelectedType('OTHER')}
            className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all duration-150 ${
              selectedType === 'OTHER'
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400/30 shadow-sm scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Other Assistance
                </span>
                <span className="text-xs text-slate-500">Any special request or question</span>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'OTHER'
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {selectedType === 'OTHER' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        </div>

        {/* Optional Custom Note Field */}
        <div className="pt-2">
          <label htmlFor="patientCustomNote" className="block text-xs font-bold text-slate-700 mb-1.5">
            Optional note for the nurse:
          </label>
          <textarea
            id="patientCustomNote"
            rows={2}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Please bring extra blanket, glass of water..."
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            maxLength={200}
          />
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {submitError}
          </div>
        )}

        {/* Primary Submit Button */}
        <button
          type="button"
          disabled={!selectedType || isSubmitting}
          onClick={() => handleSubmitRequest()}
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 shadow-lg transition duration-200 ${
            !selectedType || isSubmitting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : selectedType === 'NURSE_CALL'
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 active:scale-[0.99]'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200 active:scale-[0.99]'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending Call to Nurses...</span>
            </>
          ) : selectedType ? (
            <>
              <Send className="w-4 h-4" />
              <span>Send {getReadableType(selectedType)} Call</span>
            </>
          ) : (
            <span>Select an option above to send call</span>
          )}
        </button>
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-6 pt-3 border-t border-slate-200 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          MediFlow Core Bedside Assistance • Room {bed.roomNumber}
        </p>
      </div>
    </div>
  );
};

export default PatientAssistancePage;

