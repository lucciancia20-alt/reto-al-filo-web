import React, { useEffect, useRef, useState } from 'react';

export default function ResizableTextarea({
  minHeight = 36,
  className = '',
  style,
  rows: _rows,
  ...props
}) {
  const textareaRef = useRef(null);
  const cleanupDragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = `${minHeight}px`;
    const initialHeight = Math.min(96, Math.max(minHeight, textarea.scrollHeight));
    textarea.style.height = `${initialHeight}px`;
  }, [minHeight]);

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
        rows={1}
        style={{ minHeight: `${minHeight}px`, ...style }}
        className={`block w-full resize-none font-mono font-semibold ${className}`}
        {...props}
      />
      <div
        aria-hidden="true"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="group absolute bottom-0 left-0 right-0 h-3.5 cursor-ns-resize select-none touch-none z-10 flex items-end justify-end pr-4 pb-0.5"
      >
        <span
          className={`pointer-events-none text-[10px] leading-none transition-colors ${
            isDragging
              ? 'text-white'
              : 'text-zinc-500 group-hover:text-white'
          }`}
        >
          ↕ Agrandar / achicar
        </span>
        <span
          className={`pointer-events-none absolute bottom-0.5 right-0.5 w-3 h-3 transition-opacity ${
            isDragging ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
          }`}
          style={{
            background:
              'linear-gradient(135deg, transparent 42%, rgba(249, 115, 22, 0.8) 42%, rgba(249, 115, 22, 0.8) 54%, transparent 54%, transparent 70%, rgba(249, 115, 22, 0.8) 70%, rgba(249, 115, 22, 0.8) 82%, transparent 82%)',
          }}
        />
      </div>
    </div>
  );
}
