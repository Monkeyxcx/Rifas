export type ReservationExpiryRow = {
  id: string;
  status: string;
  expires_at: string;
};

export function getExpiredReservedReservationIds(
  rows: ReservationExpiryRow[],
  now: Date
): string[] {
  const nowMs = now.getTime();

  return rows
    .filter((row) => {
      if (row.status !== "reserved") return false;

      const expiresAtMs = Date.parse(row.expires_at);
      if (!Number.isFinite(expiresAtMs)) return false;

      return expiresAtMs < nowMs;
    })
    .map((row) => row.id);
}
