/**
 * CurrencyInput — campo monetário com máscara automática estilo bancário.
 *
 * Props:
 *   value       {number}   — valor numérico float controlado pelo pai (ex: 1250.50)
 *   onChange    {function} — chamado com o novo valor numérico float
 *   className   {string}
 *   placeholder {string}
 *   disabled    {boolean}
 *   ...rest     — demais props repassadas ao <input>
 *
 * Exemplo:
 *   <CurrencyInput value={form.valor} onChange={(v) => setForm(p => ({...p, valor: v}))} />
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function floatToCents(value) {
  if (!value && value !== 0) return 0;
  const n = parseFloat(value);
  if (isNaN(n)) return 0;
  return Math.round(n * 100);
}

function centsToDisplay(cents) {
  const value = (cents || 0) / 100;
  return "R$ " + value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CurrencyInput({
  value,
  onChange,
  className,
  placeholder,
  disabled,
  ...rest
}) {
  const [cents, setCents] = useState(() => floatToCents(value));
  const isFocusedRef = useRef(false);

  // Sync external value changes when not focused
  useEffect(() => {
    if (!isFocusedRef.current) {
      setCents(floatToCents(value));
    }
  }, [value]);

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    const newCents = digits ? parseInt(digits, 10) : 0;
    setCents(newCents);
    if (onChange) {
      onChange(newCents / 100);
    }
  }, [onChange]);

  const handleFocus = () => { isFocusedRef.current = true; };
  const handleBlur = () => { isFocusedRef.current = false; };

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={centsToDisplay(cents)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder || "R$ 0,00"}
      disabled={disabled}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
    />
  );
}