import SwiftUI

struct AchievementsView: View {
    @State private var achievements: [Achievement] = []
    @State private var selectedCategory = "All"

    let categories = ["All", "Training", "Quiz", "Milestones", "Special"]

    var filteredAchievements: [Achievement] {
        if selectedCategory == "All" {
            return achievements
        }
        return achievements.filter { $0.category.rawValue == selectedCategory }
    }

    var unlockedCount: Int {
        achievements.filter { $0.isUnlocked }.count
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Progress Overview
                    ProgressOverviewCard(
                        unlocked: unlockedCount,
                        total: achievements.count
                    )
                    .padding(.horizontal)

                    // Category Filter
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(categories, id: \.self) { category in
                                CategoryChip(
                                    title: category,
                                    isSelected: selectedCategory == category
                                ) {
                                    selectedCategory = category
                                }
                            }
                        }
                        .padding(.horizontal)
                    }

                    // Achievements Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(filteredAchievements) { achievement in
                            AchievementBadge(achievement: achievement)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color.gray50)
            .navigationTitle("Achievements")
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                loadAchievements()
            }
        }
    }

    private func loadAchievements() {
        achievements = [
            Achievement(
                title: "First Steps",
                description: "Complete your first training",
                icon: "flag.checkered",
                category: .training,
                isUnlocked: true,
                unlockedDate: Date().addingTimeInterval(-604800),
                progress: 1,
                maxProgress: 1
            ),
            Achievement(
                title: "Quiz Master",
                description: "Score 100% on a quiz",
                icon: "star.circle.fill",
                category: .quiz,
                isUnlocked: true,
                unlockedDate: Date().addingTimeInterval(-86400),
                progress: 1,
                maxProgress: 1
            ),
            Achievement(
                title: "Dedicated Learner",
                description: "Complete 5 training modules",
                icon: "book.circle.fill",
                category: .training,
                isUnlocked: true,
                unlockedDate: Date().addingTimeInterval(-172800),
                progress: 5,
                maxProgress: 5
            ),
            Achievement(
                title: "Perfect Week",
                description: "Complete weekly quiz on time for 4 weeks",
                icon: "calendar.badge.checkmark",
                category: .quiz,
                isUnlocked: false,
                progress: 3,
                maxProgress: 4
            ),
            Achievement(
                title: "Compliance Champion",
                description: "Maintain 100% compliance for 30 days",
                icon: "shield.checkered",
                category: .milestones,
                isUnlocked: false,
                progress: 22,
                maxProgress: 30
            ),
            Achievement(
                title: "Team Player",
                description: "Help 3 colleagues with training",
                icon: "person.3.fill",
                category: .special,
                isUnlocked: false,
                progress: 1,
                maxProgress: 3
            ),
            Achievement(
                title: "Early Bird",
                description: "Complete training before deadline",
                icon: "sunrise.fill",
                category: .training,
                isUnlocked: true,
                unlockedDate: Date().addingTimeInterval(-259200),
                progress: 1,
                maxProgress: 1
            ),
            Achievement(
                title: "Streak Master",
                description: "10-day activity streak",
                icon: "flame.fill",
                category: .milestones,
                isUnlocked: false,
                progress: 7,
                maxProgress: 10
            ),
            Achievement(
                title: "Safety First",
                description: "Complete all safety training",
                icon: "cross.circle.fill",
                category: .training,
                isUnlocked: false,
                progress: 2,
                maxProgress: 3
            )
        ]
    }
}

// MARK: - Components
struct ProgressOverviewCard: View {
    let unlocked: Int
    let total: Int

    var progressPercentage: Double {
        guard total > 0 else { return 0 }
        return Double(unlocked) / Double(total)
    }

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Your Progress")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color.gray600)

                    Text("\(unlocked) of \(total) Unlocked")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(Color.gray900)

                    Text("\(Int(progressPercentage * 100))% Complete")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray500)
                }

                Spacer()

                // Progress circle
                ZStack {
                    Circle()
                        .stroke(Color.gray200, lineWidth: 8)
                        .frame(width: 80, height: 80)

                    Circle()
                        .trim(from: 0, to: progressPercentage)
                        .stroke(LinearGradient(
                            colors: [Color.primary, Color.accent],
                            startPoint: .leading,
                            endPoint: .trailing
                        ), lineWidth: 8)
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))

                    Text("\(Int(progressPercentage * 100))%")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(Color.gray900)
                }
            }

            // Recent unlock
            if let recentAchievement = getRecentUnlock() {
                HStack {
                    Image(systemName: "sparkles")
                        .foregroundColor(.warning)
                    Text("Latest: \(recentAchievement)")
                        .font(.system(size: 13))
                        .foregroundColor(Color.gray600)
                    Spacer()
                }
                .padding(12)
                .background(Color.warning.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }

    private func getRecentUnlock() -> String? {
        // Would fetch the most recent achievement
        return "Quiz Master"
    }
}

struct CategoryChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: isSelected ? .semibold : .medium))
                .foregroundColor(isSelected ? .white : Color.gray700)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.primary : Color.white)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(isSelected ? Color.clear : Color.gray300, lineWidth: 1)
                )
        }
    }
}

struct AchievementBadge: View {
    let achievement: Achievement

    var body: some View {
        VStack(spacing: 8) {
            // Badge icon
            ZStack {
                if achievement.isUnlocked {
                    Circle()
                        .fill(LinearGradient(
                            colors: [achievement.color, achievement.color.opacity(0.6)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ))
                        .frame(width: 60, height: 60)
                } else {
                    Circle()
                        .fill(Color.gray200)
                        .frame(width: 60, height: 60)

                    if achievement.progress > 0 {
                        Circle()
                            .trim(from: 0, to: Double(achievement.progress) / Double(achievement.maxProgress))
                            .stroke(achievement.color, lineWidth: 3)
                            .frame(width: 60, height: 60)
                            .rotationEffect(.degrees(-90))
                    }
                }

                Image(systemName: achievement.icon)
                    .font(.system(size: 24))
                    .foregroundColor(achievement.isUnlocked ? .white : Color.gray400)
            }

            // Title
            Text(achievement.title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(achievement.isUnlocked ? Color.gray900 : Color.gray500)
                .multilineTextAlignment(.center)
                .lineLimit(2)

            // Progress or date
            if achievement.isUnlocked, let date = achievement.unlockedDate {
                Text(date.formatted(date: .abbreviated, time: .omitted))
                    .font(.system(size: 10))
                    .foregroundColor(Color.gray500)
            } else if !achievement.isUnlocked {
                Text("\(achievement.progress)/\(achievement.maxProgress)")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Color.gray600)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(achievement.isUnlocked ? Color.white : Color.gray50)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(achievement.isUnlocked ? achievement.color.opacity(0.3) : Color.gray200, lineWidth: 1)
        )
        .shadow(color: achievement.isUnlocked ? achievement.color.opacity(0.2) : Color.black.opacity(0.05),
                radius: achievement.isUnlocked ? 8 : 4,
                x: 0,
                y: achievement.isUnlocked ? 4 : 2)
    }
}

// MARK: - Model
struct Achievement: Identifiable {
    enum Category: String {
        case training = "Training"
        case quiz = "Quiz"
        case milestones = "Milestones"
        case special = "Special"

        var color: Color {
            switch self {
            case .training: return .primary
            case .quiz: return .warning
            case .milestones: return .success
            case .special: return .accent
            }
        }
    }

    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let category: Category
    let isUnlocked: Bool
    var unlockedDate: Date? = nil
    let progress: Int
    let maxProgress: Int

    var color: Color { category.color }
}