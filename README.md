# Echo — Memory Tracking App

A cross-platform mobile app built with **React Native (Expo)** and **React Navigation**.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your phone (for testing), or an iOS Simulator / Android Emulator

### Install dependencies

```bash
cd echo
npm install
```

### Run the app

```bash
# Start Expo dev server
npx expo start

# Or run directly on a platform
npx expo start --android
npx expo start --ios
npx expo start --web
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

## Project Structure

```
echo/
├── App.js                    # Root entry point
├── babel.config.js           # Babel + Reanimated plugin
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── BottomTabBar.js   # Fixed floating bottom navigation
│   │   ├── CategoryPill.js   # Animated category filter pill
│   │   ├── DayAccordion.js   # Expandable day itinerary item
│   │   ├── EchoCard.js       # Individual memory card rendering
│   │   ├── FavoriteButton.js # Heart toggle with spring animation
│   │   ├── SearchBar.js      # Search input + filter button
│   │   ├── SegmentedTabs.js  # Tab control with animated state
│   │   ├── Toast.js          # Auto-hiding notification toast
│   │   └── VerticalEchoStack.js # Inverted stack deck with modulo infinite scroll
│   ├── data/                 # Mock data (swap for API later)
│   │   └── echoes.js         # Echoes + categories
│   ├── navigation/
│   │   └── AppNavigator.js   # Stack navigator with slide transitions
│   ├── screens/
│   │   ├── HomeScreen.js     # Home / Explore screen
│   │   ├── DetailScreen.js   # Destination detail screen
│   │   └── MemoryTimelineScreen.js # Timeline history screen
│   └── theme/                # Design tokens
│       ├── colors.js         # Color palette
│       ├── typography.js     # Font styles
│       ├── spacing.js        # Spacing & border radii
│       └── index.js          # Barrel export
```

## Screens

1. **Home / Explore** — Greeting, search, category pills, echoes card stack, bottom tab bar
2. **Destination Detail** — Hero image, bottom sheet, memory counts, expandable description, echoes card list
3. **Memory Timeline** — Header, segmented tabs, accordion memory plans, sticky "Save memory" button

## Animations

All animations use `react-native-reanimated` and respect the device's **Reduce Motion** accessibility setting:

- **Screen transitions** — Horizontal iOS-style slide (push/pop)
- **Heart button** — Spring "pulse" scale animation on toggle
- **Category pills** — Animated background color + scale on selection
- **Accordion items** — Smooth height transition + rotating chevron
- **Press feedback** — Subtle scale-down on touch for cards and buttons
- **Toast** — Slide-up fade-in, auto-dismiss after 1.6s

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.86 + Expo SDK 57 |
| Navigation | React Navigation 7 (Stack) |
| Animations | React Native Reanimated 4 |
| Icons | @expo/vector-icons (Ionicons, Feather) |
| Gradients | expo-linear-gradient |

## Swapping in a Real API

The `src/data/` files export plain arrays/objects. Replace them with API calls:

```javascript
// Before (mock)
import { destinations } from '../data/destinations';

// After (API)
const [destinations, setDestinations] = useState([]);
useEffect(() => {
  fetch('https://api.example.com/destinations')
    .then(r => r.json())
    .then(setDestinations);
}, []);
```

The data shape stays the same — just swap the source.
