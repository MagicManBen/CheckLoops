import SwiftUI

struct HolidaysView: View {
    @State private var holidayBalance = HolidayBalance(total: 28, used: 3, pending: 2, approved: 0)
    @State private var requests: [HolidayRequest] = []
    @State private var showingNewRequest = false
    @State private var selectedYear = Calendar.current.component(.year, from: Date())

    var availableDays: Int {
        holidayBalance.total - holidayBalance.used - holidayBalance.pending
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Holiday Balance Card
                    HolidayBalanceCard(
                        balance: holidayBalance,
                        available: availableDays
                    )
                    .padding(.horizontal)

                    // Calendar View
                    HolidayCalendarView(requests: requests)
                        .padding(.horizontal)

                    // Request List
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("My Requests")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(Color.gray900)

                            Spacer()

                            Button("New Request") {
                                showingNewRequest = true
                            }
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.primary)
                        }

                        if requests.isEmpty {
                            EmptyRequestsView()
                        } else {
                            ForEach(requests) { request in
                                HolidayRequestCard(request: request)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color.gray50)
            .navigationTitle("My Holidays")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $showingNewRequest) {
                NewHolidayRequestView { newRequest in
                    requests.insert(newRequest, at: 0)
                    holidayBalance.pending += newRequest.days
                }
            }
            .onAppear {
                loadHolidayData()
            }
        }
    }

    private func loadHolidayData() {
        // Sample data
        requests = [
            HolidayRequest(
                startDate: Date().addingTimeInterval(86400 * 30),
                endDate: Date().addingTimeInterval(86400 * 32),
                days: 3,
                reason: "Family vacation",
                status: .pending,
                requestedAt: Date()
            ),
            HolidayRequest(
                startDate: Date().addingTimeInterval(86400 * 60),
                endDate: Date().addingTimeInterval(86400 * 62),
                days: 3,
                reason: "Long weekend",
                status: .approved,
                requestedAt: Date().addingTimeInterval(-86400 * 5),
                approvedAt: Date().addingTimeInterval(-86400 * 3),
                approvedBy: "Manager"
            ),
            HolidayRequest(
                startDate: Date().addingTimeInterval(-86400 * 10),
                endDate: Date().addingTimeInterval(-86400 * 8),
                days: 3,
                reason: "Personal time",
                status: .taken,
                requestedAt: Date().addingTimeInterval(-86400 * 20),
                approvedAt: Date().addingTimeInterval(-86400 * 15),
                approvedBy: "Manager"
            )
        ]
    }
}

// MARK: - Components
struct HolidayBalanceCard: View {
    let balance: HolidayBalance
    let available: Int

    var usagePercentage: Double {
        Double(balance.used) / Double(balance.total)
    }

    var body: some View {
        VStack(spacing: 16) {
            // Title
            HStack {
                Text("Holiday Balance \(Calendar.current.component(.year, from: Date()))")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(Color.gray900)
                Spacer()
            }

            // Balance circles
            HStack(spacing: 20) {
                BalanceCircle(
                    value: available,
                    label: "Available",
                    color: .success,
                    isMain: true
                )

                BalanceCircle(
                    value: balance.used,
                    label: "Used",
                    color: .primary,
                    isMain: false
                )

                BalanceCircle(
                    value: balance.pending,
                    label: "Pending",
                    color: .warning,
                    isMain: false
                )

                BalanceCircle(
                    value: balance.total,
                    label: "Total",
                    color: .gray500,
                    isMain: false
                )
            }

            // Usage bar
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Usage")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(Color.gray700)
                    Spacer()
                    Text("\(Int(usagePercentage * 100))%")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color.gray700)
                }

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray200)
                            .frame(height: 8)

                        RoundedRectangle(cornerRadius: 4)
                            .fill(LinearGradient(
                                colors: [Color.primary, Color.accent],
                                startPoint: .leading,
                                endPoint: .trailing
                            ))
                            .frame(width: geometry.size.width * usagePercentage, height: 8)
                    }
                }
                .frame(height: 8)
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
}

struct BalanceCircle: View {
    let value: Int
    let label: String
    let color: Color
    let isMain: Bool

    var body: some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.system(size: isMain ? 32 : 24, weight: .bold))
                .foregroundColor(color)

            Text(label)
                .font(.system(size: 11))
                .foregroundColor(Color.gray600)
        }
        .frame(maxWidth: .infinity)
    }
}

struct HolidayCalendarView: View {
    let requests: [HolidayRequest]
    @State private var selectedDate = Date()

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Calendar")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(Color.gray900)

            // Simple month view placeholder
            VStack(spacing: 8) {
                // Month header
                HStack {
                    Button(action: {}) {
                        Image(systemName: "chevron.left")
                            .foregroundColor(Color.gray600)
                    }

                    Spacer()

                    Text(selectedDate.formatted(.dateTime.month(.wide).year()))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(Color.gray900)

                    Spacer()

                    Button(action: {}) {
                        Image(systemName: "chevron.right")
                            .foregroundColor(Color.gray600)
                    }
                }

                // Weekday headers
                HStack {
                    ForEach(["S", "M", "T", "W", "T", "F", "S"], id: \.self) { day in
                        Text(day)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color.gray600)
                            .frame(maxWidth: .infinity)
                    }
                }

                // Calendar grid (simplified)
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 8) {
                    ForEach(1...30, id: \.self) { day in
                        Text("\(day)")
                            .font(.system(size: 14))
                            .foregroundColor(hasHolidayOn(day: day) ? .white : Color.gray700)
                            .frame(width: 32, height: 32)
                            .background(hasHolidayOn(day: day) ? Color.primary : Color.clear)
                            .clipShape(Circle())
                    }
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(12)
        }
    }

    private func hasHolidayOn(day: Int) -> Bool {
        // Simplified - would check actual holiday dates
        return [15, 16, 17].contains(day)
    }
}

struct HolidayRequestCard: View {
    let request: HolidayRequest

    var statusColor: Color {
        switch request.status {
        case .pending: return .warning
        case .approved: return .success
        case .rejected: return .danger
        case .taken: return .primary
        }
    }

    var statusText: String {
        switch request.status {
        case .pending: return "PENDING"
        case .approved: return "APPROVED"
        case .rejected: return "REJECTED"
        case .taken: return "TAKEN"
        }
    }

    var body: some View {
        HStack {
            // Status indicator
            Rectangle()
                .fill(statusColor)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("\(request.startDate.formatted(date: .abbreviated, time: .omitted)) - \(request.endDate.formatted(date: .abbreviated, time: .omitted))")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(Color.gray900)

                    Spacer()

                    Text(statusText)
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(statusColor)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(statusColor.opacity(0.1))
                        .cornerRadius(4)
                }

                HStack {
                    Label("\(request.days) days", systemImage: "calendar")
                        .font(.system(size: 13))
                        .foregroundColor(Color.gray600)

                    if !request.reason.isEmpty {
                        Text("•")
                            .foregroundColor(Color.gray400)

                        Text(request.reason)
                            .font(.system(size: 13))
                            .foregroundColor(Color.gray600)
                            .lineLimit(1)
                    }
                }

                if let approvedBy = request.approvedBy, request.status == .approved {
                    Text("Approved by \(approvedBy)")
                        .font(.system(size: 12))
                        .foregroundColor(Color.gray500)
                }
            }
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 4, x: 0, y: 2)
    }
}

struct EmptyRequestsView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 48))
                .foregroundColor(Color.gray300)

            Text("No holiday requests yet")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(Color.gray700)

            Text("Tap 'New Request' to request time off")
                .font(.system(size: 14))
                .foregroundColor(Color.gray500)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .background(Color.white)
        .cornerRadius(12)
    }
}

// MARK: - New Request View
struct NewHolidayRequestView: View {
    let onSave: (HolidayRequest) -> Void

    @Environment(\.dismiss) var dismiss
    @State private var startDate = Date()
    @State private var endDate = Date()
    @State private var reason = ""
    @State private var showingAlert = false

    var dayCount: Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: startDate, to: endDate)
        return max(1, (components.day ?? 0) + 1)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Dates") {
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                    DatePicker("End Date", selection: $endDate, in: startDate..., displayedComponents: .date)

                    HStack {
                        Text("Total Days")
                            .foregroundColor(Color.gray700)
                        Spacer()
                        Text("\(dayCount)")
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                    }
                }

                Section("Reason") {
                    TextField("Optional reason for leave", text: $reason)
                }

                Section {
                    Text("Your request will be sent to your manager for approval")
                        .font(.system(size: 13))
                        .foregroundColor(Color.gray600)
                }
            }
            .navigationTitle("New Holiday Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        let request = HolidayRequest(
                            startDate: startDate,
                            endDate: endDate,
                            days: dayCount,
                            reason: reason,
                            status: .pending,
                            requestedAt: Date()
                        )
                        onSave(request)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

// MARK: - Models
struct HolidayBalance {
    let total: Int
    var used: Int
    var pending: Int
    var approved: Int
}

struct HolidayRequest: Identifiable {
    let id = UUID()
    let startDate: Date
    let endDate: Date
    let days: Int
    let reason: String
    var status: RequestStatus
    let requestedAt: Date
    var approvedAt: Date? = nil
    var approvedBy: String? = nil

    enum RequestStatus {
        case pending, approved, rejected, taken
    }
}