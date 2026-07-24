import { ConfigPlugin, createRunOncePlugin, WarningAggregator } from '@expo/config-plugins';

import { normalizeIcons, PluginConfig } from './types';
import { withAndroidAlternateIcons } from './withAndroidAlternateIcons';
import { withIosAlternateIcons } from './withIosAlternateIcons';

const pkg = require('../../package.json');

const withAppIcons: ConfigPlugin<PluginConfig> = (config, props) => {
  if (!props?.icons || Object.keys(props.icons).length === 0) {
    WarningAggregator.addWarningAndroid(
      pkg.name,
      'No icons configured, skipping. Pass an `icons` map, e.g. ["expo-runtime-app-icon", { icons: { red: "./assets/icon-red.png" } }]'
    );
    return config;
  }

  const icons = normalizeIcons(props.icons);

  config = withIosAlternateIcons(config, icons);
  config = withAndroidAlternateIcons(config, icons);

  return config;
};

export default createRunOncePlugin(withAppIcons, pkg.name, pkg.version);
