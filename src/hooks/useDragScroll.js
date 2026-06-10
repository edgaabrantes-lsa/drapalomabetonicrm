import { useRef, useCallback, useEffect } from "react";

/**
 * useDragScroll — Desktop drag-to-scroll hook
 * - Horizontal + vertical drag navigation
 * - Only activates on desktop (pointer: fine / non-touch)
 * - Ignores clicks on interactive elements (buttons, inputs, selects, etc.)
 * - Prevents text selection during drag
 * - Uses requestAnimationFrame for smooth performance
 * - Auto-removes event listeners on unmount (no memory leaks)
 */

const INTERACTIVE_SELECTORS = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  '[role="button"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[data-radix-collection-item]',
  '.cursor-pointer',
];

function isInteractiveTarget(target) {
  return INTERACTIVE_SELECTORS.some((sel) => target.closest(sel));
}

export function useDragScroll() {
  const containerRef = useRef(null);

  // Internal drag state — stored in ref to avoid re-renders
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    moved: false,
    rafId: null,
    pendingX: 0,
    pendingY: 0,
  });

  const applyScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollLeft = drag.current.pendingX;
    el.scrollTop = drag.current.pendingY;
    drag.current.rafId = null;
  }, []);

  const onMouseDown = useCallback((e) => {
    // Only left mouse button
    if (e.button !== 0) return;

    // Skip if the target is an interactive element
    if (isInteractiveTarget(e.target)) return;

    const el = containerRef.current;
    if (!el) return;

    drag.current.active = true;
    drag.current.moved = false;
    drag.current.startX = e.clientX;
    drag.current.startY = e.clientY;
    drag.current.scrollLeft = el.scrollLeft;
    drag.current.scrollTop = el.scrollTop;
    drag.current.pendingX = el.scrollLeft;
    drag.current.pendingY = el.scrollTop;

    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!drag.current.active) return;

    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;

    // Mark as moved if threshold exceeded (avoids accidental drags on click)
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      drag.current.moved = true;
    }

    drag.current.pendingX = drag.current.scrollLeft - dx;
    drag.current.pendingY = drag.current.scrollTop - dy;

    if (!drag.current.rafId) {
      drag.current.rafId = requestAnimationFrame(applyScroll);
    }
  }, [applyScroll]);

  const stopDrag = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;

    const el = containerRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }

    if (drag.current.rafId) {
      cancelAnimationFrame(drag.current.rafId);
      drag.current.rafId = null;
    }
  }, []);

  // Prevent clicks from firing if the user was dragging
  const onClickCapture = useCallback((e) => {
    if (drag.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      drag.current.moved = false;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Only enable on non-touch / desktop devices
    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    if (!isDesktop) return;

    // Set initial cursor
    el.style.cursor = "grab";

    el.addEventListener("mousedown", onMouseDown, { passive: false });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mouseleave", stopDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("mouseleave", stopDrag);
      el.removeEventListener("click", onClickCapture, true);

      if (drag.current.rafId) {
        cancelAnimationFrame(drag.current.rafId);
      }

      el.style.cursor = "";
      el.style.userSelect = "";
    };
  }, [onMouseDown, onMouseMove, stopDrag, onClickCapture]);

  return containerRef;
}