import React from 'react';
import { X, Printer, Bed as BedIcon, AlertTriangle, ExternalLink } from 'lucide-react';
import { Bed } from '../types/assistance';

interface QrPlacardModalProps {
  bed: Bed | null;
  onClose: () => void;
}

export const QrPlacardModal: React.FC<QrPlacardModalProps> = ({ bed, onClose }) => {
  if (!bed) return null;

  const currentOrigin = window.location.origin;
  const fullPatientUrl = `${currentOrigin}/bed/${encodeURIComponent(bed.qrToken)}`;
  // Using an image QR service for crisp, 100% standard scannable QR codes
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
    fullPatientUrl
  )}&margin=10`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">
          <BedIcon className="w-4 h-4" />
          <span>Bedside Printable Laminated Placard</span>
        </div>

        {/* Placard Card (Formatted for bedside mounting & printing) */}
        <div
          id="printable-bed-placard"
          className="mt-3 p-6 border-4 border-slate-900 rounded-3xl text-center bg-white shadow-inner"
        >
          {/* Hospital Header */}
          <div className="border-b-2 border-slate-900 pb-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              MediFlow Core • Inpatient Care Ward
            </span>
            <div className="flex items-center justify-center space-x-3 mt-1">
              <span className="text-3xl font-black text-slate-900">
                ROOM {bed.roomNumber}
              </span>
              <span className="text-2xl text-teal-600 font-black">•</span>
              <span className="text-3xl font-black text-slate-900">
                {bed.bedNumber}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="my-5 flex flex-col items-center justify-center">
            <div className="p-3 bg-white border-2 border-slate-300 rounded-2xl shadow-sm">
              <img
                src={qrImageUrl}
                alt={`QR code for Room ${bed.roomNumber} ${bed.bedNumber}`}
                className="w-52 h-52 object-contain mx-auto"
                loading="eager"
              />
            </div>
            <p className="mt-2 text-xs font-mono text-slate-600 font-bold">
              Token: {bed.qrToken}
            </p>
          </div>

          {/* Patient Instructions */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3 text-xs text-teal-950 font-medium">
            <p className="font-bold text-sm text-teal-900">
              📱 Scan with Smartphone Camera
            </p>
            <p className="mt-0.5 text-[11px] text-teal-800">
              Instant Nurse Calling • Drinking Water • Mobility Assistance
            </p>
          </div>

          {/* Safety Warning */}
          <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-900 font-semibold flex items-center justify-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            <span>Emergency: Pull bedside red cord or call out for nursing staff</span>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center space-x-2 shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Bed Placard</span>
          </button>

          <a
            href={fullPatientUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Link in New Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
};
