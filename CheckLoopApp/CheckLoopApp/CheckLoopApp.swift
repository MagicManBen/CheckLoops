import SwiftUI

@main
struct CheckLoopApp: App {
    @StateObject private var authManager = AuthenticationManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .preferredColorScheme(.light)
        }
    }
}

// MARK: - Color Theme
extension Color {
    static let primary = Color(red: 0.043, green: 0.31, blue: 0.702)
    static let primaryDark = Color(red: 0.024, green: 0.169, blue: 0.435)
    static let primaryLight = Color(red: 0.169, green: 0.431, blue: 0.8)
    static let primaryLightest = Color(red: 0.91, green: 0.949, blue: 1.0)

    static let accent = Color(red: 0.463, green: 0.655, blue: 1.0)
    static let success = Color(red: 0.169, green: 0.831, blue: 0.655)
    static let warning = Color(red: 1.0, green: 0.792, blue: 0.157)
    static let danger = Color(red: 1.0, green: 0.42, blue: 0.42)

    static let gray50 = Color(red: 0.973, green: 0.98, blue: 0.988)
    static let gray100 = Color(red: 0.945, green: 0.961, blue: 0.976)
    static let gray200 = Color(red: 0.886, green: 0.91, blue: 0.941)
    static let gray300 = Color(red: 0.796, green: 0.835, blue: 0.882)
    static let gray400 = Color(red: 0.58, green: 0.639, blue: 0.722)
    static let gray500 = Color(red: 0.392, green: 0.455, blue: 0.545)
    static let gray600 = Color(red: 0.278, green: 0.333, blue: 0.412)
    static let gray700 = Color(red: 0.2, green: 0.255, blue: 0.333)
    static let gray800 = Color(red: 0.118, green: 0.161, blue: 0.231)
    static let gray900 = Color(red: 0.059, green: 0.09, blue: 0.165)
}