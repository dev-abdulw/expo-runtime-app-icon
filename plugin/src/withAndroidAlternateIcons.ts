import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from '@expo/config-plugins';
import { generateImageAsync } from '@expo/image-utils';
import fs from 'fs';
import path from 'path';

import { NormalizedAppIcon } from './types';

const ANDROID_RES_PATH = 'android/app/src/main/res/';
const LEGACY_ICON_SIZE = 48;

// Declared locally (rather than imported from @expo/config-plugins) because
// `activity-alias` isn't present on the `ManifestApplication` type in every
// @expo/config-plugins version this plugin supports (SDK 53+). The manifest
// XML parser (xml2js) accepts arbitrary keys at runtime regardless.
interface ManifestActivityAlias {
  $: {
    'android:name': string;
    'android:enabled'?: string;
    'android:exported'?: string;
    'android:icon'?: string;
    'android:roundIcon'?: string;
    'android:targetActivity': string;
    'android:label'?: string;
    [key: string]: string | undefined;
  };
  'intent-filter'?: {
    action: { $: { 'android:name': string } }[];
    category: { $: { 'android:name': string } }[];
  }[];
}

const dpiValues: Record<string, { folderName: string; scale: number }> = {
  mdpi: { folderName: 'mipmap-mdpi', scale: 1 },
  hdpi: { folderName: 'mipmap-hdpi', scale: 1.5 },
  xhdpi: { folderName: 'mipmap-xhdpi', scale: 2 },
  xxhdpi: { folderName: 'mipmap-xxhdpi', scale: 3 },
  xxxhdpi: { folderName: 'mipmap-xxxhdpi', scale: 4 },
};

function launcherName(iconName: string): string {
  return `ic_launcher_${iconName.toLowerCase()}`;
}

function roundLauncherName(iconName: string): string {
  return `ic_launcher_${iconName.toLowerCase()}_round`;
}

async function generateAndWriteAsync(
  projectRoot: string,
  cacheKey: string,
  imageOptions: { src: string; size: number; backgroundColor: string },
  destPath: string
): Promise<void> {
  const { source } = await generateImageAsync(
    { projectRoot, cacheType: `expo-runtime-app-icon-android-${cacheKey}` },
    {
      src: imageOptions.src,
      width: imageOptions.size,
      height: imageOptions.size,
      resizeMode: 'cover',
      backgroundColor: imageOptions.backgroundColor,
    }
  );
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  await fs.promises.writeFile(destPath, source);
}

async function generateIconMipmapsAsync(projectRoot: string, icon: NormalizedAppIcon) {
  const sourcePath = path.resolve(projectRoot, icon.image);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `expo-runtime-app-icon: could not find image "${icon.image}" for icon "${icon.name}" (resolved to ${sourcePath}).`
    );
  }

  const resPath = path.join(projectRoot, ANDROID_RES_PATH);

  for (const [dpi, { folderName, scale }] of Object.entries(dpiValues)) {
    const legacySize = LEGACY_ICON_SIZE * scale;
    const legacyDest = path.join(resPath, folderName, `${launcherName(icon.name)}.png`);
    await generateAndWriteAsync(
      projectRoot,
      `${icon.name}-legacy-${dpi}`,
      { src: icon.image, size: legacySize, backgroundColor: icon.backgroundColor },
      legacyDest
    );
    // Reuse the same square image for the round variant; visually acceptable for
    // alternate icons and avoids requiring a separate round asset from the user.
    const roundDest = path.join(resPath, folderName, `${roundLauncherName(icon.name)}.png`);
    await fs.promises.copyFile(legacyDest, roundDest);
  }
}

export const withAndroidAlternateIcons: ConfigPlugin<NormalizedAppIcon[]> = (config, icons) => {
  if (icons.length === 0) {
    return config;
  }

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      for (const icon of icons) {
        await generateIconMipmapsAsync(config.modRequest.projectRoot, icon);
      }
      return config;
    },
  ]);

  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest) as {
      $: { 'android:label'?: string };
      'activity-alias'?: ManifestActivityAlias[];
    };
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    const mainActivityName: string = mainActivity.$['android:name'];

    const existingAliases = application['activity-alias'] ?? [];
    // Remove any aliases we previously generated so re-runs of prebuild stay idempotent.
    const aliases = existingAliases.filter(
      (alias) => !alias.$?.['android:targetActivity']?.endsWith(mainActivityName)
    );

    for (const icon of icons) {
      aliases.push({
        $: {
          'android:name': `${mainActivityName}${icon.name}`,
          'android:enabled': 'false',
          'android:exported': 'true',
          'android:icon': `@mipmap/${launcherName(icon.name)}`,
          'android:roundIcon': `@mipmap/${roundLauncherName(icon.name)}`,
          'android:targetActivity': mainActivityName,
          'android:label': application.$?.['android:label'],
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      });
    }

    application['activity-alias'] = aliases;

    return config;
  });

  return config;
};
