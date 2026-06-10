import { useRef, useCallback, useEffect } from "react";

/**
 * useDragScroll — Desktop drag-to-scroll hook
 *
 * Features:
 * - Horizontal + vertical drag-to-scroll on desktop only
 * - grab / grabbing cursor feedback
 * - Ignores all interactive elements (buttons, inputs, selects, links, etc.)
 * - 5px movement threshold before entering drag mode (prevents misclick)
 * - requestAnimationFrame for smooth, jank-free scrolling
 * - Auto-cleanup on unmount — no memory leaks
 * - Mobile unaffected (pointer: coarse = touch device = no-op)
 */

const INTERACTIVE_SELECTORS = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "label",
  "option",
  '[role="button"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[role="slider"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[data-radix-collection-item]',
  '[data-state]',
];

function isInteractiveTarget(target) {
  if (!target || !target.closest) return false;
  return INTERACTIVE_SELECTORS.some((sel) => {
    try { return !!target.closest(sel); } catch { return false; }
  });
}

export function useDragScroll() {
  const containerRef = useRef(null);

  const state = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    origScrollLeft: 0,
    origScrollTop: 0,
    moved: false,
    rafId: null,
    nextScrollLeft: 0,
    nextScrollTop: 0,
  });

  // RAF callback — applies scroll outside React render cycle
  const flushScroll = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollLeft = state.current.nextScrollLeft;
      el.scrollTop  = state.current.nextScrollTop;
    }
    state.current.rafId = null;
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (isInteractiveTarget(e.target)) return;

    const el = containerRef.current;
    if (!el) return;

    // Only activate if element actually has scrollable content
    const hasHScroll = el.scrollWidth > el.clientWidth;
    const hasVScroll = el.scrollHeight > el.clientHeight;
    if (!hasHScroll && !hasVScroll) return;

    const s = state.current;
    s.dragging = true;
    s.moved = false;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.origScrollLeft = el.scrollLeft;
    s.origScrollTop  = el.scrollTop;
    s.nextScrollLeft = el.scrollLeft;
    s.nextScrollTop  = el.scrollTop;

    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!state.current.dragging) return;

    const dx = e.clientX - state.current.startX;
    const dy = e.clientY - state.current.startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      state.current.moved = true;
    }

    state.current.nextScrollLeft = state.current.origScrollLeft - dx;
    state.current.nextScrollTop  = state.current.origScrollTop  - dy;

    if (!state.current.rafId) {
      state.current.rafId = requestAnimationFrame(flushScroll);
    }
  }, [flushScroll]);

  const handleMouseUp = useCallback(() => {
    if (!state.current.dragging) return;
    state.current.dragging = false;

    const el = containerRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }

    if (state.current.rafId) {
      cancelAnimationFrame(state.current.rafId);
      state.current.rafId = null;
    }
  }, []);

  // Capture-phase click suppressor: prevents child onClick during a drag
  const handleClickCapture = useCallback((e) => {
    if (state.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      state.current.moved = false;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Only activate on desktop (fine pointer = mouse, not touch)
    if (!window.matchMedia("(pointer: fine)").matches) return;

    el.style.cursor = "grab";

    el.addEventListener("mousedown",  handleMouseDown,    { passive: false });
    el.addEventListener("click",      handleClickCapture, true);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);

    return () => {
      el.removeEventListener("mousedown",  handleMouseDown);
      el.removeEventListener("click",      handleClickCapture, true);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup",   handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);

      if (state.current.rafId) {
        cancelAnimationFrame(state.current.rafId);
      }
      el.style.cursor = "";
      el.style.userSelect = "";
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleClickCapture]);

  return containerRef;
}