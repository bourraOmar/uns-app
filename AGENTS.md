This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Safe Area & Edge-to-Edge Navigation (CRITICAL — NEVER REVERT)

- **NEVER import `SafeAreaView` from `'react-native'`**: It does not work on Android and leaves headers hidden under the system status bar (time/battery).
- **ALWAYS import `SafeAreaView` from `'react-native-safe-area-context'`**:
  - For tab screens (`app/(tabs)/*`): Use `<SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>` (the bottom is handled by the floating navigation bar).
  - For non-tab screens: Use `<SafeAreaView style={...} edges={['top', 'bottom', 'left', 'right']}>`.
- **Root Provider**: `app/_layout.tsx` MUST wrap the entire application in `<SafeAreaProvider>`.
- **Floating Bottom Bar Positioning**: The floating tab bar in `app/(tabs)/_layout.tsx` MUST use `useSafeAreaInsets()`:
  `bottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12) + (Platform.OS === 'android' ? 6 : 4)`.
  This guarantees it stays safely above Android's 48dp 3-button navigation bar (`< O []`) and gesture pills on all devices.
- **Scroll Content Clearance**: Tab scroll views must maintain `paddingBottom: 160` (or higher) so the final items are never obstructed by the floating navigation bar.
