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
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
    const mainActivityName: string = mainActivity.$['android:name'];

    application['activity-alias'] = application['activity-alias'] ?? [];
    // Remove any aliases we previously generated so re-runs of prebuild stay idempotent.
    application['activity-alias'] = application['activity-alias'].filter(
      (alias) => !alias.$?.['android:targetActivity']?.endsWith(mainActivityName)
    );

    for (const icon of icons) {
      const alias: AndroidConfig.Manifest.ManifestActivityAlias = {
        $: {
          'android:name': `${mainActivityName}${icon.name}`,
          'android:enabled': 'false',
          'android:exported': 'true',
          'android:icon': `@mipmap/${launcherName(icon.name)}`,
          'android:targetActivity': mainActivityName,
          'android:label': application.$?.['android:label'],
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
            category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
          },
        ],
      };
      // android:roundIcon isn't in the type declaration but is a valid manifest attribute.
      (alias.$ as Record<string, string | undefined>)['android:roundIcon'] =
        `@mipmap/${roundLauncherName(icon.name)}`;
      application['activity-alias'].push(alias);
    }

    return config;
  });

  return config;
};
