import { NativeModule, requireNativeModule } from 'expo';

import { ExpoDynamicAppIconNativeModule } from './ExpoDynamicAppIcon.types';

declare class ExpoDynamicAppIconModule
  extends NativeModule<{}>
  implements ExpoDynamicAppIconNativeModule
{
  currentIconName: string | null;
  availableIconNames: string[];
  setIcon(name: string | null): Promise<string | null>;
}

export default requireNativeModule<ExpoDynamicAppIconModule>('ExpoDynamicAppIcon');
