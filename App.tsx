import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

interface MarkerData {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
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
      const newMarker: MarkerData = {
        id: Date.now().toString(),
        coordinate: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
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
            onPress={() => onMarkerPress(marker)}
          />
        ))}
      </MapView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={addMarkerAtCurrentLocation}
        >
          <Text style={styles.buttonText}>Add Marker Here</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.removeButton]}
          onPress={() => {
            console.log('Remove button touched');
            removeLastMarker();
          }}
        >
          <Text style={styles.buttonText}>Remove Last Marker</Text>
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});
