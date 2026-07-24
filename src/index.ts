import ExpoDynamicAppIconModule from './ExpoDynamicAppIconModule';

export * from './ExpoDynamicAppIcon.types';
export { useAppIcon } from './useAppIcon';

/**
 * The name of the currently active icon, or `null` if the default/primary icon is active.
 */
export function getAppIcon(): string | null {
  return ExpoDynamicAppIconModule.currentIconName;
}

/**
 * Names of every alternate icon declared via the config plugin and available at runtime.
 * Does not include the default icon.
 */
export function getAvailableAppIcons(): string[] {
  return ExpoDynamicAppIconModule.availableIconNames;
}

/**
 * Switches the app icon.
 *
 * @param name The name of a declared alternate icon, or `null` to reset to the default icon.
 * @returns The name that is now active (mirrors the `name` argument).
 * @throws If `name` doesn't match a declared alternate icon, or the platform/OS
 * doesn't support alternate icons (e.g. iOS < 10.3, or web).
 */
export async function setAppIcon(name: string | null): Promise<string | null> {
  return ExpoDynamicAppIconModule.setIcon(name);
}
