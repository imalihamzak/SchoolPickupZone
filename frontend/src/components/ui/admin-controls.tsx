import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./admin-controls.css";

export type AdminSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type AdminSelectProps = {
  value: string;
  options: AdminSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
};

type AdminDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
};

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const FLOATING_GAP = 7;
const FLOATING_MARGIN = 8;
const FLOATING_MAX_HEIGHT = 268;

type FloatingPosition = {
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
  top?: number;
  bottom?: number;
};

export function AdminSelect({
  value,
  options,
  onChange,
  placeholder = "Select option",
  ariaLabel,
  id,
  className = "",
  disabled = false,
  invalid = false,
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<FloatingPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value);
  const canPortal = typeof document !== "undefined";

  useCloseOnOutside(rootRef, () => setOpen(false), menuRef);

  useEffect(() => {
    const nextIndex = options.findIndex((option) => option.value === value);
    if (nextIndex >= 0) setActiveIndex(nextIndex);
  }, [options, value]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const root = rootRef.current;
      if (!root) return;

      const rect = root.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const width = Math.min(rect.width, Math.max(0, viewportWidth - FLOATING_MARGIN * 2));
      const left = Math.min(
        Math.max(FLOATING_MARGIN, rect.left),
        Math.max(FLOATING_MARGIN, viewportWidth - width - FLOATING_MARGIN)
      );
      const availableBelow = viewportHeight - rect.bottom - FLOATING_MARGIN;
      const availableAbove = rect.top - FLOATING_MARGIN;
      const placement = availableBelow < 150 && availableAbove > availableBelow ? "top" : "bottom";
      const available = placement === "top" ? availableAbove : availableBelow;
      const maxHeight = Math.max(96, Math.min(FLOATING_MAX_HEIGHT, available - FLOATING_GAP));

      setMenuPosition(
        placement === "top"
          ? {
              left,
              width,
              maxHeight,
              placement,
              bottom: viewportHeight - rect.top + FLOATING_GAP,
            }
          : {
              left,
              width,
              maxHeight,
              placement,
              top: rect.bottom + FLOATING_GAP,
            }
      );
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  const selectOption = (option: AdminSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  const moveActive = (direction: 1 | -1) => {
    if (!options.length) return;
    let next = activeIndex;
    for (let i = 0; i < options.length; i += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next]?.disabled) break;
    }
    setActiveIndex(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      moveActive(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      moveActive(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (options[activeIndex]) {
        selectOption(options[activeIndex]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const menu = open && menuPosition ? (
    <div
      ref={menuRef}
      className={`pz-admin-control-menu pz-admin-control-menu--floating ${
        menuPosition.placement === "top" ? "above" : "below"
      }`}
      role="listbox"
      aria-label={ariaLabel}
      style={{
        left: menuPosition.left,
        width: menuPosition.width,
        maxHeight: menuPosition.maxHeight,
        ...(menuPosition.placement === "top"
          ? { bottom: menuPosition.bottom }
          : { top: menuPosition.top }),
      }}
    >
      {options.map((option, index) => (
        <button
          type="button"
          key={`${option.value || option.label}-${index}`}
          role="option"
          aria-selected={option.value === value}
          disabled={option.disabled}
          className={`pz-admin-control-option ${option.value === value ? "selected" : ""} ${
            index === activeIndex ? "active" : ""
          }`}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => selectOption(option)}
        >
          <span>{option.label}</span>
          {option.value === value && <Check size={14} className="pz-admin-control-check" aria-hidden="true" />}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`pz-admin-control ${open ? "open" : ""} ${invalid ? "invalid" : ""} ${className}`}>
      <button
        id={id}
        type="button"
        className="pz-admin-control-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className={`pz-admin-control-value ${selected ? "" : "placeholder"}`}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} className="pz-admin-control-chevron" aria-hidden="true" />
      </button>

      {canPortal && menu ? createPortal(menu, document.body) : menu}
    </div>
  );
}

export function AdminDatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  ariaLabel,
  id,
  className = "",
  disabled = false,
}: AdminDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseYmd(value);
  const [viewDate, setViewDate] = useState<Date>(() => selectedDate || new Date());
  const rootRef = useRef<HTMLDivElement | null>(null);

  useCloseOnOutside(rootRef, () => setOpen(false));

  useEffect(() => {
    if (selectedDate && !open) {
      setViewDate(selectedDate);
    }
  }, [open, selectedDate?.getTime()]);

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const title = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = formatYmd(new Date());

  const chooseDate = (date: Date) => {
    onChange(formatYmd(date));
    setViewDate(date);
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const chooseToday = () => chooseDate(new Date());

  const clearDate = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`pz-admin-control pz-admin-date-control ${open ? "open" : ""} ${className}`}>
      <button
        id={id}
        type="button"
        className="pz-admin-control-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`pz-admin-control-value ${selectedDate ? "" : "placeholder"}`}>
          {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
        </span>
        <CalendarDays size={15} className="pz-admin-control-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="pz-admin-date-popover" role="dialog" aria-label={ariaLabel || "Choose date"}>
          <div className="pz-admin-date-head">
            <div className="pz-admin-date-title">{title}</div>
            <div className="pz-admin-date-nav">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="pz-admin-date-weekdays">
            {WEEKDAYS.map((day) => (
              <div className="pz-admin-date-weekday" key={day}>
                {day}
              </div>
            ))}
          </div>

          <div className="pz-admin-date-grid">
            {calendarDays.map((date) => {
              const dayValue = formatYmd(date);
              const inCurrentMonth = date.getMonth() === viewDate.getMonth();
              return (
                <button
                  type="button"
                  key={dayValue}
                  className={`pz-admin-date-day ${inCurrentMonth ? "" : "muted"} ${
                    dayValue === today ? "today" : ""
                  } ${dayValue === value ? "selected" : ""}`}
                  onClick={() => chooseDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="pz-admin-date-footer">
            <button type="button" className="pz-admin-date-action" onClick={clearDate}>
              Clear
            </button>
            <button type="button" className="pz-admin-date-action" onClick={chooseToday}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useCloseOnOutside(
  rootRef: React.RefObject<HTMLElement>,
  onClose: () => void,
  floatingRef?: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideRoot = rootRef.current?.contains(target);
      const insideFloating = floatingRef?.current?.contains(target);

      if (!insideRoot && !insideFloating) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [floatingRef, onClose, rootRef]);
}

function parseYmd(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function buildCalendarDays(viewDate: Date) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}
