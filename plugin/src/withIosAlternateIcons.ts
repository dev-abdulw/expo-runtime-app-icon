import { ConfigPlugin, withDangerousMod, withInfoPlist, IOSConfig } from '@expo/config-plugins';
import { generateImageAsync } from '@expo/image-utils';
import fs from 'fs';
import path from 'path';

import { NormalizedAppIcon } from './types';

const IMAGE_CACHE_NAME = 'expo-runtime-app-icon';
const ICON_SIZE = 1024;

function getIosNamedProjectPath(projectRoot: string): string {
  const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
  return path.join(projectRoot, 'ios', projectName);
}

async function writeContentsJsonAsync(
  directory: string,
  images: Record<string, unknown>[]
): Promise<void> {
  await fs.promises.mkdir(directory, { recursive: true });
  await fs.promises.writeFile(
    path.join(directory, 'Contents.json'),
    JSON.stringify(
      {
        images,
        info: { version: 1, author: 'expo-runtime-app-icon' },
      },
      null,
      2
    )
  );
}

async function generateIconSetAsync(
  projectRoot: string,
  iosNamedProjectRoot: string,
  icon: NormalizedAppIcon
): Promise<void> {
  const sourcePath = path.resolve(projectRoot, icon.image);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `expo-runtime-app-icon: could not find image "${icon.image}" for icon "${icon.name}" (resolved to ${sourcePath}).`
    );
  }

  const imageSetPath = path.join(
    iosNamedProjectRoot,
    'Images.xcassets',
    `AppIcon-${icon.name}.appiconset`
  );
  await fs.promises.mkdir(imageSetPath, { recursive: true });

  const filename = `App-Icon-${icon.name}-${ICON_SIZE}x${ICON_SIZE}@1x.png`;
  const { source } = await generateImageAsync(
    { projectRoot, cacheType: IMAGE_CACHE_NAME + icon.name },
    {
      src: icon.image,
      name: filename,
      width: ICON_SIZE,
      height: ICON_SIZE,
      resizeMode: 'cover',
      removeTransparency: true,
      backgroundColor: icon.backgroundColor,
    }
  );

  await fs.promises.writeFile(path.join(imageSetPath, filename), source);
  await writeContentsJsonAsync(imageSetPath, [
    {
      filename,
      idiom: 'universal',
      platform: 'ios',
      size: `${ICON_SIZE}x${ICON_SIZE}`,
    },
  ]);
}

export const withIosAlternateIcons: ConfigPlugin<NormalizedAppIcon[]> = (config, icons) => {
  if (icons.length === 0) {
    return config;
  }

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosNamedProjectRoot = getIosNamedProjectPath(config.modRequest.projectRoot);
      for (const icon of icons) {
        await generateIconSetAsync(config.modRequest.projectRoot, iosNamedProjectRoot, icon);
      }
      return config;
    },
  ]);

  // No Xcode project mod needed: Images.xcassets is referenced as a single folder
  // reference, so any .appiconset placed inside it is picked up automatically by
  // the asset catalog compiler.
  config = withInfoPlist(config, (config) => {
    const primaryIconName =
      typeof config.modResults.CFBundleIcons === 'object' &&
      config.modResults.CFBundleIcons !== null
        ? (config.modResults.CFBundleIcons as Record<string, unknown>)
        : {};

    const alternateIcons: Record<string, unknown> = {};
    for (const icon of icons) {
      alternateIcons[icon.name] = {
        CFBundleIconFiles: [`AppIcon-${icon.name}`],
        UIPrerenderedIcon: false,
      };
    }

    config.modResults.CFBundleIcons = {
      ...primaryIconName,
      CFBundleAlternateIcons: alternateIcons,
    } as unknown as (typeof config.modResults)['CFBundleIcons'];

    return config;
  });

  return config;
};
