"use client";

import { X } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TagInput({
  label,
  name,
  onChange,
  placeholder,
  suggestions = [],
  value
}: {
  label: string;
  name: string;
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: readonly string[];
  value: string[];
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const filteredSuggestions = useMemo(() => {
    const normalized = input.trim().toLowerCase();
    if (!normalized) return [];
    return suggestions
      .filter((item) => item.toLowerCase().includes(normalized) && !value.includes(item))
      .slice(0, 8);
  }, [input, suggestions, value]);

  function addTag(tag: string) {
    const next = tag.trim();
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
    setInput("");
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (open && filteredSuggestions[highlightIndex]) {
        addTag(filteredSuggestions[highlightIndex]);
        return;
      }
      addTag(input);
      return;
    }

    if (event.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
      return;
    }

    if (!open || filteredSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % filteredSuggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => (index - 1 + filteredSuggestions.length) % filteredSuggestions.length);
    }
  }

  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input name={name} type="hidden" value={JSON.stringify(value)} />
      <div className="relative" ref={containerRef}>
        <div className="flex min-h-10 flex-wrap gap-2 rounded-xl border border-input bg-white px-2 py-1.5">
          {value.map((tag) => (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium"
              key={tag}
            >
              {tag}
              <button
                aria-label={`Remove ${tag}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeTag(tag)}
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Input
            aria-autocomplete="list"
            aria-controls={open ? listboxId : undefined}
            className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setInput(event.target.value);
              setOpen(event.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (input.trim()) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={value.length ? "" : placeholder}
            value={input}
          />
        </div>

        {open && filteredSuggestions.length > 0 ? (
          <ul
            className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
            id={listboxId}
            role="listbox"
          >
            {filteredSuggestions.map((item, index) => (
              <li key={item} role="option" aria-selected={index === highlightIndex}>
                <button
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm",
                    index === highlightIndex ? "bg-muted" : "hover:bg-muted/60"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addTag(item)}
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
