import { useCallback, useState } from 'react';

import ExpoDynamicAppIconModule from './ExpoDynamicAppIconModule';

export interface UseAppIconResult {
  /** The currently active icon name, or `null` for the default icon. */
  icon: string | null;
  /** All alternate icon names declared via the config plugin. */
  availableIcons: string[];
  /** Switches the app icon and updates `icon` on success. */
  setIcon: (name: string | null) => Promise<void>;
  /** True while a `setIcon` call is in flight. */
  isChanging: boolean;
  /** The error from the most recent failed `setIcon` call, if any. */
  error: Error | null;
}

/**
 * React hook for reading and changing the app icon, with local state kept in
 * sync with the native module.
 */
export function useAppIcon(): UseAppIconResult {
  const [icon, setIconState] = useState<string | null>(
    () => ExpoDynamicAppIconModule.currentIconName
  );
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setIcon = useCallback(async (name: string | null) => {
    setIsChanging(true);
    setError(null);
    try {
      const result = await ExpoDynamicAppIconModule.setIcon(name);
      setIconState(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsChanging(false);
    }
  }, []);

  return {
    icon,
    availableIcons: ExpoDynamicAppIconModule.availableIconNames,
    setIcon,
    isChanging,
    error,
  };
}
