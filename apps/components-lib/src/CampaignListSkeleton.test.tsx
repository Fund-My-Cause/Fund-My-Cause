import React from 'react';
import { render, screen } from '@testing-library/react';
import CampaignListSkeleton from './CampaignListSkeleton';

describe('CampaignListSkeleton', () => {
  it('renders the skeleton root with accessibility attributes', () => {
    render(<CampaignListSkeleton />);

    const root = screen.getByTestId('campaign-list-skeleton');
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('role', 'status');
    expect(root).toHaveAttribute('aria-live', 'polite');
    expect(root).toHaveAttribute('aria-busy', 'true');
    expect(root).toHaveAttribute('aria-label', 'Loading campaigns');
  });

  it('uses a custom aria-label when provided', () => {
    render(<CampaignListSkeleton ariaLabel="Fetching your campaigns" />);

    expect(screen.getByTestId('campaign-list-skeleton')).toHaveAttribute(
      'aria-label',
      'Fetching your campaigns',
    );
  });

  it('renders header, filter bar and grid sections', () => {
    render(<CampaignListSkeleton />);

    expect(screen.getByTestId('campaign-list-skeleton-header')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-list-skeleton-filters')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-list-skeleton-grid')).toBeInTheDocument();
  });

  it('renders the default number of card placeholders', () => {
    render(<CampaignListSkeleton />);

    expect(screen.getAllByTestId('campaign-list-skeleton-card')).toHaveLength(6);
  });

  it('renders the requested number of card placeholders', () => {
    render(<CampaignListSkeleton cardCount={3} />);

    expect(screen.getAllByTestId('campaign-list-skeleton-card')).toHaveLength(3);
  });

  it('normalizes invalid card counts', () => {
    const { rerender } = render(<CampaignListSkeleton cardCount={-5} />);
    expect(screen.queryAllByTestId('campaign-list-skeleton-card')).toHaveLength(0);

    rerender(<CampaignListSkeleton cardCount={2.9} />);
    expect(screen.getAllByTestId('campaign-list-skeleton-card')).toHaveLength(2);
  });

  it('applies a custom className to the root element', () => {
    render(<CampaignListSkeleton className="custom-skeleton" />);

    expect(screen.getByTestId('campaign-list-skeleton')).toHaveClass('custom-skeleton');
  });
});
