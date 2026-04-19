const DEFAULT_PADDING = 0.15

type CheckBudgetArgs = {
  usedBytes: number
  maxBytes: number
  estimatedBytes: number
  padding?: number
}

export type BudgetCheck =
  | { ok: true }
  | {
      ok: false
      shortfallBytes: number
      requiredBytes: number
      usedBytes: number
      maxBytes: number
    }

export const checkBudget = ({
  usedBytes,
  maxBytes,
  estimatedBytes,
  padding = DEFAULT_PADDING,
}: CheckBudgetArgs): BudgetCheck => {
  const requiredBytes = Math.ceil(estimatedBytes * (1 + padding))
  const projected = usedBytes + requiredBytes
  if (projected <= maxBytes) return { ok: true }
  return {
    ok: false,
    shortfallBytes: projected - maxBytes,
    requiredBytes,
    usedBytes,
    maxBytes,
  }
}
