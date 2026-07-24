import ExpoModulesCore
import UIKit

public class ExpoDynamicAppIconModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDynamicAppIcon")

    Property("currentIconName") {
      UIApplication.shared.alternateIconName
    }

    Property("availableIconNames") {
      Self.alternateIconNames()
    }

    AsyncFunction("setIcon") { (name: String?, promise: Promise) in
      DispatchQueue.main.async {
        guard UIApplication.shared.supportsAlternateIcons else {
          promise.reject(
            "ERR_UNSUPPORTED",
            "This device/OS does not support alternate app icons."
          )
          return
        }

        if let name = name, !Self.alternateIconNames().contains(name) {
          promise.reject(
            "ERR_ICON_NOT_FOUND",
            "No alternate icon named \"\(name)\" was found. Make sure it is declared in the config plugin and the app was rebuilt."
          )
          return
        }

        UIApplication.shared.setAlternateIconName(name) { error in
          if let error = error {
            promise.reject("ERR_SET_ICON_FAILED", error.localizedDescription)
          } else {
            promise.resolve(name as Any)
          }
        }
      }
    }
  }

  private static func alternateIconNames() -> [String] {
    guard
      let icons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
      let alternateIcons = icons["CFBundleAlternateIcons"] as? [String: Any]
    else {
      return []
    }
    return Array(alternateIcons.keys)
  }
}
