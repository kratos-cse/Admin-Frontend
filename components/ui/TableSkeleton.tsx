type Props = {
  rows?: number;
  columns?: number;
  label?: string;
};

/** Ghost rows matching admin data tables — keeps layout stable while loading. */
export default function TableSkeleton({ rows = 6, columns = 5, label = "Loading table" }: Props) {
  return (
    <div className="table-wrap table-skeleton" aria-busy="true" aria-live="polite" aria-label={label}>
      <table className="data">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} scope="col">
                <span className="skel-bar skel-bar--sm" aria-hidden />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col}>
                  <span
                    className="skel-bar"
                    style={{ width: col === 0 ? "72%" : col === columns - 1 ? "40%" : "55%" }}
                    aria-hidden
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
