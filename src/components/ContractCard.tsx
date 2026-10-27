import React from 'react';

interface ContractCardProps {
  symbol: string;
  role: string;
  lotGrams: number;
  quoteGrams: number;
  purity: number;
  purityLabel: string;
  expiryWindow: string;
  description: string;
}

export const ContractCard: React.FC<ContractCardProps> = ({
  symbol,
  role,
  lotGrams,
  quoteGrams,
  purityLabel,
  expiryWindow,
  description,
}) => {
  return (
    <div className="contract-card">
      <div className="contract-symbol">{symbol}</div>
      <div className="contract-role-tag">{role}</div>

      <ul className="contract-specs-list">
        <li className="contract-spec-item">
          <span>Deliverable Lot</span>
          <span className="contract-spec-val">{lotGrams} grams</span>
        </li>
        <li className="contract-spec-item">
          <span>Quote Unit</span>
          <span className="contract-spec-val">{quoteGrams} grams</span>
        </li>
        <li className="contract-spec-item">
          <span>Gold Fineness</span>
          <span className="contract-spec-val">{purityLabel}</span>
        </li>
        <li className="contract-spec-item">
          <span>Expiry Cycle</span>
          <span className="contract-spec-val">{expiryWindow}</span>
        </li>
      </ul>

      <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {description}
      </p>
    </div>
  );
};
