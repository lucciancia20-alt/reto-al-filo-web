import React, { useEffect, useRef, useState } from 'react';

export default function ResizableTextarea({
  minHeight = 56,
  className = '',
  style,
  ...props
}) {
  const textareaRef = useRef(null);
  const cleanupDragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      cleanupDragRef.current?.();
    };
  }, []);

  const beginResize = (startY, isTouch) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    cleanupDragRef.current?.();

    const startHeight = textarea.getBoundingClientRect().height;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    setIsDragging(true);

    const handleMove = (moveEvent) => {
      if (isTouch && moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      const clientY = isTouch
        ? moveEvent.touches?.[0]?.clientY
        : moveEvent.clientY;
      if (typeof clientY !== 'number') return;

      const nextHeight = Math.max(minHeight, Math.round(startHeight + (clientY - startY)));
      textarea.style.height = `${nextHeight}px`;
    };

    const stopDrag = () => {
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      setIsDragging(false);
      if (isTouch) {
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', stopDrag);
        window.removeEventListener('touchcancel', stopDrag);
      } else {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', stopDrag);
      }
      cleanupDragRef.current = null;
    };

    cleanupDragRef.current = stopDrag;

    if (isTouch) {
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', stopDrag);
      window.addEventListener('touchcancel', stopDrag);
    } else {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', stopDrag);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    beginResize(e.clientY, false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    beginResize(touch.clientY, true);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        style={{ minHeight: `${minHeight}px`, ...style }}
        className={`block w-full resize-y admin-textarea pb-5 ${className}`}
        {...props}
      />
      <div
        aria-hidden="true"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="group absolute bottom-0 left-0 right-3.5 h-4 cursor-ns-resize select-none touch-none z-10 flex items-center justify-end pr-1.5"
      >
        <span
          className={`pointer-events-none text-[10px] leading-none transition-colors ${
            isDragging
              ? 'text-orange-400'
              : 'text-zinc-500/70 group-hover:text-orange-400'
          }`}
        >
          ↕ Agrandar / achicar
        </span>
      </div>
    </div>
  );
}
