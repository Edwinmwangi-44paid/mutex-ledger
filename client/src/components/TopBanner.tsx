import React, { useEffect, useState } from 'react';
import { Cpu, ShieldCheck, Clock } from 'lucide-react';

export const TopBanner: React.FC = () => {
  const [timestamp, setTimestamp] = useState<string>('');
  const [latency, setLatency] = useState<number>(3.2);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    const latencyTimer = setInterval(() => {
      setLatency(Number((2.8 + Math.random() * 1.4).toFixed(2)));
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(latencyTimer);
    };
  }, []);

  return (
    <header className="border-b border-[#1E293B] bg-[#0E141B]/95 backdrop-blur-md px-4 md:px-6 py-2.5 select-none sticky top-0 z-30">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Core Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0E141B] rounded-[6px] flex items-center justify-center">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-xs tracking-tight text-slate-100 flex items-center gap-1.5">
                MUTEX LEDGER
                <span className="text-[10px] font-mono font-medium text-slate-400">CORE</span>
              </span>
            </div>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#141C24] border border-[#1E293B] text-slate-400 font-mono">
            v2.5.0
          </span>
          <span className="hidden md:inline-block text-[11px] text-slate-500 font-mono">
            cluster: eu-central-04
          </span>
        </div>

        {/* System State Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#090D11] border border-[#1E293B] text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">ACID:</span>
            <span className="text-emerald-400 font-medium">SERIALIZABLE</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#090D11] border border-[#1E293B] text-[11px]">
            <span className="text-slate-400">LOCK:</span>
            <span className="text-slate-200 font-mono text-[10px]">PESSIMISTIC_ROW</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#090D11] border border-[#1E293B] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">WS Feed:</span>
            <span className="text-emerald-400 font-mono font-medium">{latency}ms</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#090D11] border border-[#1E293B] text-[11px] text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{timestamp || 'SYNCHRONIZING...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
