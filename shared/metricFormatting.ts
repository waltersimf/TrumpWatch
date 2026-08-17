export function formatMetricValue(value: string): string {
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}
