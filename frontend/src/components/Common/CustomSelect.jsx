import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  className = "",
  buttonClassName = "",
  id,
  ariaLabel,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);

  // Normalize options array: handles both ["Option 1", "Option 2"] and [{ value: "1", label: "Option 1" }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value,
        label: opt.label ?? opt.value,
        icon: opt.icon,
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  const toggleDropdown = () => {
    if (disabled) return;

    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const scrollParent = containerRef.current.closest(".overflow-y-auto") || containerRef.current.closest("form");
      let parentSpaceBelow = spaceBelow;
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        parentSpaceBelow = parentRect.bottom - rect.bottom;
      }
      // If there's limited room below either in viewport or scroll container, open upward
      setOpenUpward(spaceBelow < 220 || parentSpaceBelow < 190);
    }
    setIsOpen((prev) => !prev);
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={toggleDropdown}
        className={`w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer flex items-center justify-between transition-all duration-200 hover:border-gray-300 dark:hover:border-slate-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <span className="truncate font-medium flex items-center gap-2">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-slate-400 transition-transform duration-200 ml-2 flex-shrink-0 ${
            isOpen ? "rotate-180 text-indigo-500 dark:text-indigo-400" : ""
          }`}
        />
      </button>

      {/* Floating Options Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-2xl shadow-slate-900/15 dark:shadow-black/70 backdrop-blur-md transition-all duration-150 ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
            {normalizedOptions.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    {option.icon && <span>{option.icon}</span>}
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check
                      size={14}
                      className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
