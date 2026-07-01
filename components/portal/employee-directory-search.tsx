"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { EmployeeListItem } from "@/lib/hr/employees";
import { cn } from "@/lib/utils";

const SUGGESTION_LIMIT = 8;

function matchesEmployee(employee: EmployeeListItem, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    employee.name,
    employee.email,
    employee.title,
    employee.department,
    employee.managerName,
    employee.status
  ];

  return haystack.some((value) => value?.toLowerCase().includes(normalized));
}

export function employeeMatchesQuery(employee: EmployeeListItem, query: string) {
  return matchesEmployee(employee, query);
}

export function EmployeeDirectorySearch({
  domain,
  employees,
  onQueryChange
}: {
  domain: string;
  employees: EmployeeListItem[];
  onQueryChange: (query: string) => void;
}) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return employees.filter((employee) => matchesEmployee(employee, normalized)).slice(0, SUGGESTION_LIMIT);
  }, [employees, query]);

  useEffect(() => {
    onQueryChange(query);
  }, [onQueryChange, query]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, suggestions.length]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function updateQuery(value: string) {
    setQuery(value);
    setOpen(value.trim().length > 0);
  }

  function selectEmployee(employee: EmployeeListItem) {
    setOpen(false);
    setQuery(employee.name);
    router.push(`/portal/${domain}/employees/${employee.id}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = suggestions[highlightIndex];
      if (selected) selectEmployee(selected);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-autocomplete="list"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        autoComplete="off"
        className="pl-9"
        onChange={(event) => updateQuery(event.target.value)}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search by name, email, title, or department…"
        ref={inputRef}
        role="combobox"
        type="search"
        value={query}
      />

      {open && suggestions.length > 0 ? (
        <ul
          className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {suggestions.map((employee, index) => (
            <li key={employee.id} role="option" aria-selected={index === highlightIndex}>
              <button
                className={cn(
                  "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition",
                  index === highlightIndex ? "bg-muted" : "hover:bg-muted/60"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectEmployee(employee)}
                type="button"
              >
                <span className="font-medium">{employee.name}</span>
                <span className="text-xs text-muted-foreground">
                  {employee.email}
                  {employee.title ? ` · ${employee.title}` : ""}
                  {employee.department ? ` · ${employee.department}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open && query.trim() && suggestions.length === 0 ? (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground shadow-lg">
          No employees match &ldquo;{query.trim()}&rdquo;
        </div>
      ) : null}
    </div>
  );
}
