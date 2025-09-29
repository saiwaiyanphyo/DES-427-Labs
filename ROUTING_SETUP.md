# Google Maps API Configuration

## Important: API Key Required for Routing

To use the routing features (driving/walking directions), you need to:

1. **Get a Google Maps API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Directions API" and "Roads API"
   - Create credentials (API Key)

2. **Add the API Key to your app**:
   - Open `App.tsx`
   - Find line with `apikey="YOUR_GOOGLE_MAPS_API_KEY"`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

```javascript
<MapViewDirections
  origin={routeOrigin}
  destination={routeDestination}
  apikey="AIzaSyD..." // Your actual API key here
  mode={travelMode}
  // ... rest of props
/>
```

## Alternative: Demo Mode (No API Key)

For testing without API key, the app will show:
- Route calculation errors (expected)
- All other features work normally
- Markers, callouts, and UI fully functional

## API Key Security

⚠️ **Important**: Never commit your API key to public repositories!

Consider using:
- Environment variables
- React Native Config
- Secure key storage solutions

## Cost Information

Google Maps API pricing:
- Directions API: $5 per 1,000 requests
- First 200 requests per month are free
- Perfect for development and small apps