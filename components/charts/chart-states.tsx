import * as React from "react";
import { cn } from "@/lib/utils";

/** Quiet empty state that holds the chart's height, so nothing shifts when data arrives. */
export function ChartEmpty({
  height,
  className,
  label = "No data yet",
}: {
  height: number;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-background text-xs font-normal text-muted-foreground",
        className,
      )}
      style={{ height }}
    >
      {label}
    </div>
  );
}

/** Visually hidden table so every number is available without hovering. */
export function ChartTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: { id: string; cells: React.ReactNode[] }[];
}) {
  // sr-only goes on a wrapper: a table grows to its content and ignores the 1px box.
  return (
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {r.cells.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={i}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
