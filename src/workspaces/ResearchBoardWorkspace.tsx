import React from 'react';
import { TerminalPanel } from '../components/TerminalPanel';
import { NormalisationMatrix } from '../components/NormalisationMatrix';
import { SignalGate } from '../components/SignalGate';
import { HedgeCalculator } from '../components/HedgeCalculator';
import { WalkForwardLab } from '../components/WalkForwardLab';
import { McxDataHygieneAuditor } from '../components/DataHygieneAuditor';
import { useTerminal } from '../store/terminalStore';

export const ResearchBoardWorkspace: React.FC = () => {
  const { summary } = useTerminal();
  const verdict = summary?.verdict;

  return (
    <div className="workspace-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Executive Verdict Banner */}
        <TerminalPanel
          title="Institutional Research Verdict // Track 03"
          badge="No-Edge Proof Validated"
        >
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--accent-tint)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                VERDICT: NO PERSISTENT RELATIVE-VALUE EDGE AFTER COSTS
              </div>
              <span className="gate-badge quiet" style={{ fontSize: '11px', fontWeight: 600 }}>
                Zero Active Capital Allocation
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {verdict?.reason ??
                'Across 398 sessions and 142 contracts, apparent pricing discrepancies between MCX gold futures collapse once bid-ask spreads, STT, exchange fees (13.0 bps hurdle), and contract roll-down carry are factored in. Development profits were 75.9% concentrated in a single stress-day print (30 Jan 2026), and out-of-sample holdout returns are -2.7 bps with bootstrap p = 0.52.'}
            </div>
          </div>
        </TerminalPanel>

        {/* 12-Column Comprehensive Research Layout */}
        <div className="grid-12">
          {/* Column 1 (4 cols): Normalisation & Hedge Mechanics */}
          <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <NormalisationMatrix />
            <HedgeCalculator />
          </div>

          {/* Column 2 (4 cols): Walk-Forward Lab & Outlier Auditor */}
          <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <WalkForwardLab />
            <SignalGate />
          </div>

          {/* Column 3 (4 cols): Data Hygiene & Execution Auditing */}
          <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <McxDataHygieneAuditor />
          </div>
        </div>
      </div>
    </div>
  );
};
