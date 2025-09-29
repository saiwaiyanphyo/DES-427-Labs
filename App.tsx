import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Alert, Share } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
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
            onPress={() => onMarkerPress(marker)}
          >
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
          </Marker>
        ))}
      </MapView>
      
      {/* Category Selection */}
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

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={addMarkerAtCurrentLocation}
        >
          <Text style={styles.buttonText}>Add {selectedCategory} Marker</Text>
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
  },
  addButton: {
    backgroundColor: '#007AFF',
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    marginLeft: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
