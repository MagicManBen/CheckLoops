import Foundation

class NetworkManager {
    static let shared = NetworkManager()

    private let baseURL = "https://api.checkloop.com/v1" // Replace with actual API URL
    private let session: URLSession

    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Generic Request Method
    func request<T: Decodable>(_ endpoint: Endpoint, type: T.Type) async throws -> T {
        let url = try buildURL(for: endpoint)
        var request = URLRequest(url: url)

        // Configure request
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Add authentication header if available
        if let token = getAccessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Add body if present
        if let body = endpoint.body {
            request.httpBody = try JSONEncoder().encode(body)
        }

        // Make request
        let (data, response) = try await session.data(for: request)

        // Check response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            // Success - decode response
            do {
                let decodedData = try JSONDecoder().decode(T.self, from: data)
                return decodedData
            } catch {
                throw NetworkError.decodingError(error)
            }
        case 401:
            throw NetworkError.unauthorized
        case 403:
            throw NetworkError.forbidden
        case 404:
            throw NetworkError.notFound
        case 500...599:
            throw NetworkError.serverError(httpResponse.statusCode)
        default:
            throw NetworkError.httpError(httpResponse.statusCode)
        }
    }

    // MARK: - Helper Methods
    private func buildURL(for endpoint: Endpoint) throws -> URL {
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw NetworkError.invalidURL
        }

        // Add query parameters if present
        if let queryItems = endpoint.queryItems, !queryItems.isEmpty {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.queryItems = queryItems.map { URLQueryItem(name: $0.key, value: $0.value) }

            guard let finalURL = components?.url else {
                throw NetworkError.invalidURL
            }
            return finalURL
        }

        return url
    }

    private func getAccessToken() -> String? {
        // Retrieve from keychain/UserDefaults
        UserDefaults.standard.string(forKey: "com.checkloop.accessToken")
    }

    // MARK: - Specific API Methods

    // Authentication
    func signIn(email: String, password: String) async throws -> AuthResponse {
        let endpoint = Endpoint(
            path: "/auth/signin",
            method: .post,
            body: ["email": email, "password": password]
        )
        return try await request(endpoint, type: AuthResponse.self)
    }

    // User Profile
    func getUserProfile(userId: String) async throws -> User {
        let endpoint = Endpoint(
            path: "/users/\(userId)",
            method: .get
        )
        return try await request(endpoint, type: User.self)
    }

    func updateUserProfile(userId: String, updates: [String: Any]) async throws -> User {
        let endpoint = Endpoint(
            path: "/users/\(userId)",
            method: .patch,
            body: updates
        )
        return try await request(endpoint, type: User.self)
    }

    // Training
    func getTrainingTypes(siteId: String) async throws -> [TrainingType] {
        let endpoint = Endpoint(
            path: "/training/types",
            method: .get,
            queryItems: ["site_id": siteId]
        )
        return try await request(endpoint, type: [TrainingType].self)
    }

    func uploadTrainingCertificate(trainingId: String, imageData: Data) async throws -> TrainingRecord {
        // For file uploads, would need multipart form data implementation
        throw NetworkError.notImplemented
    }

    // Quiz
    func getQuizzes(siteId: String) async throws -> [Quiz] {
        let endpoint = Endpoint(
            path: "/quizzes",
            method: .get,
            queryItems: ["site_id": siteId]
        )
        return try await request(endpoint, type: [Quiz].self)
    }

    func submitQuizAttempt(quizId: String, answers: [Int]) async throws -> QuizResult {
        let endpoint = Endpoint(
            path: "/quizzes/\(quizId)/attempt",
            method: .post,
            body: ["answers": answers]
        )
        return try await request(endpoint, type: QuizResult.self)
    }

    // Holidays
    func getHolidayBalance(userId: String) async throws -> HolidayBalance {
        let endpoint = Endpoint(
            path: "/holidays/balance/\(userId)",
            method: .get
        )
        return try await request(endpoint, type: HolidayBalance.self)
    }

    func requestHoliday(request: HolidayRequest) async throws -> HolidayRequest {
        let endpoint = Endpoint(
            path: "/holidays/request",
            method: .post,
            body: request
        )
        return try await request(endpoint, type: HolidayRequest.self)
    }
}

// MARK: - Supporting Types
struct Endpoint {
    let path: String
    let method: HTTPMethod
    var queryItems: [String: String]? = nil
    var body: Encodable? = nil
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

enum NetworkError: LocalizedError {
    case invalidURL
    case invalidResponse
    case decodingError(Error)
    case encodingError(Error)
    case unauthorized
    case forbidden
    case notFound
    case serverError(Int)
    case httpError(Int)
    case notImplemented

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Failed to encode request: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized. Please sign in again"
        case .forbidden:
            return "Access forbidden"
        case .notFound:
            return "Resource not found"
        case .serverError(let code):
            return "Server error: \(code)"
        case .httpError(let code):
            return "HTTP error: \(code)"
        case .notImplemented:
            return "Feature not implemented"
        }
    }
}

// MARK: - Response Models
struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: User
}

struct TrainingRecord: Codable {
    let id: String
    let trainingTypeId: String
    let userId: String
    let completedAt: Date
    let expiryDate: Date
    let certificateUrl: String?
}

struct QuizResult: Codable {
    let score: Int
    let passed: Bool
    let correctAnswers: Int
    let totalQuestions: Int
}