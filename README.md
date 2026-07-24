# expo-runtime-app-icon

Change your Expo app's icon at runtime, on iOS and Android. Ships as an Expo
config plugin (generates the native alternate-icon assets at build time) plus
a small native module (switches the active icon at runtime).

Compatible with Expo SDK 53 through 57.

## How it works

- **iOS**: uses the public `UIApplication.setAlternateIconName` API. The
  config plugin generates one `.appiconset` per declared icon and registers
  them under `CFBundleIcons > CFBundleAlternateIcons` in `Info.plist`.
- **Android**: has no equivalent OS API, so this uses the standard
  `<activity-alias>` technique — the config plugin declares one disabled
  activity-alias per icon, each targeting your `MainActivity` with a
  different `android:icon`. Switching icons enables the target alias and
  disables the others via `PackageManager`.

Because both platforms require generated native code, this only works in a
**custom dev client or EAS/local build** — not in the plain Expo Go app.
Run `expo prebuild` (or build with EAS) after adding the plugin.

## Installation

```sh
npx expo install expo-runtime-app-icon
```

## Configuration

Add the config plugin to `app.json` / `app.config.js`, declaring one entry
per alternate icon. Each icon needs a 1024x1024 source image.

```json
{
  "expo": {
    "plugins": [
      [
        "expo-runtime-app-icon",
        {
          "icons": {
            "red": "./assets/icon-red.png",
            "gold": {
              "image": "./assets/icon-gold.png",
              "backgroundColor": "#D97706"
            }
          }
        }
      ]
    ]
  }
}
```

Icon names must start with a letter and contain only letters, numbers, and
underscores — they're used to build native identifiers
(`AppIcon-<name>.appiconset` on iOS, `.MainActivity<name>` on Android).

| Option                    | Type     | Default             | Description                                                                 |
| -------------------------- | -------- | ------------------- | ----------------------------------------------------------------------------- |
| `image`                   | `string` | —                    | Path to a 1024x1024 source image, relative to the project root.               |
| `backgroundColor`         | `string` | `#FFFFFF`            | Fills transparent areas on iOS and the Android adaptive-icon background.      |
| `androidForegroundImage`  | `string` | same as `image`      | Separate foreground layer for the Android adaptive icon, if you want one.     |

After changing the plugin config, re-run `expo prebuild` (or rebuild with
EAS) to regenerate the native projects.

## Usage

```tsx
import { getAppIcon, getAvailableAppIcons, setAppIcon, useAppIcon } from 'expo-runtime-app-icon';

// Imperative API
await setAppIcon('red');   // switch to the "red" icon
await setAppIcon(null);    // switch back to the default icon
getAppIcon();               // 'red' | null
getAvailableAppIcons();     // ['red', 'gold']

// Hook
function IconPicker() {
  const { icon, availableIcons, setIcon, isChanging, error } = useAppIcon();

  return (
    <View>
      <Text>Current: {icon ?? 'Default'}</Text>
      {availableIcons.map((name) => (
        <Button key={name} title={name} disabled={isChanging} onPress={() => setIcon(name)} />
      ))}
    </View>
  );
}
```

On iOS, `setAppIcon` triggers the system "change to this icon?" confirmation
dialog the first time it's called in a session — this is OS behavior and
can't be suppressed. On Android, the switch is immediate but the launcher may
take a moment to refresh the visible icon (some OEM launchers require the
app to briefly leave the foreground).

## API

### `setAppIcon(name: string | null): Promise<string | null>`

Switches to the icon with the given name, or `null` for the default icon.
Rejects if `name` doesn't match a configured icon, or the platform/OS
doesn't support alternate icons.

### `getAppIcon(): string | null`

Returns the currently active icon name, or `null` for the default icon.

### `getAvailableAppIcons(): string[]`

Returns the names of all configured alternate icons (excludes the default).

### `useAppIcon()`

React hook returning `{ icon, availableIcons, setIcon, isChanging, error }`,
kept in sync with the native module.

## Platform notes

- **Expo Go is not supported.** This module ships native code and must be
  used in a development build (`expo prebuild` + `expo run:ios` / `expo
  run:android`) or an EAS build.
- **Web** is a no-op: `setAppIcon` warns and resolves to `null`,
  `getAvailableAppIcons()` returns `[]`.
- **Android round icons** reuse the same square source image as the regular
  launcher icon; provide a pre-cropped image if you need a distinct round
  variant.

## Example

See [`example/`](./example) for a runnable demo app wired up with two
alternate icons.

## License

MIT
