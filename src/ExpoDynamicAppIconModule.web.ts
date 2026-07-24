import { registerWebModule, NativeModule } from 'expo';

import { ExpoDynamicAppIconNativeModule } from './ExpoDynamicAppIcon.types';

class ExpoDynamicAppIconModule extends NativeModule<{}> implements ExpoDynamicAppIconNativeModule {
  currentIconName: string | null = null;
  availableIconNames: string[] = [];

  async setIcon(_name: string | null): Promise<string | null> {
    console.warn(
      '[expo-runtime-app-icon] Dynamic app icons are not supported on web; setIcon() is a no-op.'
    );
    return null;
  }
}

export default registerWebModule(ExpoDynamicAppIconModule, 'ExpoDynamicAppIconModule');
