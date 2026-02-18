import React, { useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

/**
 * AgentCard Component - Material 3 Design with Error Handling & Loading States
 * Enhanced with ErrorBoundary integration and production-ready features
 */
const AgentCard = ({
  agent,
  onClick,
  className = '',
  variant = 'default', // 'default', 'compact', 'featured', 'skeleton'
  status = 'active', // 'active', 'inactive', 'error', 'pending', 'loading'
  loading = false,
  error = null,
  retryable = false,
  onRetry,
  ...props
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return {
          color: 'var(--md-sys-color-primary)',
          icon: CheckCircle,
          text: 'Active'
        };
      case 'inactive':
        return {
          color: 'var(--md-sys-color-outline-variant)',
          icon: XCircle,
          text: 'Inactive'
        };
      case 'error':
        return {
          color: 'var(--md-sys-color-error)',
          icon: AlertCircle,
          text: 'Error'
        };
      case 'pending':
        return {
          color: 'var(--md-sys-color-tertiary)',
          icon: Clock,
          text: 'Pending'
        };
      case 'loading':
        return {
          color: 'var(--md-sys-color-primary)',
          icon: Loader2,
          text: 'Loading'
        };
      default:
        return {
          color: 'var(--md-sys-color-outline-variant)',
          icon: AlertCircle,
          text: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, isRetrying]);

  const handleClick = useCallback(() => {
    if (loading || status === 'error' || !agent) return;
    onClick?.(agent);
  }, [loading, status, agent, onClick]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Skeleton loading state
  if (variant === 'skeleton') {
    return (
      <div className={`
        agent-card-skeleton
        surface-container-high
        rounded-corner-extra-large
        shadow-elevation-2
        p-4 animate-pulse
        ${className}
      `}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 bg-surface-container-low rounded-corner-medium flex-1 mr-4"></div>
          <div className="w-16 h-4 bg-surface-container-low rounded-corner-small"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-surface-container-low rounded-corner-small"></div>
          <div className="h-4 bg-surface-container-low rounded-corner-small w-3/4"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-4 bg-surface-container-low rounded-corner-small"></div>
          <div className="w-16 h-4 bg-surface-container-low rounded-corner-small"></div>
        </div>
      </div>
    );
  }

  const cardClasses = `
    agent-card
    surface-container-high
    rounded-corner-extra-large
    shadow-elevation-2
    transition-all
    duration-200
    ${!loading && status !== 'error' ? 'cursor-pointer hover:shadow-elevation-3 hover:scale-[1.02] active:shadow-elevation-1 active:scale-[0.98]' : ''}
    ${loading ? 'opacity-75 cursor-not-allowed' : ''}
    ${status === 'error' ? 'border border-error-container' : ''}
    ${variant === 'compact' ? 'p-3' : 'p-4'}
    ${variant === 'featured' ? 'border-2 border-primary' : ''}
    ${className}
  `.trim();

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      role="button"
      tabIndex={!loading && status !== 'error' ? 0 : -1}
      onKeyDown={handleKeyDown}
      aria-label={agent ? `Agent: ${agent.name}, Status: ${statusConfig.text}` : 'Agent card'}
      aria-disabled={loading || status === 'error'}
      {...props}
    >
      {/* Header */}
      <div className={`
        flex items-center justify-between mb-3
        ${variant === 'compact' ? 'mb-2' : ''}
      `.trim()}>
        <h3 className={`
          title-medium
          text-on-surface
          font-medium
          truncate
          ${loading ? 'opacity-50' : ''}
          ${variant === 'compact' ? 'text-sm' : ''}
        `.trim()} title={agent?.name}>
          {loading ? 'Loading...' : agent?.name || 'Unknown Agent'}
        </h3>

        <div className={`
          flex items-center gap-2
          ${variant === 'compact' ? 'gap-1' : ''}
        `.trim()}>
          {loading ? (
            <Loader2 className={`
              w-4 h-4 animate-spin
              ${variant === 'compact' ? 'w-3 h-3' : ''}
            `} style={{ color: statusConfig.color }} />
          ) : (
            <StatusIcon className={`
              w-4 h-4
              ${status === 'loading' ? 'animate-spin' : ''}
              ${variant === 'compact' ? 'w-3 h-3' : ''}
            `} style={{ color: statusConfig.color }} />
          )}
          {variant !== 'compact' && !loading && (
            <span className={`
              label-small text-on-surface-variant
              ${variant === 'compact' ? 'text-xs' : ''}
            `}>
              {statusConfig.text}
            </span>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-3 p-3 bg-error-container rounded-corner-large border border-error">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-on-error-container flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="body-small text-on-error-container mb-2">
                {error.message || 'Failed to load agent data'}
              </p>
              {retryable && onRetry && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry();
                  }}
                  disabled={isRetrying}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-on-primary rounded-corner-medium hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span className="label-small">Retry</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!error && variant !== 'compact' && agent?.description && !loading && (
        <div className={`
          space-y-2
          ${variant === 'compact' ? 'space-y-1' : ''}
        `.trim()}>
          <p className={`
            body-small text-on-surface-variant
            line-clamp-2
            ${variant === 'compact' ? 'text-xs' : ''}
          `}>
            {agent.description}
          </p>
        </div>
      )}

      {/* Loading Skeleton for Content */}
      {loading && variant !== 'compact' && (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-surface-container-low rounded-corner-small"></div>
          <div className="h-4 bg-surface-container-low rounded-corner-small w-3/4"></div>
        </div>
      )}

      {/* Metrics */}
      {!error && !loading && (agent?.executions || agent?.successRate || agent?.lastRun) && (
        <div className={`
          flex items-center gap-4 mt-3
          ${variant === 'compact' ? 'gap-2' : ''}
        `.trim()}>
          {agent.executions !== undefined && (
            <div className={`
              flex items-center gap-1
              ${variant === 'compact' ? 'gap-0.5' : ''}
            `.trim()}>
              <span className={`
                label-medium text-on-surface font-medium
                ${variant === 'compact' ? 'text-xs' : ''}
              `}>
                {agent.executions.toLocaleString()}
              </span>
              <span className={`
                label-small text-on-surface-variant
                ${variant === 'compact' ? 'text-xs' : ''}
              `}>
                {variant === 'compact' ? 'runs' : 'executions'}
              </span>
            </div>
          )}

          {agent.successRate !== undefined && (
            <div className={`
              flex items-center gap-1
              ${variant === 'compact' ? 'gap-0.5' : ''}
            `.trim()}>
              <span className={`
                label-medium text-on-surface font-medium
                ${variant === 'compact' ? 'text-xs' : ''}
              `}>
                {agent.successRate}%
              </span>
              <span className={`
                label-small text-on-surface-variant
                ${variant === 'compact' ? 'text-xs' : ''}
              `}>
                success
              </span>
            </div>
          )}

          {agent.lastRun && variant !== 'compact' && (
            <div className={`
              flex items-center gap-1
              ${variant === 'compact' ? 'gap-0.5' : ''}
            `.trim()}>
              <span className={`
                label-small text-on-surface-variant
                ${variant === 'compact' ? 'text-xs' : ''}
              `}>
                {new Date(agent.lastRun).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton for Metrics */}
      {loading && (
        <div className="flex items-center gap-4 mt-3 animate-pulse">
          <div className="w-12 h-4 bg-surface-container-low rounded-corner-small"></div>
          <div className="w-16 h-4 bg-surface-container-low rounded-corner-small"></div>
        </div>
      )}

      {/* Featured variant additional content */}
      {variant === 'featured' && agent?.tags && agent.tags.length > 0 && !loading && !error && (
        <div className="flex flex-wrap gap-1 mt-3">
          {agent.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary-container text-on-primary-container rounded-corner-small label-small"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentCard;
