# CheckLoop iOS App - Setup and Usage Instructions

## Overview
CheckLoop iOS is a native iPhone application that provides staff members with mobile access to their training, compliance, and workplace management tools. The app is built with SwiftUI and optimized for iPhone displays.

## Features

### Core Functionality
- **Secure Login**: Email/password authentication with remember me option
- **Staff Dashboard**: Real-time compliance overview and activity feed
- **Training Management**: Upload certificates, track expiry dates
- **Quiz System**: Weekly knowledge checks with progress tracking
- **Holiday Management**: Request time off, view balance
- **Document Scanning**: Upload and manage training certificates
- **Achievements**: Gamified progress tracking

### Excluded Features
- Meetings functionality (as requested)
- Admin portal access (staff-only features)

## System Requirements

- **iOS Version**: 16.0 or later
- **Device**: iPhone (optimized for iPhone displays)
- **Xcode**: Version 15.0 or later
- **macOS**: Ventura (13.0) or later for development

## Installation Guide

### Step 1: Open the Project in Xcode

1. Navigate to the `CheckLoopApp` folder
2. Double-click `CheckLoopApp.xcodeproj` to open in Xcode
3. Wait for Xcode to index the project files

### Step 2: Configure Signing & Capabilities

1. Select the project in the navigator
2. Select the `CheckLoopApp` target
3. Go to "Signing & Capabilities" tab
4. Enable "Automatically manage signing"
5. Select your Apple Developer Team
6. Update Bundle Identifier if needed (e.g., `com.yourcompany.checkloop`)

### Step 3: Configure API Endpoints

1. Open `NetworkManager.swift`
2. Update the `baseURL` property with your actual API endpoint:
```swift
private let baseURL = "https://your-api-domain.com/v1"
```

### Step 4: Build and Run

1. Select an iPhone simulator or connected device
2. Press `Cmd + R` or click the Play button
3. The app will build and launch

## App Structure

```
CheckLoopApp/
├── CheckLoopApp.swift          # Main app entry point
├── ContentView.swift           # Root navigation controller
├── Views/
│   ├── LoginView.swift         # Authentication screen
│   ├── StaffDashboardView.swift # Main dashboard
│   ├── TrainingView.swift      # Training management
│   ├── QuizView.swift          # Quiz functionality
│   ├── HolidaysView.swift      # Holiday requests
│   ├── ScansView.swift         # Document management
│   └── AchievementsView.swift  # Progress tracking
├── Services/
│   ├── AuthenticationManager.swift # Auth logic
│   └── NetworkManager.swift    # API communication
├── Models/
│   └── UserModel.swift         # Data models
└── Assets.xcassets/            # Images and colors
```

## Usage Instructions

### For End Users

#### Logging In
1. Launch the app
2. Enter your email and password
3. Toggle "Remember me" to save credentials
4. Tap "Sign In"

#### Dashboard Navigation
- Use the tab bar at the bottom for main sections
- Pull down to refresh data
- Tap cards for detailed views

#### Training Management
1. Navigate to Training tab
2. View compliance status at top
3. Filter by status (Valid/Expiring/Expired)
4. Tap "+" to upload new certificate
5. Take photo or select from library

#### Taking Quizzes
1. Navigate to Quiz tab
2. Complete weekly quiz when due
3. Review practice quizzes
4. Track progress and scores

#### Holiday Requests
1. Navigate to Holidays tab
2. View remaining balance
3. Tap "New Request"
4. Select dates and add reason
5. Submit for approval

### For Developers

#### Adding New Features
1. Create new SwiftUI View in `Views/` folder
2. Add navigation in `ContentView.swift`
3. Update tab bar if needed
4. Implement API methods in `NetworkManager.swift`

#### Customizing Colors
Edit color definitions in `CheckLoopApp.swift`:
```swift
extension Color {
    static let primary = Color(red: 0.043, green: 0.31, blue: 0.702)
    // Add or modify colors here
}
```

#### API Integration
Update mock implementations with real API calls:
```swift
// In AuthenticationManager.swift
func signIn(email: String, password: String) async throws {
    // Replace mock with actual API call
    let response = try await NetworkManager.shared.signIn(
        email: email,
        password: password
    )
    // Handle response...
}
```

## Testing

### Running on Simulator
1. Select iPhone 15 Pro simulator
2. Build and run (`Cmd + R`)
3. Use Device > Rotate for orientation testing
4. Use Device > Shake for testing gestures

### Running on Physical Device
1. Connect iPhone via USB
2. Trust the computer on your iPhone
3. Select your device in Xcode
4. Build and run

### Test Credentials (Demo Mode)
- Email: `test@checkloop.com`
- Password: `password123`

## Troubleshooting

### Common Issues

#### Build Errors
- Clean build folder: `Cmd + Shift + K`
- Delete derived data: `~/Library/Developer/Xcode/DerivedData`
- Restart Xcode

#### Signing Issues
- Ensure valid Apple Developer account
- Check provisioning profiles
- Update Bundle ID to unique value

#### API Connection Issues
- Verify `baseURL` is correct
- Check network permissions in Info.plist
- Test API endpoints separately

## Security Considerations

1. **Token Storage**: Currently uses UserDefaults (demo). Implement Keychain for production:
```swift
// Use KeychainAccess library or native Keychain API
KeychainWrapper.standard.set(token, forKey: "accessToken")
```

2. **Certificate Pinning**: Add for production API calls
3. **Biometric Authentication**: Add Face ID/Touch ID support

## Performance Optimization

1. **Image Caching**: Implement SDWebImage or similar
2. **Data Persistence**: Add Core Data for offline support
3. **Background Refresh**: Implement for notifications

## Deployment

### TestFlight Beta Testing
1. Archive the app: Product > Archive
2. Upload to App Store Connect
3. Add external testers
4. Submit for review

### App Store Release
1. Prepare screenshots for all device sizes
2. Write app description and keywords
3. Submit for App Store review
4. Monitor review status

## Support and Maintenance

### Updating Dependencies
```bash
# If using Swift Package Manager
File > Packages > Update to Latest Package Versions
```

### Monitoring Crashes
- Integrate Crashlytics or similar
- Monitor App Store Connect analytics
- Implement logging system

### User Feedback
- Add in-app feedback mechanism
- Monitor App Store reviews
- Implement analytics tracking

## Additional Resources

- [SwiftUI Documentation](https://developer.apple.com/xcode/swiftui/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## License
Copyright © CheckLoop. All rights reserved.

## Contact
For technical support or questions about the app:
- Email: support@checkloop.com
- Documentation: docs.checkloop.com/ios

---

**Note**: This is a development version. Ensure all mock data and test endpoints are replaced with production values before deployment.