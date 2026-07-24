export interface AppIconConfig {
  /**
   * Path (relative to the project root) to a 1024x1024 source image used to
   * generate this icon's iOS asset catalog and Android mipmaps.
   */
  image: string;
  /**
   * Background color used to fill transparent areas on iOS, and as the
   * Android adaptive icon background. Defaults to "#FFFFFF".
   */
  backgroundColor?: string;
  /**
   * Foreground image for the Android adaptive icon layer. Defaults to `image`.
   */
  androidForegroundImage?: string;
}

export interface PluginConfig {
  /**
   * Map of icon name -> icon config. The icon name must be a valid Java/Kotlin
   * and Objective-C/Swift identifier fragment (letters, numbers, underscore;
   * must not start with a number), since it is used to build native
   * activity-alias / asset-catalog identifiers.
   */
  icons: Record<string, AppIconConfig | string>;
}

export interface NormalizedAppIcon {
  name: string;
  image: string;
  backgroundColor: string;
  androidForegroundImage: string;
}

export function normalizeIcons(icons: PluginConfig['icons']): NormalizedAppIcon[] {
  return Object.entries(icons).map(([name, value]) => {
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(
        `expo-runtime-app-icon: invalid icon name "${name}". Icon names must start with a letter and contain only letters, numbers, and underscores.`
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
