type Props = {
  fields?: number;
  label?: string;
};

/** Ghost form matching admin card + field layout. */
export default function DetailFormSkeleton({ fields = 8, label = "Loading details" }: Props) {
  return (
    <div className="card detail-skeleton" style={{ maxWidth: 720 }} aria-busy="true" aria-live="polite" aria-label={label}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="detail-skeleton__field">
          <span className="skel-bar skel-bar--sm" style={{ width: `${28 + (i % 3) * 8}%` }} aria-hidden />
          <span className="skel-bar" style={{ height: 40, width: "100%" }} aria-hidden />
        </div>
      ))}
      <span className="skel-bar" style={{ height: 40, width: 120, marginTop: 8 }} aria-hidden />
    </div>
  );
}
