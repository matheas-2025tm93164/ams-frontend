import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface RowActionMenuItem {
  label: string;
  icon?: string;
  onSelect: () => void | Promise<void>;
}

interface Props {
  ariaLabel: string;
  items: RowActionMenuItem[];
  compact?: boolean;
}

const PANEL_MIN_WIDTH = 200;
const PANEL_MIN_WIDTH_COMPACT = 176;

export function RowActionMenu({ ariaLabel, items, compact = false }: Props) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const selectInFlightRef = useRef(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPanelPos(null);
      return;
    }
    const minW = compact ? PANEL_MIN_WIDTH_COMPACT : PANEL_MIN_WIDTH;
    const r = triggerRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, r.right - minW),
      window.innerWidth - minW - 8,
    );
    const top = r.bottom + 6;
    setPanelPos({ top, left });
  }, [open, compact]);

  useEffect(() => {
    if (!open) return;
    const firstItem = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    if (firstItem && firstItem.length > 0) {
      firstItem[focusIdx]?.focus();
    }
  }, [open, panelPos, focusIdx]);

  useEffect(() => {
    if (!open) return;
    function onPointerDownCapture(e: PointerEvent) {
      const el = e.target as Node;
      if (triggerRef.current?.contains(el)) return;
      if (panelRef.current?.contains(el)) return;
      setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDownCapture, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const closeAndRestore = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const selectItem = useCallback((item: RowActionMenuItem) => {
    if (selectInFlightRef.current) return;
    selectInFlightRef.current = true;
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
    queueMicrotask(() => {
      void (async () => {
        try {
          await Promise.resolve(item.onSelect());
        } finally {
          selectInFlightRef.current = false;
        }
      })().catch(() => {});
    });
  }, []);

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    const count = items.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusIdx((i) => (i + 1) % count);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusIdx((i) => (i - 1 + count) % count);
        break;
      case "Home":
        e.preventDefault();
        setFocusIdx(0);
        break;
      case "End":
        e.preventDefault();
        setFocusIdx(count - 1);
        break;
      case "Escape":
        e.preventDefault();
        closeAndRestore();
        break;
      case "Tab":
        e.preventDefault();
        closeAndRestore();
        break;
    }
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFocusIdx(0);
      setOpen(true);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx(items.length - 1);
      setOpen(true);
    }
  }

  if (items.length === 0) {
    return null;
  }

  const panel =
    open && panelPos ? (
      <ul
        ref={panelRef}
        id={menuId}
        className="row-action-menu-panel"
        role="menu"
        aria-label={ariaLabel}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={handleMenuKeyDown}
        style={{
          position: "fixed",
          top: panelPos.top,
          left: panelPos.left,
          minWidth: compact ? PANEL_MIN_WIDTH_COMPACT : PANEL_MIN_WIDTH,
          zIndex: 1000,
        }}
      >
        {items.map((item, idx) => (
          <li key={item.label} role="none">
            <button
              type="button"
              role="menuitem"
              tabIndex={idx === focusIdx ? 0 : -1}
              className="row-action-menu-item"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                selectItem(item);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectItem(item);
                }
              }}
            >
              {item.icon && <span className="mi mi-sm" aria-hidden="true">{item.icon}</span>}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div className={compact ? "row-action-menu row-action-menu--compact" : "row-action-menu"}>
      <button
        ref={triggerRef}
        type="button"
        className="row-action-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={ariaLabel}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) {
            setFocusIdx(0);
          }
          setOpen((v) => !v);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="mi" aria-hidden="true">more_vert</span>
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
