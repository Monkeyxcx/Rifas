import test from "node:test";
import assert from "node:assert/strict";
import {
  getExpiredReservedReservationIds,
  type ReservationExpiryRow
} from "./expire.ts";

test("returns only reservations that are still reserved and already expired", () => {
  const now = new Date("2026-09-05T18:00:00.000Z");
  const rows: ReservationExpiryRow[] = [
    {
      id: "expired-reserved",
      status: "reserved",
      expires_at: "2026-09-05T17:59:59.000Z"
    },
    {
      id: "not-yet-expired",
      status: "reserved",
      expires_at: "2026-09-05T18:00:01.000Z"
    },
    {
      id: "already-paid",
      status: "paid",
      expires_at: "2026-09-05T17:00:00.000Z"
    },
    {
      id: "invalid-date",
      status: "reserved",
      expires_at: "not-a-date"
    }
  ];

  assert.deepEqual(getExpiredReservedReservationIds(rows, now), [
    "expired-reserved"
  ]);
});

test("does not expire reservations exactly at the current timestamp", () => {
  const now = new Date("2026-09-05T18:00:00.000Z");
  const rows: ReservationExpiryRow[] = [
    {
      id: "boundary-row",
      status: "reserved",
      expires_at: "2026-09-05T18:00:00.000Z"
    }
  ];

  assert.deepEqual(getExpiredReservedReservationIds(rows, now), []);
});
