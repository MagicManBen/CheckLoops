import Foundation
import SwiftUI

@MainActor
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    // Keychain keys
    private let accessTokenKey = "com.checkloop.accessToken"
    private let refreshTokenKey = "com.checkloop.refreshToken"
    private let userDataKey = "com.checkloop.userData"

    init() {
        checkAuthenticationStatus()
    }

    // MARK: - Authentication Methods
    func signIn(email: String, password: String) async throws {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        // Simulate API call
        try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay

        // Validate credentials (simplified for demo)
        guard !email.isEmpty && !password.isEmpty else {
            throw AuthError.invalidCredentials
        }

        // Create mock user
        let user = User(
            id: UUID().uuidString,
            email: email,
            fullName: "John Doe",
            role: "Staff",
            siteId: "site_123",
            siteName: "Main Practice",
            avatarUrl: nil,
            createdAt: Date(),
            trainingCompliance: 85,
            holidayApproved: true
        )

        // Store authentication tokens
        storeTokens(accessToken: "mock_access_token", refreshToken: "mock_refresh_token")

        // Store user data
        if let userData = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(userData, forKey: userDataKey)
        }

        // Update state
        self.currentUser = user
        self.isAuthenticated = true
    }

    func signOut() {
        // Clear tokens
        clearTokens()

        // Clear user data
        UserDefaults.standard.removeObject(forKey: userDataKey)

        // Update state
        self.currentUser = nil
        self.isAuthenticated = false
    }

    func signUp(email: String, password: String, fullName: String) async throws {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        // Simulate API call
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // Validate inputs
        guard !email.isEmpty && !password.isEmpty && !fullName.isEmpty else {
            throw AuthError.invalidInput
        }

        // Create new user account (simplified)
        let user = User(
            id: UUID().uuidString,
            email: email,
            fullName: fullName,
            role: "Staff",
            siteId: "site_123",
            siteName: "Main Practice",
            avatarUrl: nil,
            createdAt: Date(),
            trainingCompliance: 0,
            holidayApproved: false
        )

        // Store authentication tokens
        storeTokens(accessToken: "mock_access_token", refreshToken: "mock_refresh_token")

        // Store user data
        if let userData = try? JSONEncoder().encode(user) {
            UserDefaults.standard.set(userData, forKey: userDataKey)
        }

        // Update state
        self.currentUser = user
        self.isAuthenticated = true
    }

    func resetPassword(email: String) async throws {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        // Simulate API call
        try await Task.sleep(nanoseconds: 1_000_000_000)

        guard !email.isEmpty else {
            throw AuthError.invalidEmail
        }

        // Send password reset email (mock)
        print("Password reset email sent to: \(email)")
    }

    // MARK: - Token Management
    private func storeTokens(accessToken: String, refreshToken: String) {
        // In a real app, use Keychain for secure storage
        UserDefaults.standard.set(accessToken, forKey: accessTokenKey)
        UserDefaults.standard.set(refreshToken, forKey: refreshTokenKey)
    }

    private func clearTokens() {
        UserDefaults.standard.removeObject(forKey: accessTokenKey)
        UserDefaults.standard.removeObject(forKey: refreshTokenKey)
    }

    private func getAccessToken() -> String? {
        UserDefaults.standard.string(forKey: accessTokenKey)
    }

    private func getRefreshToken() -> String? {
        UserDefaults.standard.string(forKey: refreshTokenKey)
    }

    // MARK: - Session Management
    private func checkAuthenticationStatus() {
        // Check for stored tokens and user data
        if let _ = getAccessToken(),
           let userData = UserDefaults.standard.data(forKey: userDataKey),
           let user = try? JSONDecoder().decode(User.self, from: userData) {
            self.currentUser = user
            self.isAuthenticated = true
        } else {
            self.isAuthenticated = false
        }
    }

    func refreshSession() async throws {
        guard let refreshToken = getRefreshToken() else {
            throw AuthError.noRefreshToken
        }

        // Simulate token refresh
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 second

        // Update tokens
        storeTokens(accessToken: "new_access_token", refreshToken: refreshToken)
    }
}

// MARK: - Error Types
enum AuthError: LocalizedError {
    case invalidCredentials
    case invalidEmail
    case invalidInput
    case noRefreshToken
    case networkError
    case serverError
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Invalid email or password"
        case .invalidEmail:
            return "Please enter a valid email address"
        case .invalidInput:
            return "Please fill in all required fields"
        case .noRefreshToken:
            return "Session expired. Please sign in again"
        case .networkError:
            return "Network connection error. Please check your internet connection"
        case .serverError:
            return "Server error. Please try again later"
        case .unknown:
            return "An unexpected error occurred"
        }
    }
}