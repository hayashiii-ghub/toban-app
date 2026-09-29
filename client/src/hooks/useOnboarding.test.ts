import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ONBOARDING_STORAGE_KEY } from "@/rotation/constants";
import { useOnboarding } from "./useOnboarding";

const ready = { hasSchedule: true, isModalOpen: false, isShareOpen: false };

function renderOnboarding(deps = ready) {
  const view = renderHook(() => useOnboarding(deps));
  act(() => {
    vi.advanceTimersByTime(800);
  });
  return view;
}

describe("useOnboarding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("オンボーディング済みの場合は表示しない", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    const { result } = renderOnboarding();
    expect(result.current.showOnboarding).toBe(false);
  });

  it("条件が揃えば800ms後に表示する", () => {
    const { result } = renderHook(() => useOnboarding(ready));
    expect(result.current.showOnboarding).toBe(false);
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.showOnboarding).toBe(true);
  });

  it("モーダルが開いている場合は表示しない", () => {
    const { result } = renderOnboarding({ ...ready, isModalOpen: true });
    expect(result.current.showOnboarding).toBe(false);
  });

  it("完了すると保存され、次に開いたときは表示しない", () => {
    const first = renderOnboarding();
    expect(first.result.current.showOnboarding).toBe(true);
    act(() => {
      first.result.current.handleOnboardingComplete();
    });
    expect(first.result.current.showOnboarding).toBe(false);
    first.unmount();

    const second = renderOnboarding();
    expect(second.result.current.showOnboarding).toBe(false);
  });
});
