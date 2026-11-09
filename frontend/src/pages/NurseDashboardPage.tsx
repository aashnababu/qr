import React, { useEffect, useState } from 'react';
import {
  Bell,
  GlassWater,
  Accessibility,
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle,
  UserCheck,
  RotateCw,
  Bed as BedIcon,
  Search,
  Volume2,
  VolumeX,
  CheckCheck,
} from 'lucide-react';
import { assistanceApi } from '../services/api';
import {
  PatientAssistanceRequest,
  RequestType,
  RequestStatus,
  REQUEST_TYPE_CONFIG,
} from '../types/assistance';

export const NurseDashboardPage: React.FC = () => {
  const [requests, setRequests] = useState<PatientAssistanceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const prevCountRef = React.useRef<number>(0);

  // Play audio chime for incoming urgent calls
  const playAlertChime = (isUrgent: boolean = false) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isUrgent ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isUrgent ? 880 : 587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isUrgent ? 1174.66 : 880, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext handled gracefully if blocked by browser policy
    }
  };

  // 1. Fetch active requests from /api/assistance/active
  const fetchActiveRequests = async (silent: boolean = false) => {
    try {
      if (!silent) setRefreshing(true);
      const data = await assistanceApi.getActiveRequests();

      // Detect incoming requests to sound chime
      if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
        const hasUrgent = data.some((r) => r.requestType === 'NURSE_CALL' && r.status === 'PENDING');
        playAlertChime(hasUrgent);
      }
      prevCountRef.current = data.length;

      setRequests(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active assistance requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. Automatically poll/refresh every 5 seconds (per requirement)
  useEffect(() => {
    fetchActiveRequests(false);
    const pollInterval = setInterval(() => {
      fetchActiveRequests(true);
    }, 5000); // 5000ms = 5 seconds

    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(clockInterval);
    };
  }, []);

  // 3. Nurse Action: Acknowledge (IN_PROGRESS) or Resolve (RESOLVED)
  const handleUpdateStatus = async (id: string, newStatus: RequestStatus) => {
    try {
      setActionInProgress(id);
      const updated = await assistanceApi.updateStatus(id, newStatus);

      // Requirement: Automatically remove resolved items from the active view
      if (newStatus === 'RESOLVED') {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      }
    } catch (err: any) {
      alert(`Could not update status: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  // Calculate elapsed time from submission
  const getElapsedDisplay = (submittedAt: string) => {
    const diffMs = currentTime.getTime() - new Date(submittedAt).getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffSecs = Math.max(0, Math.floor((diffMs % 60000) / 1000));

    if (diffMins < 1) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ${diffSecs}s ago`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`;
  };

  // Filtered requests
  const filteredRequests = requests.filter((req) => {
    if (filterStatus === 'PENDING' && req.status !== 'PENDING') return false;
    if (filterStatus === 'IN_PROGRESS' && req.status !== 'IN_PROGRESS') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const room = req.bed?.roomNumber?.toLowerCase() || '';
      const bedNum = req.bed?.bedNumber?.toLowerCase() || '';
      const bedId = req.bedId.toLowerCase();
      const note = req.customNote?.toLowerCase() || '';
      const type = req.requestType.toLowerCase();

      if (!room.includes(q) && !bedNum.includes(q) && !bedId.includes(q) && !note.includes(q) && !type.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const getRequestIcon = (type: RequestType) => {
    switch (type) {
      case 'NURSE_CALL':
        return <Bell className="w-5 h-5 text-rose-600" />;
      case 'DRINKING_WATER':
        return <GlassWater className="w-5 h-5 text-blue-600" />;
      case 'HELP_OUT_OF_BED':
        return <Accessibility className="w-5 h-5 text-amber-600" />;
      case 'GENERAL_ASSISTANCE':
        return <HelpCircle className="w-5 h-5 text-teal-600" />;
      case 'OTHER':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS').length;
  const urgentCount = requests.filter(
    (r) => r.requestType === 'NURSE_CALL' && r.status === 'PENDING'
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Dedicated Nurse Station Desktop Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black">
              🏥
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight">MediFlow Core</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-900 text-teal-300 border border-teal-700">
                  Nurse Station
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Inpatient Ward Active Call Monitor</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAlertChime(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                soundEnabled
                  ? 'bg-slate-800 text-teal-400 border border-slate-700'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            {/* Manual refresh button */}
            <button
              onClick={() => fetchActiveRequests(false)}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Live Clock */}
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-teal-300 text-xs font-mono font-bold border border-slate-700">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Error notification banner */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        {/* High-priority call banner */}
        {urgentCount > 0 && (
          <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white text-rose-600 flex items-center justify-center font-bold">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base">
                  {urgentCount} High-Priority Emergency Call{urgentCount > 1 ? 's' : ''} Awaiting Attention!
                </h3>
                <p className="text-xs text-rose-100">
                  Please acknowledge immediately to alert the bedside patient that help is en route.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFilterStatus('PENDING');
                setSearchQuery('NURSE_CALL');
              }}
              className="px-3.5 py-1.5 bg-white text-rose-700 font-bold rounded-xl text-xs hover:bg-rose-50 transition"
            >
              Filter Urgent
            </button>
          </div>
        )}

        {/* Dashboard Metric Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Active</span>
              <p className="text-3xl font-black text-slate-900 mt-0.5">{requests.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <BedIcon className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('PENDING')}
            className={`cursor-pointer p-5 rounded-2xl border transition shadow-sm flex items-center justify-between ${
              filterStatus === 'PENDING'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300/40'
                : 'bg-white border-slate-200 hover:border-amber-200'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-700">Pending Attention</span>
              <p className="text-3xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`cursor-pointer p-5 rounded-2xl border transition shadow-sm flex items-center justify-between ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-300/40'
                : 'bg-white border-slate-200 hover:border-sky-200'
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase text-sky-700">In Progress</span>
              <p className="text-3xl font-black text-sky-600 mt-0.5">{inProgressCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-rose-600">Urgent Nurse Calls</span>
              <p className="text-3xl font-black text-rose-600 mt-0.5">{urgentCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex-1 md:flex-none ${
                filterStatus === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Active ({requests.length})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex-1 md:flex-none ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('IN_PROGRESS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex-1 md:flex-none ${
                filterStatus === 'IN_PROGRESS'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Progress ({inProgressCount})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter room, bed, request, or note..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Polling Notice */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
            Polling active queue every 5 seconds
          </span>
          <span>Last sync: {lastUpdated.toLocaleTimeString()}</span>
        </div>

        {/* Active Requests Card Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <RotateCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading nurse call station queue...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
              <CheckCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Active Assistance Calls</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No calls match the search criteria.'
                : 'All patient assistance requests are acknowledged or resolved.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRequests.map((request) => {
              const config = REQUEST_TYPE_CONFIG[request.requestType] || {
                label: request.requestType,
                badgeColor: 'bg-slate-100 text-slate-800',
              };

              const isProcessing = actionInProgress === request.id;
              const isPending = request.status === 'PENDING';
              const isNurseCall = request.requestType === 'NURSE_CALL';
              const elapsedStr = getElapsedDisplay(request.submittedAt);

              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-3xl p-5 border-2 shadow-sm flex flex-col justify-between transition ${
                    isNurseCall && isPending
                      ? 'border-rose-400 ring-2 ring-rose-200/50 bg-rose-50/10'
                      : isPending
                      ? 'border-amber-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header: Room Number, Bed ID, Status Badge */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Room {request.bed?.roomNumber || '—'}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {request.bed?.bedNumber || '—'}
                          </span>
                        </div>
                        {/* Bed ID */}
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Bed ID: <span className="text-slate-600 font-semibold">{request.bedId}</span>
                        </p>
                      </div>

                      {/* Current Status Badge */}
                      <div>
                        {isPending ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                            <UserCheck className="w-3 h-3 mr-1" />
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Request Type Badge & Elapsed Time */}
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                          {getRequestIcon(request.requestType)}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block leading-tight">
                            {config.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {request.requestType}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {elapsedStr}
                      </span>
                    </div>

                    {/* Custom Note */}
                    {request.customNote ? (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-[10px] uppercase text-slate-400 block">
                          Patient Note:
                        </span>
                        <p className="mt-0.5 italic">"{request.customNote}"</p>
                      </div>
                    ) : (
                      <div className="mt-2.5 text-[11px] text-slate-400 italic">
                        No custom note provided.
                      </div>
                    )}

                    {/* Submission Time */}
                    <div className="mt-3 text-[11px] text-slate-400 font-mono">
                      Submitted: {new Date(request.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  {/* Clear Status-Action Buttons for Nurses */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    {isPending ? (
                      <>
                        {/* Acknowledge Button */}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(request.id, 'IN_PROGRESS')}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Acknowledge</span>
                        </button>

                        {/* Direct Resolve Button */}
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleUpdateStatus(request.id, 'RESOLVED')}
                          className="py-2.5 px-3 rounded-xl border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition disabled:opacity-50 flex items-center space-x-1"
                          title="Mark directly as resolved"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </>
                    ) : (
                      /* In Progress -> Resolve Button */
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleUpdateStatus(request.id, 'RESOLVED')}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Resolve Request</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default NurseDashboardPage;
