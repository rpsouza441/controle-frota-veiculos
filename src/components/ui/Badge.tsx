import { PropsWithChildren } from "react";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

export function Badge({ children, tone = "neutral" }: PropsWithChildren<{ tone?: Tone }>) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
