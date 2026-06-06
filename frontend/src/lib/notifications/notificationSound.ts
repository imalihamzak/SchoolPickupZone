import { useCallback, useEffect, useState } from "react";

type NotificationSoundPreferences = {
  enabled: boolean;
  volume: number;
};

const SOUND_SRC = "/sounds/notification.mp3";
const DEFAULT_PREFERENCES: NotificationSoundPreferences = {
  enabled: true,
  volume: 0.75,
};
const STORAGE_PREFIX = "pickupzone.notificationSound";
const PREFERENCES_EVENT = "pickupzone:notification-sound-preferences";

let audioElement: HTMLAudioElement | null = null;
let unlockInstalled = false;
let unlocked = false;
let pendingSoundUserId: string | number | null | undefined = null;
let removeUnlockListeners: (() => void) | null = null;

function getStorageKey(userId?: string | number | null) {
  return userId ? `${STORAGE_PREFIX}.${userId}` : STORAGE_PREFIX;
}

function clampVolume(value: unknown) {
  const volume = Number(value);
  if (!Number.isFinite(volume)) return DEFAULT_PREFERENCES.volume;
  return Math.min(1, Math.max(0, volume));
}

function normalizePreferences(value?: Partial<NotificationSoundPreferences> | null): NotificationSoundPreferences {
  return {
    enabled: value?.enabled !== false,
    volume: clampVolume(value?.volume),
  };
}

function readPreferencesFromStorage(userId?: string | number | null): NotificationSoundPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;

  const keys = [getStorageKey(userId), STORAGE_PREFIX].filter(Boolean);
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      return normalizePreferences(JSON.parse(raw));
    } catch {
      window.localStorage.removeItem(key);
    }
  }

  return DEFAULT_PREFERENCES;
}

function getAudioElement() {
  if (typeof window === "undefined") return null;
  if (!audioElement) {
    audioElement = new Audio(SOUND_SRC);
    audioElement.preload = "auto";
    audioElement.volume = DEFAULT_PREFERENCES.volume;
    audioElement.load();
  }
  return audioElement;
}

async function unlockNotificationAudio() {
  if (unlocked) return;

  const audio = getAudioElement();
  if (!audio) return;

  const previousMuted = audio.muted;
  const previousVolume = audio.volume;

  try {
    audio.muted = true;
    audio.volume = 0;
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    unlocked = true;
  } catch {
    unlocked = false;
  } finally {
    audio.muted = previousMuted;
    audio.volume = previousVolume;
  }

  if (pendingSoundUserId !== null && pendingSoundUserId !== undefined) {
    const queuedUserId = pendingSoundUserId;
    pendingSoundUserId = null;
    playNotificationSound(queuedUserId);
  }

  if (unlocked && removeUnlockListeners) {
    removeUnlockListeners();
    removeUnlockListeners = null;
  }
}

export function installNotificationSoundUnlock() {
  if (typeof window === "undefined" || unlockInstalled) return;

  unlockInstalled = true;
  const unlock = () => {
    unlockNotificationAudio();
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock);

  removeUnlockListeners = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
}

export function getNotificationSoundPreferences(userId?: string | number | null) {
  return readPreferencesFromStorage(userId);
}

export function saveNotificationSoundPreferences(
  nextPreferences: Partial<NotificationSoundPreferences>,
  userId?: string | number | null
) {
  if (typeof window === "undefined") return normalizePreferences(nextPreferences);

  const preferences = normalizePreferences({
    ...readPreferencesFromStorage(userId),
    ...nextPreferences,
  });

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent(PREFERENCES_EVENT, {
      detail: { preferences, userId: userId ? String(userId) : null },
    })
  );

  return preferences;
}

export function playNotificationSound(userId?: string | number | null) {
  const preferences = readPreferencesFromStorage(userId);
  if (!preferences.enabled || preferences.volume <= 0) return;

  const audio = getAudioElement();
  if (!audio) return;

  audio.muted = false;
  audio.volume = preferences.volume;

  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // Some browsers can throw while seeking before metadata has loaded.
  }

  audio
    .play()
    .then(() => {
      unlocked = true;
      if (removeUnlockListeners) {
        removeUnlockListeners();
        removeUnlockListeners = null;
      }
    })
    .catch(() => {
      if (!unlocked) {
        pendingSoundUserId = userId;
      }
    });
}

export function useNotificationSoundPreferences(userId?: string | number | null) {
  const [preferences, setPreferences] = useState<NotificationSoundPreferences>(() =>
    readPreferencesFromStorage(userId)
  );

  useEffect(() => {
    setPreferences(readPreferencesFromStorage(userId));
  }, [userId]);

  useEffect(() => {
    const handlePreferenceUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.userId || !userId || String(detail.userId) === String(userId)) {
        setPreferences(readPreferencesFromStorage(userId));
      }
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === getStorageKey(userId) || event.key === STORAGE_PREFIX) {
        setPreferences(readPreferencesFromStorage(userId));
      }
    };

    window.addEventListener(PREFERENCES_EVENT, handlePreferenceUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener(PREFERENCES_EVENT, handlePreferenceUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [userId]);

  const updatePreferences = useCallback(
    (nextPreferences: Partial<NotificationSoundPreferences>) => {
      setPreferences(saveNotificationSoundPreferences(nextPreferences, userId));
    },
    [userId]
  );

  const testSound = useCallback(() => {
    playNotificationSound(userId);
  }, [userId]);

  return {
    soundPreferences: preferences,
    updateSoundPreferences: updatePreferences,
    testNotificationSound: testSound,
  };
}
