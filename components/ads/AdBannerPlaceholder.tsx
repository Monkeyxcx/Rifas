export function AdBannerPlaceholder({
  label = "Espacio publicitario",
  width = "100%",
  height = "90px",
  showLabel = true
}: {
  label?: string;
  width?: string;
  height?: string;
  showLabel?: boolean;
}) {
  return (
    <div
      aria-label={label}
      role="complementary"
      className="relative overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-100/60"
      style={{ width, height, minHeight: "60px" }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #f1f5f9 25%, transparent 25%), linear-gradient(225deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(315deg, #f1f5f9 25%, #ffffff 25%)",
          backgroundPosition: "10px 0, 10px 0, 0 0, 0 0",
          backgroundSize: "20px 20px",
          backgroundRepeat: "repeat"
        }}
      />
      {showLabel && (
        <div className="relative z-10 h-full w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          <span className="px-3 py-1.5 rounded-full bg-white/90 border border-slate-200 shadow-sm">
            📢 {label} · RifasCenter Beta
          </span>
        </div>
      )}
    </div>
  );
}
