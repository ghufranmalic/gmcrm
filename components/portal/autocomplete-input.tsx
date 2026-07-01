"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AutocompleteInput({
  label,
  name,
  onChange,
  options,
  placeholder,
  required,
  value
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const suggestions = useMemo(() => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return options.slice(0, 8);
    return options.filter((item) => item.toLowerCase().includes(normalized)).slice(0, 8);
  }, [options, value]);

  function selectOption(option: string) {
    onChange(option);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
    }

    if (event.key === "Enter" && suggestions[highlightIndex]) {
      event.preventDefault();
      selectOption(suggestions[highlightIndex]);
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input name={name} type="hidden" value={value} />
      <div className="relative" ref={containerRef}>
        <Input
          aria-autocomplete="list"
          aria-controls={open ? listboxId : undefined}
          autoComplete="off"
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          role="combobox"
          value={value}
        />

        {open && suggestions.length > 0 ? (
          <ul
            className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
            id={listboxId}
            role="listbox"
          >
            {suggestions.map((item, index) => (
              <li key={item} role="option" aria-selected={index === highlightIndex}>
                <button
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm",
                    index === highlightIndex ? "bg-muted" : "hover:bg-muted/60"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(item)}
                  type="button"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </label>
  );
}
