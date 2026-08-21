import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMedicationReminders } from "../useMedicationReminders";

class FakeNotification {
  static permission: NotificationPermission = "granted";
  static requestPermission = vi.fn().mockResolvedValue("granted");
  static instances: FakeNotification[] = [];
  title: string;
  options: NotificationOptions;
  constructor(title: string, options: NotificationOptions) {
    this.title = title;
    this.options = options;
    FakeNotification.instances.push(this);
  }
}

const med = {
  id: "med-1",
  name: "Amlodipine",
  dosage: "5mg",
  time_slots: ["08:00"],
};

describe("useMedicationReminders — surviving a throttled/backgrounded tab", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 7, 59, 0));
    FakeNotification.instances = [];
    FakeNotification.permission = "granted";
    (globalThis as unknown as { Notification: typeof FakeNotification }).Notification = FakeNotification;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("still fires the reminder if the interval's tick is missed and wall-clock time jumps past the exact minute", () => {
    const isTakenToday = () => false;
    renderHook(() => useMedicationReminders(true, [med], isTakenToday));

    // Simulate the tab being backgrounded/throttled across the 08:00 mark:
    // wall-clock time jumps straight to 08:05 with no intervening check()
    // calls, then the (throttled) interval finally gets to run once.
    vi.setSystemTime(new Date(2026, 0, 1, 8, 5, 0));
    vi.advanceTimersByTime(30_000);

    expect(FakeNotification.instances).toHaveLength(1);
    expect(FakeNotification.instances[0].options.body).toContain("Amlodipine");
  });

  it("does not fire a reminder more than an hour after the scheduled slot", () => {
    const isTakenToday = () => false;
    renderHook(() => useMedicationReminders(true, [med], isTakenToday));

    vi.setSystemTime(new Date(2026, 0, 1, 9, 30, 0)); // 90 min late
    vi.advanceTimersByTime(30_000);

    expect(FakeNotification.instances).toHaveLength(0);
  });

  it("does not fire twice for the same slot within the same day", () => {
    const isTakenToday = () => false;
    renderHook(() => useMedicationReminders(true, [med], isTakenToday));

    vi.setSystemTime(new Date(2026, 0, 1, 8, 5, 0));
    vi.advanceTimersByTime(30_000);
    vi.advanceTimersByTime(30_000);
    vi.advanceTimersByTime(30_000);

    expect(FakeNotification.instances).toHaveLength(1);
  });

  it("does not fire once the dose is already marked taken", () => {
    const isTakenToday = () => true;
    renderHook(() => useMedicationReminders(true, [med], isTakenToday));

    vi.setSystemTime(new Date(2026, 0, 1, 8, 5, 0));
    vi.advanceTimersByTime(30_000);

    expect(FakeNotification.instances).toHaveLength(0);
  });
});
