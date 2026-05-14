/** SVG polyline `points` string for a simple sparkline (normalized to viewBox width × height). */
export function buildSparklinePoints(values: number[], width = 220, height = 42): string {
  if (values.length === 0) return "";
  if (values.length === 1) return `0,${height / 2} ${width},${height / 2}`;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((value, idx) => {
      const x = (idx / (values.length - 1)) * width;
      const normalizedY = (value - min) / range;
      const y = height - normalizedY * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
