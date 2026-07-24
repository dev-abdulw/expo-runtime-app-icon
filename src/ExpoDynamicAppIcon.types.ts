export type AppIconName = string;

export interface ExpoDynamicAppIconNativeModule {
  readonly currentIconName: string | null;
  readonly availableIconNames: string[];
  setIcon(name: string | null): Promise<string | null>;
}
