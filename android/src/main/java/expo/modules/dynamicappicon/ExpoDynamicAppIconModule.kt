package expo.modules.dynamicappicon

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val DEFAULT_ICON_NAME = "Default"

class IconNotFoundException(name: String) :
  CodedException("ERR_ICON_NOT_FOUND", "No alternate icon named \"$name\" was found. Make sure it is declared in the config plugin and the app was rebuilt.", null)

class ExpoDynamicAppIconModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is not available" }

  override fun definition() = ModuleDefinition {
    Name("ExpoDynamicAppIcon")

    Property("currentIconName") {
      getCurrentIconName()
    }

    Property("availableIconNames") {
      getAliasSuffixes()
    }

    AsyncFunction("setIcon") { name: String? ->
      val target = name ?: DEFAULT_ICON_NAME
      val aliases = getAliasSuffixes()
      if (target != DEFAULT_ICON_NAME && !aliases.contains(target)) {
        throw IconNotFoundException(target)
      }
      setIcon(target)
      target
    }
  }

  private fun aliasComponentName(suffix: String): ComponentName {
    val packageName = context.packageName
    val activityName = if (suffix == DEFAULT_ICON_NAME) {
      "$packageName.MainActivity"
    } else {
      "$packageName.MainActivity$suffix"
    }
    return ComponentName(packageName, activityName)
  }

  private fun getAliasSuffixes(): List<String> {
    val pm = context.packageManager
    val packageInfo = pm.getPackageInfo(
      context.packageName,
      PackageManager.GET_ACTIVITIES or PackageManager.GET_META_DATA
    )
    val prefix = "${context.packageName}.MainActivity"
    return packageInfo.activities
      .orEmpty()
      .map { it.name }
      .filter { it.startsWith(prefix) && it != "${context.packageName}.MainActivity" }
      .map { it.removePrefix(prefix) }
  }

  private fun getCurrentIconName(): String? {
    val pm = context.packageManager
    val enabledSuffix = (getAliasSuffixes() + DEFAULT_ICON_NAME).firstOrNull { suffix ->
      val state = pm.getComponentEnabledSetting(aliasComponentName(suffix))
      when (suffix) {
        DEFAULT_ICON_NAME ->
          state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED ||
            state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT
        else -> state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      }
    }
    return enabledSuffix?.takeIf { it != DEFAULT_ICON_NAME }
  }

  private fun setIcon(target: String) {
    val pm = context.packageManager
    val allSuffixes = getAliasSuffixes() + DEFAULT_ICON_NAME

    for (suffix in allSuffixes) {
      val newState = if (suffix == target) {
        PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      } else {
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED
      }
      pm.setComponentEnabledSetting(
        aliasComponentName(suffix),
        newState,
        PackageManager.DONT_KILL_APP
      )
    }
  }
}
