# PaceForge 🏃‍♂️

**A beautiful, completely free running progress tracker** built with React Native & Expo.

PaceForge helps runners of all levels track their runs, monitor progress, stay motivated, and reach their goals — with **no paywalls, no subscriptions**, ever. Just clean design, accurate GPS tracking, and powerful insights.

## ✨ Core Features (In Progress)

- Real-time GPS run tracking (outdoor + treadmill)
- Interactive dashboard with streaks, personal bests & progress charts
- Detailed run history with maps, splits, and elevation
- Training plans & guided workouts
- Achievements, challenges, and shareable run summaries
- Dark/light mode with premium, consistent UI
- Offline support + seamless Firebase sync
- Future: Lightweight social (kudos & challenges), shoe tracker, Apple Health / Google Fit

**Goal**: Become the best *completely free* running app on the Play Store and App Store.

## 🛠 Tech Stack

- **Frontend**: React Native + Expo (SDK 54+)
- **Language**: TypeScript
- **UI Library**: gluestack-ui + NativeWind (Tailwind CSS) – for beautiful, consistent, accessible components
- **State Management**: Zustand
- **Navigation**: Expo Router (file-based)
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Messaging)
- **Maps & Location**: `react-native-maps` + `expo-location` + `expo-task-manager`
- **Animations**: Reanimated + @legendapp/motion
- **Build & Deployment**: Expo EAS

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or v22 LTS)
- Android Studio (for emulator) or Xcode (for iOS)
- Expo Go app (for quick testing) or a development build

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/paceforge.git
cd paceforge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Expo Dev Client (for development builds)
```bash
npx expo install expo-dev-client
```

### 4. Environment Setup
```bash
cp .env.example .env
```

### 5. Firebase Configuration
1. Go to Firebase Console and create a new project named PaceForge.
2. Enable Authentication, Firestore Database, Storage, and Cloud Messaging.
3. Download:
   - google-services.json → place in project root (Android)
   - GoogleService-Info.plist → place in project root (iOS)

4. Update app.json with your bundle identifiers if needed.

### 6. Run the App
```bash
npx expo start
```
Then:

- Press a → Android
- Press i → iOS
- Or scan QR code with Expo Go

**Clean cache**: npx expo start -c

### 📁 Project Structure
```bash
paceforge/
├── app/                    # Expo Router screens & layouts
│   ├── (tabs)/             # Dashboard, History, Profile tabs
│   ├── run/                # Live tracking screen (planned)
│   └── ...
├── components/             # Reusable gluestack-ui components
├── constants/              # Colors, themes, routes
├── hooks/                  # Custom hooks (useRunTracking, etc.)
├── scripts/                # Build scripts (reset-project.js)
├── assets/                 # Icons, images, fonts
├── app.json
├── tsconfig.json
└── README.md
```
*Note: `firebase/`, `store/`, `types/`, and `utils/` folders will be added in future phases as features are implemented.*

### 🎨 Design Philosophy
- Clean, modern, motivational aesthetic
- Excellent typography and generous spacing
- Smooth animations with Reanimated and @legendapp/motion
- Full dark mode support
- Consistent UI using gluestack-ui + NativeWind for premium, accessible components with automatic theme switching

### 🤝 Contributing
We welcome contributors! Whether you're fixing bugs, improving UI, adding training plans, or enhancing tracking accuracy.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

### 📋 Development Roadmap
**Phase 1 (MVP)**: GPS tracking, dashboard, run history

**Phase 2**: Progress charts, streaks, achievements, training plans

**Phase 3**: Challenges, sharing, shoe tracker

**Phase 4**: Polish, App Store & Play Store launch, optional non-intrusive ads

### 📄 License

This project is completely free. Feel free to use, learn from, and contribute to it.