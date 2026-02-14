# Utiliza SOS

## Overview

Utiliza SOS is a mobile application for tow truck drivers (motoristas de guincho) built with React Native/Expo and an Express backend. The app enables drivers to:

- Log in with CNPJ/CPF credentials
- View and manage service calls (chamados)
- Perform vehicle inspections with photo capture
- Track service progress through a timeline (check-in → check-out flow)
- Capture digital signatures for check-in/check-out
- Use geolocation for real-time tracking

The app is primarily designed for mobile (iOS/Android) with web support, and follows a Brazilian Portuguese UI/UX pattern.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Mobile App)
- **Framework**: React Native with Expo SDK 54, using the new architecture (`newArchEnabled: true`)
- **Router**: Expo Router (file-based routing) with typed routes. Screens are defined in `app/` directory:
  - `index.tsx` — Login screen (multi-step: CNPJ/CPF → password → driver details)
  - `dashboard.tsx` — Main dashboard showing call history and driver profile
  - `active-call.tsx` — Active service call with timeline, photo inspection, and form
  - `camera.tsx` — Photo capture screen for vehicle inspections
  - `signature.tsx` — Digital signature capture using SVG paths and PanResponder
- **State Management**: React Context API for auth (`AuthContext`) and calls data (`CallsContext`), with `@tanstack/react-query` available for server-state management
- **Persistence**: `@react-native-async-storage/async-storage` for local storage of driver session and call records
- **Animations**: `react-native-reanimated` for transitions and micro-interactions
- **UI Components**: Custom component library in `components/` including `AppButton`, `AppTextField`, `AppDropdown`, `AppDialog`, `BottomNav`, and `KeyboardAwareScrollViewCompat`
- **Typography**: Google Fonts — Be Vietnam Pro (Regular, Medium, SemiBold, Bold)
- **Design System**: Defined in `constants/colors.ts` with a green primary palette (#007E5E), orange secondary (#FFA300), and red accent (#BA202A)
- **Haptics**: Used throughout via `expo-haptics` for tactile feedback

### Backend (Express Server)
- **Framework**: Express 5 running on Node.js, defined in `server/index.ts`
- **Routes**: Registered in `server/routes.ts` — currently minimal, prefixed with `/api`
- **Storage**: `server/storage.ts` provides a `MemStorage` class (in-memory) implementing `IStorage` interface with basic user CRUD. This is a placeholder — intended to be replaced with database-backed storage
- **CORS**: Configured to allow Replit domains and localhost origins for Expo web development
- **Static serving**: In production, serves a landing page from `server/templates/landing-page.html`
- **Build**: Server builds via esbuild (`server:build` script), outputs to `server_dist/`

### Database Schema
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` — currently has a `users` table with `id` (UUID), `username`, and `password`
- **Validation**: Uses `drizzle-zod` for schema-to-Zod type generation
- **Config**: `drizzle.config.ts` reads `DATABASE_URL` environment variable
- **Migrations**: Output to `./migrations` directory, pushed via `db:push` script

### Build & Development
- **Dev workflow**: Two processes — `expo:dev` for the mobile app and `server:dev` for the Express backend
- **Production build**: `expo:static:build` runs a custom build script (`scripts/build.js`) that starts Metro and bundles the web version
- **Path aliases**: `@/*` maps to project root, `@shared/*` maps to `./shared/*`

### Key Design Decisions
1. **Local-first data model**: Call records and auth state are stored in AsyncStorage rather than requiring constant server connectivity — important for tow truck drivers who may have spotty network coverage
2. **Context over Redux**: Simple React Context for state management keeps the codebase lightweight and avoids over-engineering for a focused single-user app
3. **Shared schema**: The `shared/` directory allows type sharing between frontend and backend
4. **In-memory storage fallback**: The server uses `MemStorage` by default, making it easy to develop without a database, but the Drizzle schema is ready for PostgreSQL when provisioned

## External Dependencies

- **Database**: PostgreSQL via Drizzle ORM (requires `DATABASE_URL` environment variable)
- **Expo Services**: Expo SDK for camera, image picker, location, haptics, fonts, and splash screen
- **Google Fonts**: Be Vietnam Pro font family via `@expo-google-fonts/be-vietnam-pro`
- **React Query**: `@tanstack/react-query` for server-state caching (infrastructure in place via `lib/query-client.ts`)
- **Image Handling**: `expo-image` for optimized image display, `expo-image-picker` for camera/gallery access
- **Location**: `expo-location` for geolocation services
- **SVG**: `react-native-svg` for digital signature rendering
- **Proxy**: `http-proxy-middleware` for development proxy setup between Expo and Express