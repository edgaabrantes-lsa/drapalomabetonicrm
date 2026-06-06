/**
 * useCurrencyInput — máscara monetária estilo bancário (R$ 0,00)
 *
 * Uso:
 *   const [display, numericValue, handleChange] = useCurrencyInput(initialNumber);
 *   <input value={display} onChange={handleChange} inputMode="numeric" />
 *   // ao salvar: numericValue  (ex: 12500.50)
 */
import { useState, useCallback } from "react";

export function formatCurrency(cents) {
  // cents = inteiro (ex: 125050 → R$ 1.250,50)
  const value = cents / 100;
  return "R$ " + value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrencyInput(raw) {
  // Remove tudo que não for dígito
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return 0;
  const cents = parseInt(digits, 10);
  return isNaN(cents) ? 0 : cents;
}

export function centsToFloat(cents) {
  return cents / 100;
}

export function floatToCents(value) {
  if (!value && value !== 0) return 0;
  return Math.round(parseFloat(value) * 100);
}

/**
 * @param {number|string} initialValue - valor numérico float (ex: 1250.50)
 * @returns [displayValue, numericFloat, handleChange, reset]
 */
export default function useCurrencyInput(initialValue = 0) {
  const initial = floatToCents(initialValue);
  const [cents, setCents] = useState(initial);

  const displayValue = formatCurrency(cents);
  const numericFloat = centsToFloat(cents);

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    const newCents = parseCurrencyInput(raw);
    setCents(newCents);
  }, []);

  const reset = useCallback((newValue = 0) => {
    setCents(floatToCents(newValue));
  }, []);

  return [displayValue, numericFloat, handleChange, reset];
}