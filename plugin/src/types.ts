export interface AppIconConfig {
  image: string;
  backgroundColor?: string;
  androidForegroundImage?: string;
}

export interface PluginConfig {
  icons: Record<string, AppIconConfig | string>;
}

export interface NormalizedAppIcon {
  name: string;
  image: string;
  backgroundColor: string;
  androidForegroundImage: string;
}

const ICON_NAME_RE = /^[A-Za-z][A-Za-z0-9_]*$/;

export function normalizeIcons(icons: PluginConfig['icons']): NormalizedAppIcon[] {
  return Object.entries(icons).map(([name, value]) => {
    if (!ICON_NAME_RE.test(name)) {
      throw new Error(
        `expo-runtime-app-icon: invalid icon name "${name}" — names must start with a letter and contain only letters, numbers and underscores.`
      );
    }
    const config = typeof value === 'string' ? { image: value } : value;
    return {
      name,
      image: config.image,
      backgroundColor: config.backgroundColor ?? '#FFFFFF',
      androidForegroundImage: config.androidForegroundImage ?? config.image,
    };
  });
}
