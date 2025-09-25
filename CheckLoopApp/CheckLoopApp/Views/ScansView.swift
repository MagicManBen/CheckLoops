import SwiftUI

struct ScansView: View {
    @State private var scans: [Scan] = []
    @State private var selectedFilter = "All"
    @State private var searchText = ""

    let filters = ["All", "Pending", "Reviewed", "Flagged"]

    var filteredScans: [Scan] {
        scans.filter { scan in
            let matchesSearch = searchText.isEmpty ||
                scan.title.localizedCaseInsensitiveContains(searchText) ||
                scan.type.localizedCaseInsensitiveContains(searchText)

            let matchesFilter: Bool
            switch selectedFilter {
            case "Pending":
                matchesFilter = scan.status == .pending
            case "Reviewed":
                matchesFilter = scan.status == .reviewed
            case "Flagged":
                matchesFilter = scan.status == .flagged
            default:
                matchesFilter = true
            }

            return matchesSearch && matchesFilter
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color.gray400)
                    TextField("Search documents...", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding(12)
                .background(Color.gray100)
                .cornerRadius(8)
                .padding()

                // Filter tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(filters, id: \.self) { filter in
                            FilterTab(
                                title: filter,
                                isSelected: selectedFilter == filter,
                                count: countForFilter(filter)
                            ) {
                                selectedFilter = filter
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.bottom, 12)

                // Scans list
                if filteredScans.isEmpty {
                    EmptyScansView()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(filteredScans) { scan in
                                ScanCard(scan: scan)
                            }
                        }
                        .padding()
                    }
                }
            }
            .background(Color.gray50)
            .navigationTitle("My Scans")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {}) {
                        Image(systemName: "doc.badge.plus")
                            .foregroundColor(.primary)
                    }
                }
            }
            .onAppear {
                loadScans()
            }
        }
    }

    private func loadScans() {
        scans = [
            Scan(
                title: "Fire Safety Certificate",
                type: "Certificate",
                uploadedAt: Date().addingTimeInterval(-86400),
                status: .reviewed,
                reviewer: "Admin",
                fileSize: "2.4 MB"
            ),
            Scan(
                title: "Manual Handling Training",
                type: "Training",
                uploadedAt: Date().addingTimeInterval(-172800),
                status: .pending,
                fileSize: "1.8 MB"
            ),
            Scan(
                title: "First Aid Certificate",
                type: "Certificate",
                uploadedAt: Date().addingTimeInterval(-259200),
                status: .flagged,
                reviewer: "Manager",
                fileSize: "3.1 MB",
                note: "Expiry date unclear"
            ),
            Scan(
                title: "Health & Safety Policy",
                type: "Policy",
                uploadedAt: Date().addingTimeInterval(-345600),
                status: .reviewed,
                reviewer: "Admin",
                fileSize: "567 KB"
            )
        ]
    }

    private func countForFilter(_ filter: String) -> Int {
        switch filter {
        case "Pending":
            return scans.filter { $0.status == .pending }.count
        case "Reviewed":
            return scans.filter { $0.status == .reviewed }.count
        case "Flagged":
            return scans.filter { $0.status == .flagged }.count
        default:
            return scans.count
        }
    }
}

// MARK: - Components
struct FilterTab: View {
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

struct ScanCard: View {
    let scan: Scan

    var statusColor: Color {
        switch scan.status {
        case .pending: return .warning
        case .reviewed: return .success
        case .flagged: return .danger
        }
    }

    var statusIcon: String {
        switch scan.status {
        case .pending: return "clock.fill"
        case .reviewed: return "checkmark.circle.fill"
        case .flagged: return "flag.fill"
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                // Document icon
                Image(systemName: "doc.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.primary)
                    .frame(width: 44, height: 44)
                    .background(Color.primaryLightest)
                    .cornerRadius(8)

                VStack(alignment: .leading, spacing: 4) {
                    Text(scan.title)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Color.gray900)

                    HStack(spacing: 8) {
                        Label(scan.type, systemImage: "folder")
                            .font(.system(size: 13))
                            .foregroundColor(Color.gray600)

                        Text("•")
                            .foregroundColor(Color.gray400)

                        Text(scan.uploadedAt.formatted(.relative(presentation: .numeric)))
                            .font(.system(size: 13))
                            .foregroundColor(Color.gray600)

                        Text("•")
                            .foregroundColor(Color.gray400)

                        Text(scan.fileSize)
                            .font(.system(size: 13))
                            .foregroundColor(Color.gray600)
                    }
                }

                Spacer()

                // Status badge
                VStack(spacing: 2) {
                    Image(systemName: statusIcon)
                        .font(.system(size: 20))
                        .foregroundColor(statusColor)

                    Text(scan.status.rawValue.capitalized)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(statusColor)
                }
            }
            .padding(16)

            if scan.status == .reviewed, let reviewer = scan.reviewer {
                HStack {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.success)

                    Text("Reviewed by \(reviewer)")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray600)

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }

            if scan.status == .flagged, let note = scan.note {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 12))
                        .foregroundColor(.warning)

                    Text(note)
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray600)

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }

            // Actions
            HStack(spacing: 12) {
                Button(action: {}) {
                    Label("View", systemImage: "eye")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.primary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color.primaryLightest)
                .cornerRadius(8)

                Button(action: {}) {
                    Label("Download", systemImage: "arrow.down.circle")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color.gray700)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(Color.gray100)
                .cornerRadius(8)
            }
            .padding(16)
            .padding(.top, -8)
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

struct EmptyScansView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 64))
                .foregroundColor(Color.gray300)

            Text("No documents found")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(Color.gray700)

            Text("Upload your first document to get started")
                .font(.system(size: 14))
                .foregroundColor(Color.gray500)

            Button(action: {}) {
                Label("Upload Document", systemImage: "plus.circle.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(LinearGradient(
                        colors: [Color.primary, Color.primaryDark],
                        startPoint: .leading,
                        endPoint: .trailing
                    ))
                    .cornerRadius(8)
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.vertical, 60)
    }
}

// MARK: - Model
struct Scan: Identifiable {
    enum Status: String {
        case pending, reviewed, flagged
    }

    let id = UUID()
    let title: String
    let type: String
    let uploadedAt: Date
    let status: Status
    var reviewer: String? = nil
    let fileSize: String
    var note: String? = nil
}