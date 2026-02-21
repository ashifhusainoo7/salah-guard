# Salah Guard - Privacy Policy

**Effective Date:** [INSERT DATE]
**Last Updated:** [INSERT DATE]

## 1. Introduction

Salah Guard ("we," "our," or "the app") is a prayer-time Do Not Disturb management application. This privacy policy explains what data we collect, how we use it, and your rights regarding your data.

## 2. Data We Collect

### Data Stored Locally on Your Device
- **Prayer schedule preferences:** Times, durations, and active days for each prayer
- **DND session history:** Records of when Do Not Disturb was enabled/disabled
- **App settings:** Theme preference, notification preferences
- **Device identifier:** A randomly generated anonymous identifier for API authentication

### Data Transmitted to Our Server (if self-hosted backend is used)
- Prayer schedule configurations
- DND session logs (start time, end time, duration, status)
- App settings preferences
- Anonymous device identifier (not linked to personal identity)

### Data We Do NOT Collect
- Personal information (name, email, phone number)
- Location data
- Contact information
- Photos, media, or files
- Call logs or SMS data
- Browsing history
- Financial information

## 3. How We Use Your Data

- To schedule and manage Do Not Disturb periods during prayer times
- To display your DND session history
- To sync your settings across app sessions
- To authenticate your device with the backend API

## 4. Data Storage and Security

- Sensitive data (authentication tokens) is stored in hardware-backed secure storage (Android Keystore)
- Non-sensitive preferences are stored in encrypted local storage (MMKV)
- API communications use HTTPS with certificate pinning
- Backend API uses JWT authentication with token rotation
- Database stores only hashed tokens, never plain text

## 5. Data Sharing

We do **not** share, sell, or transfer your data to any third parties.

## 6. Data Retention

- Local data is retained on your device until you uninstall the app or clear app data
- Server-side data (if using hosted backend) is retained indefinitely unless you request deletion

## 7. Your Rights

You have the right to:
- **Access** your data through the app's History and Settings screens
- **Delete** your data by uninstalling the app or clearing app data
- **Request deletion** of server-side data by contacting us

## 8. Third-Party Services

The app may use the following third-party services:
- **Sentry** (crash reporting): Anonymous crash reports to improve app stability. No personal data is included in crash reports.

## 9. Children's Privacy

This app does not knowingly collect data from children under 13. The app is suitable for all ages.

## 10. Changes to This Policy

We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.

## 11. Contact Us

If you have questions about this privacy policy, please contact us at:
- Email: [INSERT EMAIL]
- Website: [INSERT WEBSITE]

---

## App Privacy "Nutrition Label" (for App Store)

| Category | Data Type | Usage |
|----------|-----------|-------|
| Data Not Linked to You | Prayer schedule preferences | App Functionality |
| Data Not Linked to You | DND session history | App Functionality |
| Data Not Linked to You | Device identifier (anonymous) | App Functionality |
| Data Not Used to Track You | Crash logs (Sentry) | Analytics |

**Data Used to Track You:** None
**Data Linked to You:** None
