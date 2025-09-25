import SwiftUI

struct QuizView: View {
    @State private var showingQuiz = false
    @State private var selectedQuiz: Quiz? = nil
    @State private var quizHistory: [QuizAttempt] = []
    @State private var weeklyQuizDue = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Weekly Quiz Alert
                    if weeklyQuizDue {
                        WeeklyQuizCard {
                            selectedQuiz = Quiz(
                                id: UUID(),
                                title: "Weekly Knowledge Check",
                                description: "Test your understanding of workplace policies and procedures",
                                questions: sampleQuestions(),
                                timeLimit: 600,
                                passingScore: 80,
                                isRequired: true
                            )
                            showingQuiz = true
                        }
                    }

                    // Quiz Stats
                    QuizStatsView(history: quizHistory)
                        .padding(.horizontal)

                    // Practice Quizzes
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Practice Quizzes")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(Color.gray900)
                            .padding(.horizontal)

                        ForEach(practiceQuizzes) { quiz in
                            QuizCard(quiz: quiz) {
                                selectedQuiz = quiz
                                showingQuiz = true
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Quiz History
                    QuizHistoryView(history: quizHistory)
                        .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color.gray50)
            .navigationTitle("Quiz")
            .navigationBarTitleDisplayMode(.large)
            .fullScreenCover(isPresented: $showingQuiz) {
                if let quiz = selectedQuiz {
                    QuizSessionView(quiz: quiz) { attempt in
                        quizHistory.insert(attempt, at: 0)
                        if quiz.isRequired {
                            weeklyQuizDue = false
                        }
                        showingQuiz = false
                    }
                }
            }
            .onAppear {
                loadQuizHistory()
            }
        }
    }

    private let practiceQuizzes = [
        Quiz(
            id: UUID(),
            title: "Fire Safety",
            description: "Test your knowledge of fire safety procedures",
            questions: [],
            timeLimit: 300,
            passingScore: 70,
            isRequired: false
        ),
        Quiz(
            id: UUID(),
            title: "Data Protection",
            description: "Understanding GDPR and data handling",
            questions: [],
            timeLimit: 300,
            passingScore: 70,
            isRequired: false
        ),
        Quiz(
            id: UUID(),
            title: "Health & Safety",
            description: "Workplace health and safety regulations",
            questions: [],
            timeLimit: 300,
            passingScore: 70,
            isRequired: false
        )
    ]

    private func loadQuizHistory() {
        // Sample history
        quizHistory = [
            QuizAttempt(
                quizTitle: "Weekly Knowledge Check",
                score: 92,
                totalQuestions: 10,
                completedAt: Date().addingTimeInterval(-86400),
                passed: true,
                timeSpent: 240
            ),
            QuizAttempt(
                quizTitle: "Fire Safety",
                score: 85,
                totalQuestions: 10,
                completedAt: Date().addingTimeInterval(-172800),
                passed: true,
                timeSpent: 180
            ),
            QuizAttempt(
                quizTitle: "Weekly Knowledge Check",
                score: 78,
                totalQuestions: 10,
                completedAt: Date().addingTimeInterval(-604800),
                passed: false,
                timeSpent: 300
            )
        ]
    }

    private func sampleQuestions() -> [QuizQuestion] {
        [
            QuizQuestion(
                text: "What is the first step when discovering a fire?",
                options: [
                    "Try to extinguish it",
                    "Sound the fire alarm",
                    "Call emergency services",
                    "Evacuate immediately"
                ],
                correctAnswer: 1
            ),
            QuizQuestion(
                text: "How often should fire drills be conducted?",
                options: [
                    "Monthly",
                    "Quarterly",
                    "Bi-annually",
                    "Annually"
                ],
                correctAnswer: 1
            ),
            QuizQuestion(
                text: "What does GDPR stand for?",
                options: [
                    "General Data Protection Rules",
                    "General Data Protection Regulation",
                    "Global Data Protection Regulation",
                    "Global Data Privacy Regulation"
                ],
                correctAnswer: 1
            )
        ]
    }
}

// MARK: - Components
struct WeeklyQuizCard: View {
    let onStart: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "exclamationmark.circle.fill")
                            .foregroundColor(.warning)
                        Text("Weekly Quiz Due")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(Color.gray900)
                    }

                    Text("Complete your required weekly knowledge check to maintain compliance")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray600)
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(spacing: 16) {
                        Label("10 Questions", systemImage: "questionmark.circle")
                        Label("10 Minutes", systemImage: "clock")
                        Label("80% to Pass", systemImage: "checkmark.circle")
                    }
                    .font(.system(size: 12))
                    .foregroundColor(Color.gray500)
                }

                Spacer()
            }

            Button(action: onStart) {
                Text("Start Quiz")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(LinearGradient(
                        colors: [Color.primary, Color.primaryDark],
                        startPoint: .leading,
                        endPoint: .trailing
                    ))
                    .cornerRadius(8)
            }
        }
        .padding(20)
        .background(LinearGradient(
            colors: [Color.warning.opacity(0.1), Color.warning.opacity(0.05)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        ))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.warning, lineWidth: 1)
        )
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

struct QuizStatsView: View {
    let history: [QuizAttempt]

    var averageScore: Int {
        guard !history.isEmpty else { return 0 }
        let total = history.reduce(0) { $0 + $1.score }
        return total / history.count
    }

    var passRate: Int {
        guard !history.isEmpty else { return 0 }
        let passed = history.filter { $0.passed }.count
        return (passed * 100) / history.count
    }

    var body: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Average Score",
                value: "\(averageScore)%",
                icon: "chart.line.uptrend.xyaxis",
                color: .primary
            )

            StatCard(
                title: "Pass Rate",
                value: "\(passRate)%",
                icon: "checkmark.shield.fill",
                color: .success
            )

            StatCard(
                title: "Total Attempts",
                value: "\(history.count)",
                icon: "number.circle.fill",
                color: .accent
            )
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)

            Text(value)
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(Color.gray900)

            Text(title)
                .font(.system(size: 11))
                .foregroundColor(Color.gray600)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

struct QuizCard: View {
    let quiz: Quiz
    let onStart: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text(quiz.title)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color.gray900)

                Text(quiz.description)
                    .font(.system(size: 13))
                    .foregroundColor(Color.gray600)
                    .lineLimit(2)

                HStack(spacing: 12) {
                    Label("\(quiz.questions.count) Questions", systemImage: "questionmark.circle")
                    Label("\(quiz.timeLimit / 60) Min", systemImage: "clock")
                }
                .font(.system(size: 11))
                .foregroundColor(Color.gray500)
            }

            Spacer()

            Button(action: onStart) {
                Text("Practice")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.primaryLightest)
                    .cornerRadius(8)
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

struct QuizHistoryView: View {
    let history: [QuizAttempt]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Attempts")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(Color.gray900)

            if history.isEmpty {
                Text("No quiz attempts yet")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray500)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 20)
            } else {
                ForEach(history) { attempt in
                    QuizHistoryRow(attempt: attempt)
                }
            }
        }
    }
}

struct QuizHistoryRow: View {
    let attempt: QuizAttempt

    var body: some View {
        HStack {
            Circle()
                .fill(attempt.passed ? Color.success : Color.danger)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 4) {
                Text(attempt.quizTitle)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(Color.gray900)

                HStack(spacing: 8) {
                    Text("\(attempt.score)%")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(attempt.passed ? .success : .danger)

                    Text("•")
                        .foregroundColor(Color.gray400)

                    Text(attempt.completedAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray600)

                    Text("•")
                        .foregroundColor(Color.gray400)

                    Text("\(attempt.timeSpent / 60) min")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray600)
                }
            }

            Spacer()

            Text(attempt.passed ? "PASSED" : "FAILED")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(attempt.passed ? .success : .danger)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(attempt.passed ? Color.success.opacity(0.1) : Color.danger.opacity(0.1))
                .cornerRadius(4)
        }
        .padding(12)
        .background(Color.white)
        .cornerRadius(8)
    }
}

// MARK: - Quiz Session View
struct QuizSessionView: View {
    let quiz: Quiz
    let onComplete: (QuizAttempt) -> Void

    @Environment(\.dismiss) var dismiss
    @State private var currentQuestionIndex = 0
    @State private var selectedAnswers: [Int?] = []
    @State private var showingResults = false
    @State private var timeRemaining: Int
    @State private var timer: Timer?

    init(quiz: Quiz, onComplete: @escaping (QuizAttempt) -> Void) {
        self.quiz = quiz
        self.onComplete = onComplete
        _timeRemaining = State(initialValue: quiz.timeLimit)
        _selectedAnswers = State(initialValue: Array(repeating: nil, count: quiz.questions.count))
    }

    var body: some View {
        NavigationStack {
            if showingResults {
                QuizResultsView(
                    quiz: quiz,
                    selectedAnswers: selectedAnswers,
                    onDone: {
                        let score = calculateScore()
                        let attempt = QuizAttempt(
                            quizTitle: quiz.title,
                            score: score,
                            totalQuestions: quiz.questions.count,
                            completedAt: Date(),
                            passed: score >= quiz.passingScore,
                            timeSpent: quiz.timeLimit - timeRemaining
                        )
                        onComplete(attempt)
                        dismiss()
                    }
                )
            } else {
                VStack(spacing: 20) {
                    // Progress and Timer
                    HStack {
                        ProgressView(value: Double(currentQuestionIndex + 1), total: Double(quiz.questions.count))
                            .tint(.primary)

                        Spacer()

                        Label(formatTime(timeRemaining), systemImage: "clock")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(timeRemaining < 60 ? .danger : Color.gray700)
                    }
                    .padding(.horizontal)

                    // Question
                    if currentQuestionIndex < quiz.questions.count {
                        QuestionView(
                            question: quiz.questions[currentQuestionIndex],
                            questionNumber: currentQuestionIndex + 1,
                            totalQuestions: quiz.questions.count,
                            selectedAnswer: selectedAnswers[currentQuestionIndex],
                            onSelect: { answer in
                                selectedAnswers[currentQuestionIndex] = answer
                            }
                        )
                    }

                    Spacer()

                    // Navigation
                    HStack {
                        Button("Previous") {
                            if currentQuestionIndex > 0 {
                                currentQuestionIndex -= 1
                            }
                        }
                        .disabled(currentQuestionIndex == 0)

                        Spacer()

                        if currentQuestionIndex == quiz.questions.count - 1 {
                            Button("Submit") {
                                showingResults = true
                            }
                            .fontWeight(.semibold)
                        } else {
                            Button("Next") {
                                currentQuestionIndex += 1
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
                .navigationTitle(quiz.title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Exit") {
                            dismiss()
                        }
                        .foregroundColor(.danger)
                    }
                }
                .onAppear {
                    startTimer()
                }
                .onDisappear {
                    timer?.invalidate()
                }
            }
        }
    }

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            if timeRemaining > 0 {
                timeRemaining -= 1
            } else {
                showingResults = true
                timer?.invalidate()
            }
        }
    }

    private func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%d:%02d", minutes, remainingSeconds)
    }

    private func calculateScore() -> Int {
        var correct = 0
        for (index, answer) in selectedAnswers.enumerated() {
            if let answer = answer, answer == quiz.questions[index].correctAnswer {
                correct += 1
            }
        }
        return (correct * 100) / quiz.questions.count
    }
}

struct QuestionView: View {
    let question: QuizQuestion
    let questionNumber: Int
    let totalQuestions: Int
    let selectedAnswer: Int?
    let onSelect: (Int) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Question header
            Text("Question \(questionNumber) of \(totalQuestions)")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(Color.gray600)
                .padding(.horizontal)

            // Question text
            Text(question.text)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(Color.gray900)
                .padding(.horizontal)

            // Answer options
            VStack(spacing: 12) {
                ForEach(0..<question.options.count, id: \.self) { index in
                    AnswerOption(
                        text: question.options[index],
                        isSelected: selectedAnswer == index,
                        onTap: { onSelect(index) }
                    )
                }
            }
            .padding(.horizontal)
        }
    }
}

struct AnswerOption: View {
    let text: String
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? .primary : Color.gray400)
                    .font(.system(size: 20))

                Text(text)
                    .font(.system(size: 16))
                    .foregroundColor(Color.gray900)
                    .multilineTextAlignment(.leading)

                Spacer()
            }
            .padding(16)
            .background(isSelected ? Color.primaryLightest : Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.primary : Color.gray300, lineWidth: 1)
            )
        }
    }
}

struct QuizResultsView: View {
    let quiz: Quiz
    let selectedAnswers: [Int?]
    let onDone: () -> Void

    var score: Int {
        var correct = 0
        for (index, answer) in selectedAnswers.enumerated() {
            if let answer = answer, answer == quiz.questions[index].correctAnswer {
                correct += 1
            }
        }
        return (correct * 100) / quiz.questions.count
    }

    var passed: Bool {
        score >= quiz.passingScore
    }

    var body: some View {
        VStack(spacing: 24) {
            // Result icon
            Image(systemName: passed ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(passed ? .success : .danger)

            // Score
            VStack(spacing: 8) {
                Text("\(score)%")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(Color.gray900)

                Text(passed ? "You Passed!" : "Try Again")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundColor(passed ? .success : .danger)

                Text("You answered \(selectedAnswers.compactMap { $0 }.filter { quiz.questions[$0].correctAnswer == $0 }.count) out of \(quiz.questions.count) questions correctly")
                    .font(.system(size: 14))
                    .foregroundColor(Color.gray600)
                    .multilineTextAlignment(.center)
            }

            // Pass/Fail message
            Text(passed ? "Great job! You've successfully completed this quiz." : "You need \(quiz.passingScore)% to pass. Review the material and try again.")
                .font(.system(size: 16))
                .foregroundColor(Color.gray700)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            // Done button
            Button(action: onDone) {
                Text("Done")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(LinearGradient(
                        colors: [Color.primary, Color.primaryDark],
                        startPoint: .leading,
                        endPoint: .trailing
                    ))
                    .cornerRadius(12)
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 32)
        .navigationBarBackButtonHidden()
    }
}

// MARK: - Models
struct Quiz: Identifiable {
    let id: UUID
    let title: String
    let description: String
    let questions: [QuizQuestion]
    let timeLimit: Int // in seconds
    let passingScore: Int // percentage
    let isRequired: Bool
}

struct QuizQuestion {
    let text: String
    let options: [String]
    let correctAnswer: Int
}

struct QuizAttempt: Identifiable {
    let id = UUID()
    let quizTitle: String
    let score: Int
    let totalQuestions: Int
    let completedAt: Date
    let passed: Bool
    let timeSpent: Int // in seconds
}