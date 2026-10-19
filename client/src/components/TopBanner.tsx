import React, { useEffect, useState } from 'react';

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
    <header className="border-b border-[#222F3A] bg-[#131A20] px-4 py-3 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Core Branding */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#10B981] animate-pulse"></span>
            <span className="font-bold text-sm tracking-widest text-[#E2E8F0]">
              MUTEX_LEDGER_CORE
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 bg-[#0B0F12] border border-[#222F3A] text-[#64748B] font-mono">
            v2.4.9-PROD
          </span>
          <span className="hidden md:inline-block text-xs text-[#64748B]">
            | CLUSTER_NODE: [EU-CENTRAL-04]
          </span>
        </div>

        {/* System State Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#0B0F12] border border-[#222F3A]">
            <span className="text-[#64748B]">ACID:</span>
            <span className="text-[#10B981] font-semibold">COMPLIANT</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#0B0F12] border border-[#222F3A]">
            <span className="text-[#64748B]">INTEGRITY:</span>
            <span className="text-[#10B981] font-semibold">SECURE [SHA-256]</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#0B0F12] border border-[#222F3A]">
            <span className="inline-block w-1.5 h-1.5 rounded-none bg-[#10B981]"></span>
            <span className="text-[#64748B]">WS_FEED:</span>
            <span className="text-[#10B981] font-semibold">ACTIVE</span>
            <span className="text-[#64748B] text-[10px]">({latency}ms)</span>
          </div>

          <div className="hidden lg:flex items-center px-2.5 py-1 bg-[#0B0F12] border border-[#222F3A] text-[#64748B]">
            <span>{timestamp || 'INITIALIZING_CLOCK...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
