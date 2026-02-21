# Salah Guard

A production-grade mobile application that automatically enables Do Not Disturb (DND) mode on Android during Islamic prayer times and disables it after a configurable duration (5-30 minutes).

## Architecture

```
+---------------------------+          +---------------------------+
|   React Native Mobile     |  HTTPS   |   .NET Core 8 API         |
|   (Android / iOS-ready)   |<-------->|   (Controller-based)      |
|                           |   JWT    |                           |
|  - TypeScript (strict)    |          |  - Entity Framework Core  |
|  - Zustand State Mgmt     |          |  - SQLite Database        |
|  - React Navigation v6    |          |  - JWT Auth + Refresh     |
|  - Native DND Module (Kt) |          |  - FluentValidation       |
|  - Local Notifications    |          |  - Serilog Logging        |
|  - MMKV + Keychain        |          |  - Rate Limiting          |
|  - Sentry Crash Reports   |          |  - Response Caching       |
+---------------------------+          +---------------------------+
       |                                           |
       v                                           v
+---------------------------+          +---------------------------+
|   Android Native Layer    |          |   Docker + Nginx          |
|   - DndModule.kt          |          |   - Multi-stage build     |
|   - DndPackage.kt         |          |   - HTTPS termination     |
|   - BootReceiver.kt       |          |   - Non-root container    |
+---------------------------+          +---------------------------+
```

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18.x | React Native development |
| npm | >= 9.x | Package management |
| Java JDK | 17 | Android build |
| Android SDK | API 34 (Android 14) | Target SDK |
| Android NDK | Latest | Native module compilation |
| .NET SDK | 8.0.x | API development |
| Docker | Latest | API deployment |
| Git | Latest | Version control |

## Project Structure

```
salah-guard/
├── salah-guard-api/           # .NET Core 8 Web API
│   ├── Controllers/           # API endpoints
│   ├── Models/                # Domain entities
│   ├── DTOs/                  # Data transfer objects
│   ├── Data/                  # EF Core DbContext + seeder
│   ├── Services/              # Business logic layer
│   ├── Auth/                  # JWT authentication
│   ├── Middleware/             # Exception, security, logging
│   ├── Validators/            # FluentValidation rules
│   ├── Mapping/               # AutoMapper profiles
│   ├── Migrations/            # EF Core migrations
│   ├── Tests/                 # xUnit test project
│   └── Dockerfile
├── salah-guard-mobile/        # React Native mobile app
│   ├── src/
│   │   ├── screens/           # 4 main screens
│   │   ├── components/        # Reusable UI components
│   │   ├── store/             # Zustand state management
│   │   ├── services/          # API client, alarm scheduler
│   │   ├── navigation/        # Bottom tab navigator
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Helpers (time, prayer, storage)
│   │   ├── hooks/             # Custom React hooks
│   │   └── i18n/              # Internationalization (EN + UR)
│   ├── android/               # Native Android code
│   └── __tests__/             # Jest test suites
├── .github/workflows/         # CI/CD pipelines
├── nginx/                     # Reverse proxy config
├── docker-compose.yml
├── PRIVACY_POLICY.md
└── README.md
```

## Quick Start

### 1. Backend API

```bash
cd salah-guard-api

# Restore dependencies
dotnet restore

# Set JWT secret (required)
export Jwt__Secret="YourSuperSecretKeyThatIsAtLeast32CharactersLong!"

# Run the API (development mode with Swagger)
dotnet run

# API will be available at:
# - http://localhost:5000
# - Swagger UI: http://localhost:5000/swagger
# - Health check: http://localhost:5000/health
```

### 2. Mobile App

```bash
cd salah-guard-mobile

# Install dependencies
npm install

# Create environment file
echo "API_BASE_URL=http://10.0.2.2:5000" > .env

# Start Metro bundler
npm start

# In a separate terminal, run on Android
npm run android
```

### 3. Docker Deployment

```bash
# Set required environment variables
export JWT_SECRET="YourProductionSecretKeyAtLeast32CharactersLong!"

# Build and start services
docker-compose up -d

# API available at https://your-domain (via nginx)
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register device, get JWT tokens |
| POST | /api/auth/refresh | No | Refresh access token |
| POST | /api/auth/logout | Yes | Revoke refresh tokens |
| GET | /api/prayers | Yes | Get all prayer schedules |
| GET | /api/prayers/:id | Yes | Get single prayer |
| POST | /api/prayers | Yes | Create prayer schedule |
| PUT | /api/prayers/:id | Yes | Update prayer schedule |
| DELETE | /api/prayers/:id | Yes | Delete prayer schedule |
| GET | /api/history | Yes | Paginated DND session history |
| POST | /api/history | Yes | Log DND session |
| DELETE | /api/history/:id | Yes | Delete history record |
| GET | /api/settings | Yes | Get user settings |
| PUT | /api/settings | Yes | Update settings |
| GET | /health | No | Health check |

All authenticated endpoints require: `Authorization: Bearer <access_token>`

Response envelope format:
```json
{
  "success": true,
  "data": {},
  "message": "",
  "errors": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Running Tests

### API Tests
```bash
cd salah-guard-api
dotnet test Tests/SalahGuardApi.Tests.csproj --verbosity normal --collect:"XPlat Code Coverage"
```

### Mobile Tests
```bash
cd salah-guard-mobile
npm test -- --coverage
```

## Android Release Build

### 1. Generate Production Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore salah-guard-release.keystore \
  -alias salah-guard -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASSWORD -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Salah Guard, O=Your Organization, L=City, C=Country"
```

### 2. Configure Signing

Create `salah-guard-mobile/android/keystore.properties` (gitignored):
```properties
SALAHGUARD_RELEASE_STORE_FILE=../salah-guard-release.keystore
SALAHGUARD_RELEASE_STORE_PASSWORD=YOUR_STORE_PASSWORD
SALAHGUARD_RELEASE_KEY_ALIAS=salah-guard
SALAHGUARD_RELEASE_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

### 3. Build Release APK
```bash
cd salah-guard-mobile/android
./gradlew assembleRelease
# APK at: app/build/outputs/apk/release/app-release.apk
```

## Environment Secrets (GitHub Actions)

| Secret | Description |
|--------|-------------|
| KEYSTORE_BASE64 | Base64-encoded release keystore |
| KEYSTORE_PASSWORD | Keystore password |
| KEY_ALIAS | Key alias (salah-guard) |
| KEY_PASSWORD | Key password |
| JWT_SECRET | JWT signing secret (min 32 chars) |
| API_BASE_URL | Production API URL |

## Google Play Store Submission Checklist

- [ ] Target SDK is 34 (Android 14)
- [ ] All permissions have user-facing rationale dialogs
- [ ] SCHEDULE_EXACT_ALARM usage declared in Play Console "App Content"
- [ ] ACCESS_NOTIFICATION_POLICY explained in onboarding screen
- [ ] Foreground service type declared as "specialUse" with explanation
- [ ] ProGuard/R8 rules tested with release build
- [ ] App functions correctly with battery optimization enabled
- [ ] Privacy Policy URL is live and accessible
- [ ] No unused permissions in AndroidManifest.xml
- [ ] Release APK is signed with production keystore
- [ ] App content rating questionnaire completed
- [ ] Screenshots and store listing prepared
- [ ] Data safety section filled out in Play Console
- [ ] App tested on Android 12, 13, and 14 devices

## Apple App Store Submission Checklist

- [ ] iOS Focus Mode helper screen implemented (iOS cannot control DND programmatically)
- [ ] NSUserNotificationsUsageDescription in Info.plist
- [ ] NSFaceIDUsageDescription in Info.plist
- [ ] Minimum iOS version set to 15.0
- [ ] Dynamic Type (accessibility font scaling) supported
- [ ] App Privacy "nutrition label" data checklist completed
- [ ] No private APIs used
- [ ] App reviewed against Apple Human Interface Guidelines

## Security Features

- JWT authentication with refresh token rotation (15min access / 7day refresh)
- Refresh tokens stored hashed (SHA256) in database
- SSL certificate pinning on mobile (react-native-ssl-pinning)
- Sensitive data in hardware-backed keystore (react-native-keychain)
- Rate limiting: 100 req/min general, 5 req/min auth endpoints
- Security headers: X-Content-Type-Options, X-Frame-Options, HSTS, CSP
- Root/jailbreak detection (react-native-jail-monkey)
- ProGuard obfuscation on release builds
- Non-root Docker container
- No hardcoded secrets (environment variables)

## License

[INSERT LICENSE]
