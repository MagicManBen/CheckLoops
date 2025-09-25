import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var email = ""
    @State private var password = ""
    @State private var rememberMe = false
    @State private var showingForgotPassword = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            ZStack {
                // Background gradient
                LinearGradient(
                    colors: [Color.primaryLightest, Color.white],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 0) {
                        // Logo and brand
                        VStack(spacing: 12) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(
                                        LinearGradient(
                                            colors: [Color.primary, Color.accent],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 60, height: 60)

                                Text("✓")
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(.white)
                            }

                            Text("CheckLoop")
                                .font(.system(size: 32, weight: .bold, design: .default))
                                .foregroundColor(Color.gray900)
                        }
                        .padding(.top, 60)
                        .padding(.bottom, 20)

                        // Login card
                        VStack(spacing: 24) {
                            // Header
                            VStack(spacing: 8) {
                                Text("Welcome Back")
                                    .font(.system(size: 28, weight: .bold))
                                    .foregroundColor(Color.gray900)

                                Text("Enter your credentials to access your account")
                                    .font(.system(size: 15))
                                    .foregroundColor(Color.gray600)
                                    .multilineTextAlignment(.center)
                            }

                            // Form fields
                            VStack(spacing: 16) {
                                // Email field
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Email Address")
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(Color.gray700)

                                    TextField("you@practice.com", text: $email)
                                        .textFieldStyle(CustomTextFieldStyle())
                                        .textContentType(.emailAddress)
                                        .autocapitalization(.none)
                                        .keyboardType(.emailAddress)
                                }

                                // Password field
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Password")
                                        .font(.system(size: 14, weight: .semibold))
                                        .foregroundColor(Color.gray700)

                                    SecureField("••••••••", text: $password)
                                        .textFieldStyle(CustomTextFieldStyle())
                                        .textContentType(.password)
                                }

                                // Remember me and Forgot password
                                HStack {
                                    Toggle(isOn: $rememberMe) {
                                        Text("Remember me")
                                            .font(.system(size: 14))
                                            .foregroundColor(Color.gray600)
                                    }
                                    .toggleStyle(CheckboxToggleStyle())

                                    Spacer()

                                    Button("Forgot Password?") {
                                        showingForgotPassword = true
                                    }
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(.primary)
                                }
                            }

                            // Sign in button
                            Button(action: signIn) {
                                ZStack {
                                    if isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    } else {
                                        Text("Sign In")
                                            .font(.system(size: 16, weight: .semibold))
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .foregroundColor(.white)
                                .background(
                                    LinearGradient(
                                        colors: [Color.primary, Color.primaryDark],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .cornerRadius(8)
                            }
                            .disabled(isLoading)

                            // Divider
                            HStack {
                                Rectangle()
                                    .fill(Color.gray300)
                                    .frame(height: 1)
                                Text("or")
                                    .font(.system(size: 14))
                                    .foregroundColor(Color.gray500)
                                    .padding(.horizontal, 16)
                                Rectangle()
                                    .fill(Color.gray300)
                                    .frame(height: 1)
                            }

                            // Admin login link
                            Button(action: {}) {
                                Text("Admin Login")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(Color.gray700)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 48)
                                    .background(Color.gray100)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color.gray300, lineWidth: 1)
                                    )
                                    .cornerRadius(8)
                            }

                            // SSL Badge
                            HStack {
                                Image(systemName: "lock.shield.fill")
                                    .foregroundColor(.success)
                                    .font(.system(size: 14))
                                Text("SSL Secured")
                                    .font(.system(size: 12))
                                    .foregroundColor(Color.gray500)
                            }
                        }
                        .padding(32)
                        .background(Color.white)
                        .cornerRadius(24)
                        .shadow(color: Color.black.opacity(0.1), radius: 20, x: 0, y: 10)
                        .padding(.horizontal, 20)
                        .padding(.bottom, 40)
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage)
            }
            .sheet(isPresented: $showingForgotPassword) {
                ForgotPasswordView()
            }
        }
    }

    private func signIn() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter both email and password"
            showingError = true
            return
        }

        isLoading = true

        Task {
            do {
                try await authManager.signIn(email: email, password: password)
                isLoading = false
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
                isLoading = false
            }
        }
    }
}

// MARK: - Custom Styles
struct CustomTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(12)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.gray300, lineWidth: 1)
            )
    }
}

struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 8) {
            Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                .foregroundColor(configuration.isOn ? .primary : Color.gray400)
                .font(.system(size: 20))
                .onTapGesture {
                    configuration.isOn.toggle()
                }
            configuration.label
        }
    }
}

// MARK: - Forgot Password View
struct ForgotPasswordView: View {
    @Environment(\.dismiss) var dismiss
    @State private var email = ""
    @State private var showingSuccess = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Text("Reset Password")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(Color.gray900)

                    Text("Enter your email address and we'll send you a link to reset your password")
                        .font(.system(size: 15))
                        .foregroundColor(Color.gray600)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 20)

                VStack(alignment: .leading, spacing: 8) {
                    Text("Email Address")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color.gray700)

                    TextField("you@practice.com", text: $email)
                        .textFieldStyle(CustomTextFieldStyle())
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                }

                Button(action: {
                    showingSuccess = true
                }) {
                    Text("Send Reset Link")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(
                            LinearGradient(
                                colors: [Color.primary, Color.primaryDark],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .cornerRadius(8)
                }

                Spacer()
            }
            .padding(.horizontal, 20)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Success", isPresented: $showingSuccess) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Password reset instructions have been sent to \(email)")
            }
        }
    }
}