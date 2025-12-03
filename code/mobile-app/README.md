# Scrollio Mobile App

React Native + Expo mobile application for Scrollio micro-learning platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

## 📁 Project Structure

```
mobile-app/
├── App.tsx                 # Main application entry point
├── index.ts               # Expo entry point
├── src/
│   ├── components/        # Reusable components
│   ├── features/          # Feature-based modules
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── store/             # Redux store
│   ├── theme/             # Design system
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── config/            # Configuration
├── assets/                # Static assets
└── __tests__/            # Tests
```

## 🛠️ Tech Stack

- **React Native** 0.81.5
- **Expo** ~54.0.25
- **TypeScript** ~5.9.2
- **Redux Toolkit** ^2.6.0
- **Supabase Client** ^2.49.4
- **AWS SDK** ^3.764.1

## 📚 Documentation

Full documentation available in `/brain/` directory:
- [CLAUDE.md](../../brain/CLAUDE.md) - AI context
- [Quick Start](../../brain/00-core/QUICK_START.md) - Setup guide
- [Tech Stack](../../brain/00-core/TECH_STACK.md) - Technology details
- [Coding Standards](../../.cursorrules) - Code conventions

## 🎯 Available Scripts

```bash
npm start           # Start Expo dev server
npm run ios         # Run on iOS
npm run android     # Run on Android
npm run web         # Run on web
npm test            # Run tests
npm run lint        # Run ESLint
npm run type-check  # TypeScript check
```

## 🔧 Configuration

1. Copy `.env.example` to `.env`
2. Fill in your Supabase and AWS credentials
3. Run `npm install --legacy-peer-deps`
4. Run `npm start`

## 📖 Learning Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Supabase Docs](https://supabase.com/docs)

## 🤝 Contributing

Follow coding standards in `/.cursorrules` and update documentation when making changes.
