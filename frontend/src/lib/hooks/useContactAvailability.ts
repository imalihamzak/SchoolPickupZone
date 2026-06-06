import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api/link";

type ContactField = "email" | "phone";

type AvailabilityState = {
  checking: boolean;
  available: boolean | null;
  message: string;
};

type Options = {
  enabled?: boolean;
  excludeUserId?: string | number | null;
  debounceMs?: number;
};

const EMPTY_STATE: AvailabilityState = {
  checking: false,
  available: null,
  message: "",
};

export function useContactAvailability(
  field: ContactField,
  value: string,
  options: Options = {}
) {
  const { enabled = true, excludeUserId = null, debounceMs = 450 } = options;
  const [state, setState] = useState<AvailabilityState>(EMPTY_STATE);

  useEffect(() => {
    const trimmed = String(value || "").trim();
    if (!enabled || !trimmed) {
      setState(EMPTY_STATE);
      return;
    }

    if (field === "email" && !/\S+@\S+\.\S+/.test(trimmed)) {
      setState(EMPTY_STATE);
      return;
    }

    if (field === "phone" && trimmed.replace(/\D/g, "").length < 7) {
      setState(EMPTY_STATE);
      return;
    }

    const controller = new AbortController();
    setState({ checking: true, available: null, message: "Checking..." });
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ field, value: trimmed });
        if (excludeUserId) params.set("excludeUserId", String(excludeUserId));

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/auth/availability?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          setState({
            checking: false,
            available: null,
            message: data.error || "Could not check availability.",
          });
          return;
        }

        setState({
          checking: false,
          available: Boolean(data.available),
          message: data.message || "",
        });
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setState({
          checking: false,
          available: null,
          message: "Could not check availability.",
        });
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [debounceMs, enabled, excludeUserId, field, value]);

  return state;
}

export function contactStatusClass(state: AvailabilityState) {
  if (state.checking) return "hint";
  if (state.available === true) return "success";
  if (state.available === false) return "error";
  return "hint";
}
