import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  ExternalLink,
  Bed as BedIcon,
  Sparkles,
  RotateCw,
  Search,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { assistanceApi } from '../services/api';
import { Bed } from '../types/assistance';
import { QrPlacardModal } from '../components/QrPlacardModal';

export const QrDirectoryPage: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [customToken, setCustomToken] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [selectedBedForModal, setSelectedBedForModal] = useState<Bed | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadBeds() {
      try {
        setLoading(true);
        const data = await assistanceApi.getAllBeds();
        setBeds(data);
      } catch (err) {
        console.error('Failed to load beds:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBeds();
  }, []);

  const handleLaunchCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customToken.trim()) {
      navigate(`/bed/${encodeURIComponent(customToken.trim())}`);
    }
  };

  const filteredBeds = beds.filter(
    (b) =>
      b.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.qrToken.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-600/50 backdrop-blur-sm border border-teal-400/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>MediFlow Core Bedside Assistance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Bedside QR Codes & Testing Directory
          </h1>
          <p className="mt-2 text-teal-100 text-sm sm:text-base leading-relaxed">
            In hospital deployment, each bed features a unique laminated QR token. Scan or tap any bed below to simulate a patient calling for assistance on mobile or desktop.
          </p>
        </div>

        {/* Action button to jump to nurse dashboard */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/nurse/dashboard"
            className="px-5 py-2.5 rounded-xl bg-white text-teal-800 font-bold text-sm shadow hover:bg-teal-50 transition flex items-center space-x-2"
          >
            <span>Open Central Nurse Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Simulator Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <h2 className="text-sm font-bold text-slate-800">Scan Simulator</h2>
          <p className="text-xs text-slate-500">
            Have a custom QR token? Test navigation instantly.
          </p>
        </div>
        <form onSubmit={handleLaunchCustom} className="flex items-center space-x-2 w-full md:w-auto">
          <input
            type="text"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            placeholder="e.g. QR-ROOM101-BEDA"
            className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1"
          >
            <QrCode className="w-4 h-4" />
            <span>Simulate Scan</span>
          </button>
        </form>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bed, room, token..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredBeds.length} configured bed stations
        </span>
      </div>

      {/* Beds Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <RotateCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading registered hospital beds...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBeds.map((bed) => {
            const qrUrl = `/bed/${encodeURIComponent(bed.qrToken)}`;

            return (
              <div
                key={bed.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Bed Badge */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                        <BedIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-700">
                          Room {bed.roomNumber}
                        </div>
                        <h3 className="text-lg font-black text-slate-900">{bed.bedNumber}</h3>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedBedForModal(bed)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Print / View Bedside Placard"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>

                  {/* QR Card Mock Visual */}
                  <div
                    onClick={() => setSelectedBedForModal(bed)}
                    className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-4 cursor-pointer hover:bg-teal-50/50 transition"
                  >
                    <div className="w-16 h-16 bg-white p-1 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-12 h-12 text-slate-900" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-slate-700 block">Bedside QR Placard</span>
                      <p className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                        {bed.qrToken}
                      </p>
                      <span className="inline-block mt-1 text-[10px] text-teal-600 font-semibold underline">
                        Click to view / print placard
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Link */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    to={qrUrl}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
                  >
                    <span>Launch Patient Call Screen</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Link>
                  <button
                    onClick={() => setSelectedBedForModal(bed)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                    title="Print placard"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Placard Modal */}
      <QrPlacardModal
        bed={selectedBedForModal}
        onClose={() => setSelectedBedForModal(null)}
      />
    </div>
  );
};
