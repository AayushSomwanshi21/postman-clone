import { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
  hasMore: boolean;
  loading: boolean;
  onReachEnd: () => void | Promise<void>;
}

export function InfiniteScrollTrigger({
  hasMore,
  loading,
  onReachEnd,
}: InfiniteScrollTriggerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      requestedRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry?.isIntersecting || loading || requestedRef.current) {
        return;
      }

      requestedRef.current = true;
      void onReachEnd();
    }, {
      rootMargin: '120px 0px',
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, onReachEnd]);

  if (!hasMore && !loading) {
    return null;
  }

  return (
    <div
      ref={ref}
      style={{
        padding: '8px 4px',
        fontSize: 12,
        color: '#666666',
        textAlign: 'center',
      }}
    >
      {loading ? 'Loading more...' : 'Scroll for more'}
    </div>
  );
}
