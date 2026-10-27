import React from 'react';
import { WorkspaceTabId } from '../types/aura';
import { useTerminal } from '../store/terminalStore';

interface WorkspaceTabDef {
  id: WorkspaceTabId;
  label: string;
}

const WORKSPACE_TABS: WorkspaceTabDef[] = [
  { id: 1, label: 'Spread & Normalisation' },
  { id: 2, label: 'Curve & Carry Trap' },
  { id: 3, label: 'Walk-Forward Lab' },
  { id: 4, label: 'Contract Lifecycle' },
  { id: 5, label: '5-Level Order Book & Data' },
  { id: 6, label: 'Research Board' },
];

export const WorkspaceNav: React.FC = () => {
  const { activeWorkspace, setActiveWorkspace, refreshAll, isLoading } = useTerminal();

  return (
    <div className="command-bar-tier2">
      <div className="workspace-nav-tabs">
        {WORKSPACE_TABS.map((tab) => {
          const isActive = activeWorkspace === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveWorkspace(tab.id)}
              className={`workspace-tab-btn ${isActive ? 'active' : ''}`}
              title={`Switch to [${tab.id}] (Hotkey: ${tab.id})`}
            >
              <span className="key-cap">{tab.id}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="nav-actions">
        <button
          className="btn-primary"
          onClick={() => refreshAll()}
          title="Reload data from FastAPI backend"
        >
          <span>{isLoading ? 'Syncing...' : 'Refresh Data'}</span>
        </button>
      </div>
    </div>
  );
};
