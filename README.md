# expo-runtime-app-icon

Change your Expo app's icon at runtime, on iOS and Android. Ships as a config
plugin (generates the native alternate-icon assets at build time) plus a
small native module (switches the active icon at runtime).

Supports Expo SDK 53 through 57.

## How it works

On iOS this wraps `UIApplication.setAlternateIconName`. The config plugin
generates one `.appiconset` per icon and registers it under
`CFBundleIcons > CFBundleAlternateIcons` in `Info.plist`.

Android has no equivalent API, so it uses the `<activity-alias>` trick: the
plugin declares one disabled activity-alias per icon, each targeting
`MainActivity` with a different `android:icon`. Switching icons enables the
target alias and disables the rest through `PackageManager`.

Both of these require generated native code, so this only works in a dev
client or an EAS/local build — not in Expo Go. Run `expo prebuild` (or build
with EAS) after adding the plugin.

## Installation

```sh
npx expo install expo-runtime-app-icon
```

Add the plugin to `app.json`, with one entry per alternate icon. Each icon
needs a 1024x1024 source image.

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

Icon names must start with a letter and only contain letters, numbers and
underscores — they get used in native identifiers
(`AppIcon-<name>.appiconset` on iOS, `.MainActivity<name>` on Android).

Each icon entry accepts `image` (required), `backgroundColor` (defaults to
`#FFFFFF`, fills transparent areas / sets the Android adaptive background),
and `androidForegroundImage` (defaults to `image`, lets you use a separate
adaptive-icon foreground layer).

Re-run `expo prebuild` whenever you change the icon config.

## Usage

```tsx
import { getAppIcon, getAvailableAppIcons, setAppIcon, useAppIcon } from 'expo-runtime-app-icon';

await setAppIcon('red');
await setAppIcon(null); // back to default
getAppIcon(); // 'red' | null
getAvailableAppIcons(); // ['red', 'gold']

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

`setAppIcon` rejects if `name` doesn't match a configured icon or the
platform doesn't support alternate icons. On iOS it triggers the system
"change to this icon?" dialog the first time it's called in a session — OS
behavior, can't be suppressed. On Android the switch is immediate, but some
launchers only refresh the icon after the app leaves the foreground.

Not supported in Expo Go — this ships native code, so you need a dev build.
Web is a no-op (`setAppIcon` warns and resolves `null`).

## Example

[`example/`](./example) has a runnable app with two alternate icons wired up.

## License

MIT
