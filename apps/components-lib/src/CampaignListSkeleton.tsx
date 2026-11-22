import React from 'react';

export interface CampaignListSkeletonProps {
  /** Number of card placeholders to render. Defaults to 6. */
  cardCount?: number;
  /** Alias for `cardCount`, kept for existing loading-page call sites. */
  count?: number;
  /** Optional accessible label for the loading region. */
  ariaLabel?: string;
  /** Optional additional class names for the root element. */
  className?: string;
}

const Block: React.FC<{
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width = '100%', height = 16, borderRadius = 4, className, style }) => (
  <div
    className={className}
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      animation: 'campaign-skeleton-shimmer 1.4s ease-in-out infinite',
      ...style,
    }}
  />
);

const shimmerKeyframes = `
@keyframes campaign-skeleton-shimmer {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
`;

const CampaignListSkeleton: React.FC<CampaignListSkeletonProps> = ({
  cardCount,
  count,
  ariaLabel = 'Loading campaigns',
  className,
}) => {
  const safeCardCount = Math.max(0, Math.floor(cardCount ?? count ?? 6));

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
      data-testid="campaign-list-skeleton"
    >
      <style>{shimmerKeyframes}</style>

      {/* Header */}
      <div
        data-testid="campaign-list-skeleton-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block width={220} height={28} borderRadius={6} />
          <Block width={320} height={14} />
        </div>
        <Block width={120} height={36} borderRadius={8} />
      </div>

      {/* Filter bar */}
      <div
        data-testid="campaign-list-skeleton-filters"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <Block width={200} height={36} borderRadius={8} />
        <Block width={140} height={36} borderRadius={8} />
        <Block width={140} height={36} borderRadius={8} />
        <Block width={100} height={36} borderRadius={8} />
      </div>

      {/* Card grid */}
      <div
        data-testid="campaign-list-skeleton-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {Array.from({ length: safeCardCount }).map((_, index) => (
          <div
            key={index}
            data-testid="campaign-list-skeleton-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              backgroundColor: '#fff',
            }}
          >
            <Block width="100%" height={140} borderRadius={8} />
            <Block width="70%" height={20} borderRadius={6} />
            <Block width="100%" height={14} />
            <Block width="85%" height={14} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 4,
              }}
            >
              <Block width={90} height={28} borderRadius={14} />
              <Block width={80} height={32} borderRadius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { CampaignListSkeleton };
export default CampaignListSkeleton;
