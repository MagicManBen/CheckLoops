import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager

    var body: some View {
        Group {
            if authManager.isAuthenticated {
                TabView {
                    StaffDashboardView()
                        .tabItem {
                            Label("Dashboard", systemImage: "house.fill")
                        }

                    TrainingView()
                        .tabItem {
                            Label("Training", systemImage: "graduationcap.fill")
                        }

                    QuizView()
                        .tabItem {
                            Label("Quiz", systemImage: "questionmark.circle.fill")
                        }

                    HolidaysView()
                        .tabItem {
                            Label("Holidays", systemImage: "calendar")
                        }

                    ScansView()
                        .tabItem {
                            Label("Scans", systemImage: "doc.text.fill")
                        }
                }
                .accentColor(.primary)
            } else {
                LoginView()
            }
        }
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}