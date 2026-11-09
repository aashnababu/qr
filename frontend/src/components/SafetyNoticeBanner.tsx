import React from 'react';
import { AlertTriangle, PhoneCall, Radio } from 'lucide-react';

interface SafetyNoticeProps {
  compact?: boolean;
}

export const SafetyNoticeBanner: React.FC<SafetyNoticeProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider text-[11px] text-rose-700 block">
            Emergency Notice
          </span>
          This is an auxiliary request system. For acute medical emergencies, immediately pull the physical call cord or shout for nursing staff.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-200 animate-urgent-pulse">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm sm:text-base font-bold text-rose-950 uppercase tracking-wide">
              Critical Emergency Safety Notice
            </h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
              Auxiliary System
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
            This digital QR calling tool is an <strong className="font-bold underline decoration-rose-400">auxiliary assistance service</strong> for non-acute patient comfort and routine needs.
          </p>
          <div className="mt-2.5 pt-2.5 border-t border-rose-200/80 flex flex-wrap items-center gap-3 text-xs text-rose-950 font-semibold">
            <span className="flex items-center space-x-1.5 text-rose-800">
              <Radio className="w-4 h-4 text-rose-600" />
              <span>For chest pain, choking, or collapse:</span>
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-rose-600 text-white shadow-sm font-bold">
              <PhoneCall className="w-3.5 h-3.5 mr-1" /> Press Physical Bedside Red Alarm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

