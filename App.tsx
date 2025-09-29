import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Alert, Share, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker, Region, Callout, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';

interface MarkerData {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  address?: string;
  timestamp: number;
  category: 'current' | 'favorite' | 'restaurant' | 'photo' | 'custom';
}

interface RouteInfo {
  distance: number;
  duration: number;
  mode: 'DRIVING' | 'WALKING' | 'TRANSIT';
  coordinates: { latitude: number; longitude: number }[];
}

type TravelMode = 'DRIVING' | 'WALKING' | 'TRANSIT';

export default function App() {
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'current' | 'favorite' | 'restaurant' | 'photo' | 'custom'>('current');
  
  // Routing states
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeDestination, setRouteDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVING');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      // Update map region to user's location
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location');
    }
  };

  const addMarkerAtCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      
      // Get address from coordinates
      let address = 'Unknown location';
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          address = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`;
        }
      } catch (geoError) {
        console.log('Geocoding failed:', geoError);
      }
      
      const categoryTitles = {
        current: 'Current Location',
        favorite: 'Favorite Place',
        restaurant: 'Restaurant',
        photo: 'Photo Spot',
        custom: 'Custom Location'
      };
      
      const newMarker: MarkerData = {
        id: Date.now().toString(),
        coordinate: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        title: categoryTitles[selectedCategory],
        description: `Added on ${new Date().toLocaleString()}`,
        address: address,
        timestamp: Date.now(),
        category: selectedCategory,
      };
      
      setMarkers(prevMarkers => [...prevMarkers, newMarker]);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location to place marker');
    }
  };

  const onMarkerPress = (marker: MarkerData) => {
    Alert.alert(
      'Marker Options',
      `Latitude: ${marker.coordinate.latitude.toFixed(6)}\nLongitude: ${marker.coordinate.longitude.toFixed(6)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove Marker', 
          style: 'destructive',
          onPress: () => removeMarker(marker.id)
        },
        { text: 'OK' }
      ]
    );
  };

  const removeMarker = (markerId: string) => {
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== markerId));
  };

  const shareLocation = async (marker: MarkerData) => {
    try {
      await Share.share({
        message: `📍 ${marker.title}\n${marker.description}\n📍 ${marker.address}\n🗺️ https://maps.google.com/?q=${marker.coordinate.latitude},${marker.coordinate.longitude}`,
        title: `Share ${marker.title}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getMarkerColor = (category: string) => {
    const colors = {
      current: '#007AFF',
      favorite: '#FF3B30',
      restaurant: '#FF9500',
      photo: '#34C759',
      custom: '#AF52DE'
    };
    return colors[category as keyof typeof colors] || '#007AFF';
  };

  // Routing Functions
  const startRouting = () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please wait for location to be detected');
      return;
    }
    setIsRoutingMode(true);
    setRouteOrigin({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude
    });
    Alert.alert('Routing Mode', 'Tap any marker to get directions from your current location');
  };

  const stopRouting = () => {
    setIsRoutingMode(false);
    setRouteOrigin(null);
    setRouteDestination(null);
    setRouteInfo(null);
    setShowRouteDetails(false);
  };

  const handleMarkerRouting = (marker: MarkerData) => {
    if (isRoutingMode && routeOrigin) {
      setRouteDestination(marker.coordinate);
      setShowRouteDetails(true);
    } else {
      onMarkerPress(marker);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const getTravelModeColor = (mode: TravelMode): string => {
    const colors = {
      DRIVING: '#007AFF',
      WALKING: '#34C759',
      TRANSIT: '#FF9500'
    };
    return colors[mode];
  };

  const getTravelModeIcon = (mode: TravelMode): string => {
    const icons = {
      DRIVING: '🚗',
      WALKING: '🚶',
      TRANSIT: '🚌'
    };
    return icons[mode];
  };

  const removeLastMarker = () => {
    console.log('Remove button pressed, markers count:', markers.length);
    if (markers.length === 0) {
      Alert.alert('No Markers', 'There are no markers to remove');
      return;
    }
    
    Alert.alert(
      'Remove Last Marker',
      'Are you sure you want to remove the last marker?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            console.log('Removing last marker');
            setMarkers(prevMarkers => {
              const newMarkers = prevMarkers.slice(0, -1);
              console.log('New markers count:', newMarkers.length);
              return newMarkers;
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            pinColor={getMarkerColor(marker.category)}
            onPress={() => handleMarkerRouting(marker)}
          >
            {!isRoutingMode && (
              <Callout
                style={styles.calloutContainer}
                onPress={() => shareLocation(marker)}
              >
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle}>{marker.title}</Text>
                  <Text style={styles.calloutDescription}>{marker.description}</Text>
                  <Text style={styles.calloutAddress}>{marker.address}</Text>
                  <View style={styles.calloutActions}>
                    <Text style={styles.calloutCoordinates}>
                      📍 {marker.coordinate.latitude.toFixed(4)}, {marker.coordinate.longitude.toFixed(4)}
                    </Text>
                    <Text style={styles.calloutTap}>Tap to share 📤</Text>
                  </View>
                </View>
              </Callout>
            )}
          </Marker>
        ))}
        
        {/* Route Directions */}
        {isRoutingMode && routeOrigin && routeDestination && (
          <MapViewDirections
            origin={routeOrigin}
            destination={routeDestination}
            apikey="YOUR_GOOGLE_MAPS_API_KEY" // You'll need to add your Google Maps API key
            mode={travelMode}
            strokeWidth={4}
            strokeColor={getTravelModeColor(travelMode)}
            onStart={() => console.log('Route calculation started')}
            onReady={(result) => {
              setRouteInfo({
                distance: result.distance * 1000, // Convert km to meters
                duration: result.duration,
                mode: travelMode,
                coordinates: result.coordinates
              });
              // Fit the map to show the entire route
              if (result.coordinates.length > 0) {
                // You can implement fitToCoordinates here if needed
              }
            }}
            onError={(errorMessage) => {
              console.error('Route calculation error:', errorMessage);
              Alert.alert('Route Error', 'Could not calculate route. Please try again.');
            }}
          />
        )}
      </MapView>
      
      {/* Category Selection - Hide during routing */}
      {!isRoutingMode && (
        <View style={styles.categoryContainer}>
          {(['current', 'favorite', 'restaurant', 'photo', 'custom'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                { backgroundColor: getMarkerColor(category) },
                selectedCategory === category && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={styles.categoryText}>
                {category === 'current' ? '📍' :
                 category === 'favorite' ? '❤️' :
                 category === 'restaurant' ? '🍴' :
                 category === 'photo' ? '📷' : '📌'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Routing Controls */}
      {isRoutingMode && (
        <View style={styles.routingContainer}>
          <View style={styles.travelModeContainer}>
            {(['DRIVING', 'WALKING', 'TRANSIT'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.travelModeButton,
                  { backgroundColor: getTravelModeColor(mode) },
                  travelMode === mode && styles.selectedTravelMode
                ]}
                onPress={() => setTravelMode(mode)}
              >
                <Text style={styles.travelModeText}>{getTravelModeIcon(mode)}</Text>
                <Text style={styles.travelModeLabel}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.stopRoutingButton} onPress={stopRouting}>
            <Text style={styles.stopRoutingText}>Stop Routing ❌</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Route Information Panel */}
      {showRouteDetails && routeInfo && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeInfoTitle}>
              {getTravelModeIcon(routeInfo.mode)} {routeInfo.mode} Route
            </Text>
            <TouchableOpacity onPress={() => setShowRouteDetails(false)}>
              <Text style={styles.closeRouteInfo}>✖️</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.routeStats}>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatLabel}>Distance</Text>
              <Text style={styles.routeStatValue}>{formatDistance(routeInfo.distance)}</Text>
            </View>
            <View style={styles.routeStat}>
              <Text style={styles.routeStatLabel}>Duration</Text>
              <Text style={styles.routeStatValue}>{formatDuration(routeInfo.duration)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!isRoutingMode ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={addMarkerAtCurrentLocation}
            >
              <Text style={styles.buttonText}>Add {selectedCategory} Marker</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.routeButton]}
              onPress={startRouting}
            >
              <Text style={styles.buttonText}>🗺️ Get Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={() => {
                console.log('Remove button touched');
                removeLastMarker();
              }}
            >
              <Text style={styles.buttonText}>Remove Last</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.routingInstructions}>
            <Text style={styles.routingText}>🗺️ Tap any marker to get directions</Text>
          </View>
        )}
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Category Selection Styles
  categoryContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 5,
  },
  categoryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  selectedCategory: {
    borderWidth: 3,
    borderColor: '#000',
  },
  categoryText: {
    fontSize: 20,
  },
  // Callout Styles
  calloutContainer: {
    width: 250,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 0,
  },
  calloutContent: {
    padding: 15,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  calloutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  calloutActions: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    alignItems: 'center',
  },
  calloutCoordinates: {
    fontSize: 11,
    color: '#007AFF',
    marginBottom: 5,
  },
  calloutTap: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  // Routing Styles
  routingContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  travelModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  travelModeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedTravelMode: {
    borderWidth: 2,
    borderColor: '#000',
  },
  travelModeText: {
    fontSize: 20,
    marginBottom: 2,
  },
  travelModeLabel: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  stopRoutingButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopRoutingText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Route Information Styles
  routeInfoContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeRouteInfo: {
    fontSize: 18,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  routeStat: {
    alignItems: 'center',
  },
  routeStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  routeStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  // Button Styles
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  routeButton: {
    backgroundColor: '#34C759',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  routingInstructions: {
    flex: 1,
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  routingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
