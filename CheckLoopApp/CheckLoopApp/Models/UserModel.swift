import Foundation

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: String
    let email: String
    var fullName: String
    var nickname: String?
    var role: String
    var siteId: String
    var siteName: String
    var avatarUrl: String?
    let createdAt: Date
    var updatedAt: Date?

    // Additional properties
    var trainingCompliance: Int
    var lastQuizScore: Int?
    var nextQuizDue: Date?
    var holidayApproved: Bool

    // Computed properties
    var displayName: String {
        nickname ?? fullName.components(separatedBy: " ").first ?? "User"
    }

    var initials: String {
        let components = fullName.components(separatedBy: " ")
        let firstInitial = components.first?.first?.uppercased() ?? ""
        let lastInitial = components.count > 1 ? components.last?.first?.uppercased() ?? "" : ""
        return firstInitial + lastInitial
    }

    var isAdmin: Bool {
        role.lowercased() == "admin" || role.lowercased() == "owner"
    }
}

// MARK: - Site Model
struct Site: Codable, Identifiable {
    let id: String
    let name: String
    let address: String?
    let phone: String?
    let email: String?
    let logoUrl: String?
    let primaryColor: String?
    let settings: SiteSettings?
}

struct SiteSettings: Codable {
    var enableAvatars: Bool = true
    var enableMeetings: Bool = true
    var enableAchievements: Bool = true
    var quizFrequency: QuizFrequency = .weekly
    var trainingValidityMonths: Int = 12
    var holidayApprovalRequired: Bool = true
}

enum QuizFrequency: String, Codable {
    case daily
    case weekly
    case biweekly
    case monthly
}

// MARK: - Training Models
struct TrainingType: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let validityMonths: Int
    let siteId: String
    var isActive: Bool
    var isMandatory: Bool
    var icon: String?
    var category: String?
}