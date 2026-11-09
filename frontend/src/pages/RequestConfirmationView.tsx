import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Bed as BedIcon,
  PlusCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { assistanceApi } from '../services/api';
import {
  PatientAssistanceRequest,
  RequestStatus,
  REQUEST_TYPE_CONFIG,
} from '../types/assistance';
import { SafetyNoticeBanner } from '../components/SafetyNoticeBanner';

export const RequestConfirmationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const initialRequest = (location.state as any)?.request as
    | PatientAssistanceRequest
    | undefined;

  const [request, setRequest] = useState<PatientAssistanceRequest | null>(
    initialRequest || null
  );
  const [loading, setLoading] = useState<boolean>(!initialRequest);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const prevStatusRef = useRef<RequestStatus | null>(request?.status || null);

  // Poll for live status updates every 3.5 seconds
  useEffect(() => {
    if (!id) {
      setError('No request identifier provided.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchLatest() {
      try {
        const data = await assistanceApi.getRequestById(id!);
        if (isMounted) {
          if (prevStatusRef.current && prevStatusRef.current !== data.status) {
            console.log(`Status changed from ${prevStatusRef.current} to ${data.status}`);
          }
          prevStatusRef.current = data.status;
          setRequest(data);
          setError(null);
          setLastRefreshed(new Date());
        }
      } catch (err: any) {
        if (isMounted && !request) {
          setError(err.message || 'Could not load request status.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLatest();
    const interval = setInterval(fetchLatest, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Retrieving Request Status...</h3>
        <p className="text-xs text-slate-500 mt-1">Checking live nurse dispatch queue...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto p-6 mt-8">
        <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">Request Not Found</h3>
          <p className="text-sm text-slate-600 mt-2 mb-4">{error}</p>
          <button
            onClick={() => navigate('/qr-directory')}
            className="w-full py-2.5 px-4 bg-teal-600 text-white rounded-xl font-semibold shadow hover:bg-teal-700"
          >
            Go to Bed Directory
          </button>
        </div>
      </div>
    );
  }

  const typeConfig = REQUEST_TYPE_CONFIG[request.requestType] || {
    label: request.requestType,
    badgeColor: 'bg-slate-100 text-slate-800',
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Pending Nurse Pickup
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300 shadow-sm animate-pulse">
            <UserCheck className="w-3.5 h-3.5 mr-1.5" />
            Nurse In Progress / En Route
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Resolved & Completed
          </span>
        );
    }
  };

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const qrTokenToUse = request.bed?.qrToken || (location.state as any)?.bedToken;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Top Banner Status */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center relative overflow-hidden">
        {/* Subtle accent bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            request.status === 'RESOLVED'
              ? 'bg-emerald-500'
              : request.status === 'IN_PROGRESS'
              ? 'bg-sky-500'
              : 'bg-amber-500'
          }`}
        />

        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-md">
          {request.status === 'RESOLVED' ? (
            <div className="w-full h-full rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          ) : request.status === 'IN_PROGRESS' ? (
            <div className="w-full h-full rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center animate-bounce">
              <UserCheck className="w-9 h-9" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center animate-pulse">
              <Clock className="w-9 h-9" />
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {request.status === 'RESOLVED'
            ? 'Assistance Completed'
            : request.status === 'IN_PROGRESS'
            ? 'Nurse is Attending to You'
            : 'Request Received'}
        </h1>

        <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
          {request.status === 'RESOLVED'
            ? 'Your request has been fulfilled. If you need any further help, tap below.'
            : request.status === 'IN_PROGRESS'
            ? 'A nurse has acknowledged your call and is attending to your room now.'
            : 'Your request has been broadcasted to the nursing station.'}
        </p>

        <div className="mt-4 flex items-center justify-center">
          {getStatusBadge(request.status)}
        </div>
      </div>

      {/* Request Details Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
          Request Details
        </h2>

        {/* Location Row */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BedIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Bed Location</span>
              <p className="text-sm font-bold text-slate-900">
                Room {request.bed?.roomNumber || '—'} • {request.bed?.bedNumber || '—'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
            {request.bed?.qrToken || 'Station QR'}
          </span>
        </div>

        {/* Request Type Row */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Assistance Type</span>
              <p className="text-sm font-bold text-slate-900">{typeConfig.label}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${typeConfig.badgeColor}`}>
            {request.requestType}
          </span>
        </div>

        {/* Custom Note (if provided) */}
        {request.customNote && (
          <div className="py-2 border-b border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Patient Note</span>
            <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-200 italic">
              "{request.customNote}"
            </p>
          </div>
        )}

        {/* Status Lifecycle Timeline */}
        <div className="pt-2">
          <span className="text-xs text-slate-400 font-medium block mb-3">Lifecycle Timeline</span>
          <div className="space-y-3 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Submitted */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Request Logged</span>
                <span className="text-slate-500 font-mono">{formatTime(request.submittedAt)}</span>
              </div>
            </div>

            {/* Step 2: Acknowledged */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow ${
                  request.acknowledgedAt ? 'bg-sky-500' : 'bg-slate-300'
                }`}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${request.acknowledgedAt ? 'text-slate-800' : 'text-slate-400'}`}>
                  Nurse Acknowledged
                </span>
                <span className="text-slate-500 font-mono">
                  {request.acknowledgedAt ? formatTime(request.acknowledgedAt) : 'Pending...'}
                </span>
              </div>
            </div>

            {/* Step 3: Resolved */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow ${
                  request.resolvedAt ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              />
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${request.resolvedAt ? 'text-slate-800' : 'text-slate-400'}`}>
                  Resolution Completed
                </span>
                <span className="text-slate-500 font-mono">
                  {request.resolvedAt ? formatTime(request.resolvedAt) : 'In progress...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Polling live feedback */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse mr-1.5" />
            Live status sync active (every 3.5s)
          </span>
          <span>Last sync: {lastRefreshed.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Safety Notice */}
      <SafetyNoticeBanner compact />

      {/* Navigation Options */}
      <div className="flex flex-col sm:flex-row gap-3">
        {qrTokenToUse && (
          <button
            onClick={() => navigate(`/bed/${qrTokenToUse}`)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center space-x-2 transition"
          >
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Submit Another Request for this Bed</span>
          </button>
        )}
        <Link
          to="/nurse/dashboard"
          className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow transition"
        >
          <span>Open Live Nurse Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
