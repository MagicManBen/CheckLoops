import SwiftUI

struct StaffDashboardView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var userProfile = UserProfile()
    @State private var showingQuizAlert = false
    @State private var recentActivities: [Activity] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Hero Section
                    HeroSectionView(profile: userProfile)

                    // Quiz Alert
                    if showingQuizAlert {
                        QuizAlertView()
                    }

                    // Quick Actions Grid
                    QuickActionsGrid()
                        .padding(.horizontal)

                    // Dashboard Metrics
                    DashboardMetricsView(profile: userProfile)
                        .padding(.horizontal)

                    // Recent Activity
                    RecentActivityView(activities: recentActivities)
                        .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color.gray50)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.primary)
                        Text("CheckLoop")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(Color.gray900)
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Sign Out") {
                        authManager.signOut()
                    }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.primary)
                }
            }
        }
        .onAppear {
            loadDashboardData()
        }
    }

    private func loadDashboardData() {
        // Simulate loading data
        userProfile = UserProfile(
            name: "John Doe",
            email: authManager.currentUser?.email ?? "",
            siteName: "Main Practice",
            role: "Staff",
            trainingCompliance: 85,
            lastQuizScore: 92,
            holidaysRemaining: 25,
            holidaysUsed: 3,
            activeAlerts: 1
        )

        recentActivities = [
            Activity(type: .quiz, title: "You completed the weekly quiz", detail: "Score: 92%", timestamp: Date()),
            Activity(type: .training, title: "Fire Safety Training uploaded", detail: "Certificate uploaded", timestamp: Date().addingTimeInterval(-86400)),
            Activity(type: .holiday, title: "Holiday request approved", detail: "Dec 24 - Dec 26", timestamp: Date().addingTimeInterval(-172800))
        ]

        // Check if quiz is due
        showingQuizAlert = checkIfQuizDue()
    }

    private func checkIfQuizDue() -> Bool {
        // Check if weekly quiz is due
        return true // Simplified for demo
    }
}

// MARK: - Hero Section
struct HeroSectionView: View {
    let profile: UserProfile

    var body: some View {
        VStack(spacing: 16) {
            HStack(spacing: 20) {
                // Avatar with compliance ring
                ZStack {
                    Circle()
                        .trim(from: 0, to: CGFloat(profile.trainingCompliance) / 100)
                        .stroke(Color.success, lineWidth: 4)
                        .frame(width: 84, height: 84)
                        .rotationEffect(.degrees(-90))

                    Circle()
                        .fill(LinearGradient(
                            colors: [Color.primary, Color.accent],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 76, height: 76)

                    Text(profile.name.prefix(1).uppercased())
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(profile.siteName)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color.gray600)

                    Text("Welcome back, \(profile.name.components(separatedBy: " ").first ?? "")!")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(Color.gray900)

                    Text("\(profile.role) • \(profile.email)")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray500)
                }

                Spacer()
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
        .padding(.horizontal)
    }
}

// MARK: - Quiz Alert
struct QuizAlertView: View {
    var body: some View {
        HStack {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 24))
                .foregroundColor(.white)
                .frame(width: 44, height: 44)
                .background(Color.white.opacity(0.2))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 2) {
                Text("Weekly Quiz Due!")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)

                Text("Complete your required knowledge check")
                    .font(.system(size: 14))
                    .foregroundColor(.white.opacity(0.9))
            }

            Spacer()

            NavigationLink(destination: QuizView()) {
                Text("Take Quiz")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color.gray900)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.white)
                    .cornerRadius(8)
            }
        }
        .padding(16)
        .background(LinearGradient(
            colors: [Color.warning, Color.warning.opacity(0.8)],
            startPoint: .leading,
            endPoint: .trailing
        ))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

// MARK: - Quick Actions Grid
struct QuickActionsGrid: View {
    let actions = [
        QuickAction(title: "My Scans", icon: "doc.text.fill", destination: AnyView(ScansView())),
        QuickAction(title: "Training", icon: "graduationcap.fill", destination: AnyView(TrainingView())),
        QuickAction(title: "Holidays", icon: "calendar", destination: AnyView(HolidaysView())),
        QuickAction(title: "Quiz", icon: "questionmark.circle.fill", destination: AnyView(QuizView()))
    ]

    var body: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
            ForEach(actions) { action in
                NavigationLink(destination: action.destination) {
                    VStack(spacing: 8) {
                        Image(systemName: action.icon)
                            .font(.system(size: 24))
                            .foregroundColor(.primary)
                            .frame(width: 44, height: 44)
                            .background(Color.primaryLightest)
                            .cornerRadius(8)

                        Text(action.title)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color.gray700)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
                }
            }
        }
    }
}

// MARK: - Dashboard Metrics
struct DashboardMetricsView: View {
    let profile: UserProfile

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("My Dashboard")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Color.gray900)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 2), spacing: 12) {
                MetricCard(
                    value: "\(profile.trainingCompliance)%",
                    label: "Training Compliance",
                    progress: Double(profile.trainingCompliance) / 100,
                    color: .success
                )

                MetricCard(
                    value: profile.lastQuizScore > 0 ? "\(profile.lastQuizScore)%" : "N/A",
                    label: "Last Quiz Score",
                    progress: Double(profile.lastQuizScore) / 100,
                    color: .primary
                )

                MetricCard(
                    value: "\(profile.holidaysRemaining)",
                    label: "Holiday Days Remaining",
                    subtitle: "Used: \(profile.holidaysUsed) days",
                    color: .accent
                )

                MetricCard(
                    value: "\(profile.activeAlerts)",
                    label: "Active Alerts",
                    subtitle: profile.activeAlerts > 0 ? "Action required" : "All clear",
                    color: profile.activeAlerts > 0 ? .warning : .success
                )
            }
        }
    }
}

struct MetricCard: View {
    let value: String
    let label: String
    var subtitle: String? = nil
    var progress: Double? = nil
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(value)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(Color.gray900)

            Text(label)
                .font(.system(size: 12))
                .foregroundColor(Color.gray600)

            if let subtitle = subtitle {
                Text(subtitle)
                    .font(.system(size: 11))
                    .foregroundColor(Color.gray500)
            }

            if let progress = progress {
                ProgressView(value: progress)
                    .tint(color)
                    .scaleEffect(x: 1, y: 2)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Recent Activity
struct RecentActivityView: View {
    let activities: [Activity]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Color.gray900)

            VStack(spacing: 8) {
                ForEach(activities) { activity in
                    ActivityRow(activity: activity)
                }
            }
        }
    }
}

struct ActivityRow: View {
    let activity: Activity

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: activity.icon)
                .font(.system(size: 20))
                .foregroundColor(activity.color)
                .frame(width: 36, height: 36)
                .background(activity.color.opacity(0.1))
                .cornerRadius(8)

            VStack(alignment: .leading, spacing: 2) {
                Text(activity.title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(Color.gray900)

                Text(activity.detail)
                    .font(.system(size: 12))
                    .foregroundColor(Color.gray600)

                Text(activity.timeAgo)
                    .font(.system(size: 11))
                    .foregroundColor(Color.gray500)
            }

            Spacer()
        }
        .padding(12)
        .background(Color.white)
        .cornerRadius(8)
    }
}

// MARK: - Models
struct UserProfile {
    var name = "Staff Member"
    var email = ""
    var siteName = "CheckLoop"
    var role = "Staff"
    var trainingCompliance = 0
    var lastQuizScore = 0
    var holidaysRemaining = 0
    var holidaysUsed = 0
    var activeAlerts = 0
}

struct QuickAction: Identifiable {
    let id = UUID()
    let title: String
    let icon: String
    let destination: AnyView
}

struct Activity: Identifiable {
    enum ActivityType {
        case quiz, training, holiday, profile

        var icon: String {
            switch self {
            case .quiz: return "brain.head.profile"
            case .training: return "graduationcap.fill"
            case .holiday: return "calendar"
            case .profile: return "person.circle.fill"
            }
        }

        var color: Color {
            switch self {
            case .quiz: return .warning
            case .training: return .primary
            case .holiday: return .success
            case .profile: return .accent
            }
        }
    }

    let id = UUID()
    let type: ActivityType
    let title: String
    let detail: String
    let timestamp: Date

    var icon: String { type.icon }
    var color: Color { type.color }

    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: timestamp, relativeTo: Date())
    }
}