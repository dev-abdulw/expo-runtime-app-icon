/**
 * The name of an alternate icon as declared in the `icons` map passed to the
 * `expo-runtime-app-icon` config plugin. `null` always represents the app's
 * default/primary icon.
 */
export type AppIconName = string;

export interface ExpoDynamicAppIconNativeModule {
  readonly currentIconName: string | null;
  readonly availableIconNames: string[];
  setIcon(name: string | null): Promise<string | null>;
}
