import { useCallback, useState } from 'react';

import ExpoDynamicAppIconModule from './ExpoDynamicAppIconModule';

export interface UseAppIconResult {
  icon: string | null;
  availableIcons: string[];
  setIcon: (name: string | null) => Promise<void>;
  isChanging: boolean;
  error: Error | null;
}

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
