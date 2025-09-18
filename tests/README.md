# CheckLoop Automated Testing

This directory contains automated Playwright tests for the CheckLoop application. The tests cover all aspects of the application, from authentication to staff and admin functionality.

## Test Structure

The tests are organized into the following categories:

- `auth/` - Tests for authentication functionality
- `navigation/` - Tests for navigation and routing
- `staff/` - Tests for staff area functionality
- `admin/` - Tests for admin dashboard and functionality
- `onboarding/` - Tests for user onboarding flows
- `visual/` - Visual regression tests

## Global Setup

The tests use a global setup mechanism to handle authentication before test runs. This is configured in the `global-setup.js` file and referenced in the Playwright configuration.

## Running Tests

### Prerequisites

- Node.js 14+ installed
- Dependencies installed: `npm install`

### Running All Tests

```bash
npx playwright test
```

### Running Specific Test Categories

```bash
# Run only authentication tests
npx playwright test tests/auth/

# Run only staff area tests
npx playwright test tests/staff/

# Run only admin tests
npx playwright test tests/admin/
```

### Running Tests in UI Mode

For interactive debugging and development:

```bash
npx playwright test --ui
```

### Running Tests With Different Browsers

By default, tests run in Chromium. To run in other browsers:

```bash
# Run in Firefox
npx playwright test --project=firefox

# Run in WebKit
npx playwright test --project=webkit
```

## Visual Regression Testing

The visual regression tests capture screenshots of various pages in the application for visual comparison. These screenshots are stored in the `test-results/visual-comparison` directory.

To perform visual regression testing against a baseline:

1. Run the visual tests to generate baseline screenshots:
   ```bash
   npx playwright test tests/visual/
   ```

2. Store the baseline screenshots in a safe location

3. Run the tests again after making changes to compare:
   ```bash
   npx playwright test tests/visual/
   ```

4. Compare the new screenshots with the baseline manually or using a comparison tool

## Authentication

Tests that require authentication use pre-configured storage states for staff and admin users. These states are created during the global setup and are available for all tests.

## Utils

Common utilities for tests are available in the `utils/test-helpers.js` file, including functions for checking authentication status, waiting for page loads, and taking screenshots for debugging.