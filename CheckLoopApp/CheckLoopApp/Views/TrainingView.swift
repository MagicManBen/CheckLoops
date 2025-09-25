import SwiftUI

struct TrainingView: View {
    @State private var trainingTypes: [TrainingType] = []
    @State private var selectedFilter = "All"
    @State private var searchText = ""
    @State private var showingUploadSheet = false

    let filters = ["All", "Valid", "Expiring", "Expired"]

    var filteredTraining: [TrainingType] {
        trainingTypes.filter { training in
            let matchesSearch = searchText.isEmpty ||
                training.name.localizedCaseInsensitiveContains(searchText)

            let matchesFilter: Bool
            switch selectedFilter {
            case "Valid":
                matchesFilter = training.status == .valid
            case "Expiring":
                matchesFilter = training.status == .expiring
            case "Expired":
                matchesFilter = training.status == .expired
            default:
                matchesFilter = true
            }

            return matchesSearch && matchesFilter
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Compliance Header
                ComplianceHeaderView(
                    compliantCount: trainingTypes.filter { $0.status == .valid }.count,
                    totalCount: trainingTypes.count
                )

                // Search and Filter
                VStack(spacing: 12) {
                    // Search bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(Color.gray400)
                        TextField("Search training...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())
                    }
                    .padding(12)
                    .background(Color.gray100)
                    .cornerRadius(8)

                    // Filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(filters, id: \.self) { filter in
                                FilterChip(
                                    title: filter,
                                    isSelected: selectedFilter == filter,
                                    count: countForFilter(filter)
                                ) {
                                    selectedFilter = filter
                                }
                            }
                        }
                    }
                }
                .padding()

                // Training List
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filteredTraining) { training in
                            TrainingCard(training: training) {
                                // Handle upload action
                                showingUploadSheet = true
                            }
                        }
                    }
                    .padding()
                }
            }
            .background(Color.gray50)
            .navigationTitle("Training")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingUploadSheet = true }) {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.primary)
                    }
                }
            }
            .sheet(isPresented: $showingUploadSheet) {
                UploadTrainingView()
            }
            .onAppear {
                loadTrainingData()
            }
        }
    }

    private func loadTrainingData() {
        // Sample data
        trainingTypes = [
            TrainingType(
                name: "Fire Safety Training",
                status: .valid,
                expiryDate: Date().addingTimeInterval(86400 * 90),
                lastCompleted: Date().addingTimeInterval(-86400 * 30)
            ),
            TrainingType(
                name: "Manual Handling",
                status: .expiring,
                expiryDate: Date().addingTimeInterval(86400 * 15),
                lastCompleted: Date().addingTimeInterval(-86400 * 350)
            ),
            TrainingType(
                name: "First Aid",
                status: .expired,
                expiryDate: Date().addingTimeInterval(-86400 * 10),
                lastCompleted: Date().addingTimeInterval(-86400 * 375)
            ),
            TrainingType(
                name: "Data Protection",
                status: .valid,
                expiryDate: Date().addingTimeInterval(86400 * 180),
                lastCompleted: Date().addingTimeInterval(-86400 * 5)
            ),
            TrainingType(
                name: "Health & Safety",
                status: .valid,
                expiryDate: Date().addingTimeInterval(86400 * 200),
                lastCompleted: Date().addingTimeInterval(-86400 * 45)
            )
        ]
    }

    private func countForFilter(_ filter: String) -> Int {
        switch filter {
        case "Valid":
            return trainingTypes.filter { $0.status == .valid }.count
        case "Expiring":
            return trainingTypes.filter { $0.status == .expiring }.count
        case "Expired":
            return trainingTypes.filter { $0.status == .expired }.count
        default:
            return trainingTypes.count
        }
    }
}

// MARK: - Components
struct ComplianceHeaderView: View {
    let compliantCount: Int
    let totalCount: Int

    var compliancePercentage: Int {
        guard totalCount > 0 else { return 0 }
        return (compliantCount * 100) / totalCount
    }

    var body: some View {
        VStack(spacing: 16) {
            // Progress ring
            ZStack {
                Circle()
                    .stroke(Color.gray200, lineWidth: 12)
                    .frame(width: 120, height: 120)

                Circle()
                    .trim(from: 0, to: CGFloat(compliancePercentage) / 100)
                    .stroke(complianceColor, lineWidth: 12)
                    .frame(width: 120, height: 120)
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 4) {
                    Text("\(compliancePercentage)%")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(Color.gray900)

                    Text("Compliant")
                        .font(.system(size: 14))
                        .foregroundColor(Color.gray600)
                }
            }

            // Stats
            HStack(spacing: 32) {
                VStack(spacing: 4) {
                    Text("\(compliantCount)")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.success)
                    Text("Up to date")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray600)
                }

                VStack(spacing: 4) {
                    Text("\(totalCount - compliantCount)")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.danger)
                    Text("Action needed")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray600)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(Color.white)
    }

    var complianceColor: Color {
        switch compliancePercentage {
        case 80...100:
            return .success
        case 50..<80:
            return .warning
        default:
            return .danger
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let count: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(title)
                    .font(.system(size: 14, weight: isSelected ? .semibold : .medium))

                if count > 0 {
                    Text("\(count)")
                        .font(.system(size: 12, weight: .bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(isSelected ? Color.white.opacity(0.3) : Color.gray200)
                        .cornerRadius(10)
                }
            }
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

struct TrainingCard: View {
    let training: TrainingType
    let onUpload: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            // Status indicator
            Circle()
                .fill(training.statusColor)
                .frame(width: 12, height: 12)

            // Training info
            VStack(alignment: .leading, spacing: 4) {
                Text(training.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(Color.gray900)

                HStack(spacing: 12) {
                    Label(training.statusText, systemImage: training.statusIcon)
                        .font(.system(size: 13))
                        .foregroundColor(training.statusColor)

                    if let expiryDate = training.expiryDate {
                        Text("Expires: \(expiryDate.formatted(date: .abbreviated, time: .omitted))")
                            .font(.system(size: 13))
                            .foregroundColor(Color.gray600)
                    }
                }
            }

            Spacer()

            // Upload button
            Button(action: onUpload) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.primary)
            }
        }
        .padding(16)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Upload View
struct UploadTrainingView: View {
    @Environment(\.dismiss) var dismiss
    @State private var selectedTrainingType = ""
    @State private var selectedDate = Date()
    @State private var showingImagePicker = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Training Details") {
                    Picker("Training Type", selection: $selectedTrainingType) {
                        Text("Select Training").tag("")
                        Text("Fire Safety").tag("fire_safety")
                        Text("Manual Handling").tag("manual_handling")
                        Text("First Aid").tag("first_aid")
                        Text("Data Protection").tag("data_protection")
                    }

                    DatePicker("Completion Date", selection: $selectedDate, displayedComponents: .date)
                }

                Section("Certificate") {
                    Button(action: { showingImagePicker = true }) {
                        HStack {
                            Image(systemName: "camera.fill")
                            Text("Take Photo")
                        }
                    }

                    Button(action: { showingImagePicker = true }) {
                        HStack {
                            Image(systemName: "photo.fill")
                            Text("Choose from Library")
                        }
                    }
                }
            }
            .navigationTitle("Upload Training")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Upload") {
                        // Handle upload
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .disabled(selectedTrainingType.isEmpty)
                }
            }
        }
    }
}

// MARK: - Model
struct TrainingType: Identifiable {
    enum Status {
        case valid, expiring, expired

        var color: Color {
            switch self {
            case .valid: return .success
            case .expiring: return .warning
            case .expired: return .danger
            }
        }
    }

    let id = UUID()
    let name: String
    let status: Status
    let expiryDate: Date?
    let lastCompleted: Date?

    var statusColor: Color { status.color }

    var statusText: String {
        switch status {
        case .valid: return "Valid"
        case .expiring: return "Expiring Soon"
        case .expired: return "Expired"
        }
    }

    var statusIcon: String {
        switch status {
        case .valid: return "checkmark.circle.fill"
        case .expiring: return "exclamationmark.triangle.fill"
        case .expired: return "xmark.circle.fill"
        }
    }
}