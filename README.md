# React Native Map App

A React Native mobile application built with Expo that allows users to interact with maps, place markers at their current location, and manage those markers.

## Features

🗺️ **Interactive Map**
- Full-screen map view using react-native-maps
- Automatic location detection and centering
- User location indicator (blue dot)

📍 **Marker Management**
- Place markers at your current location with a button press
- Remove the last placed marker with confirmation dialog
- Remove individual markers by tapping them
- Display precise latitude and longitude coordinates

🎯 **User Experience**
- Clean, intuitive interface
- Confirmation dialogs for destructive actions
- Error handling for location permissions
- Responsive button layout

## Technology Stack

- **React Native** with Expo SDK 54
- **react-native-maps** for map functionality
- **expo-location** for location services
- **TypeScript** for type safety

## Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/saiwaiyanphyo/DES-427-Labs.git
   cd DES-427-Labs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate native configuration:
   ```bash
   npx expo prebuild
   ```

4. Start the development server:
   ```bash
   npx expo start
   ```

5. Run on your device:
   - **iOS**: Scan QR code with Camera app
   - **Android**: Scan QR code with Expo Go app
   - **Simulator**: Press `i` for iOS or `a` for Android

## Usage

1. **Grant Permissions**: Allow location access when prompted
2. **Add Markers**: Press the blue "Add Marker Here" button to place a marker at your current location
3. **Remove Last Marker**: Press the red "Remove Last Marker" button to remove the most recently added marker
4. **Remove Specific Marker**: Tap any marker to view its coordinates and get removal options

## Project Structure

```
my-map/
├── App.tsx           # Main application component
├── app.json          # Expo configuration with permissions
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── assets/           # App icons and splash screens
```

## Permissions Required

- **Location Services**: For getting current position and placing markers
- **iOS**: Location When In Use permission
- **Android**: ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION

## Development Notes

- Uses Expo SDK 54 with new architecture support
- Requires `expo prebuild` for react-native-maps native configuration
- Includes comprehensive error handling and user feedback
- Responsive design with proper button spacing

## License

This project is part of DES-427 coursework.