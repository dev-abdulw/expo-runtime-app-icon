import ExpoDynamicAppIconModule from './ExpoDynamicAppIconModule';

export * from './ExpoDynamicAppIcon.types';
export { useAppIcon } from './useAppIcon';

export function getAppIcon(): string | null {
  return ExpoDynamicAppIconModule.currentIconName;
}

export function getAvailableAppIcons(): string[] {
  return ExpoDynamicAppIconModule.availableIconNames;
}

// name is an icon declared via the config plugin, or null to reset to the default icon.
export async function setAppIcon(name: string | null): Promise<string | null> {
  return ExpoDynamicAppIconModule.setIcon(name);
}
