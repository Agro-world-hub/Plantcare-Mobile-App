import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as turf from '@turf/turf';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from './types';
import Icon from 'react-native-vector-icons/MaterialIcons';

type AreaSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AreaSelection'
>;

interface AreaSelectionScreenProps {
  navigation: AreaSelectionScreenNavigationProp;
}

const AreaSelectionScreen: React.FC<AreaSelectionScreenProps> = ({ navigation }) => {
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [area, setArea] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Recalculate area when coordinates change
  useEffect(() => {
    if (coordinates.length >= 3) {
      const polygon = turf.polygon([[
        ...coordinates.map(coord => [coord.longitude, coord.latitude]),
        [coordinates[0].longitude, coordinates[0].latitude]
      ]]);
      setArea(turf.area(polygon));
    }
  }, [coordinates]);

  const handleMapPress = (e: any) => {
    if (selectedIndex !== null) return; // Prevent adding while moving
    
    const newCoordinate = e.nativeEvent.coordinate;
    setCoordinates([...coordinates, newCoordinate]);
  };

  const handleMarkerDragEnd = (index: number, newCoordinate: any) => {
    const newCoordinates = [...coordinates];
    newCoordinates[index] = newCoordinate.nativeEvent.coordinate;
    setCoordinates(newCoordinates);
    setSelectedIndex(null);
  };

  const handleMarkerLongPress = (index: number) => {
    setSelectedIndex(index);
  };

  const deletePoint = () => {
    if (selectedIndex === null) return;
    
    const newCoordinates = coordinates.filter((_, i) => i !== selectedIndex);
    setCoordinates(newCoordinates);
    setSelectedIndex(null);
  };

//   const confirmSelection = () => {
//     if (coordinates.length < 3) {
//       Alert.alert('Error', 'Please select at least 3 points to form a polygon');
//       return;
//     }

//     navigation.navigate('Dashboard', { 
//       selectedArea: area,
//       coordinates: coordinates
//     });
//   };
if (Platform.OS === 'ios' && !PROVIDER_GOOGLE) {
    Alert.alert('Maps Error', 'Google Maps not configured for iOS');
    return null;
  }
  return (
    <View className="flex-1">
      <MapView
        className="flex-1"
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 7.8731,
          longitude: 80.7718,
          latitudeDelta: 2,
          longitudeDelta: 2,
        }}
        onPress={handleMapPress}
      >
        {coordinates.length > 0 && (
          <>
            <Polygon
              coordinates={coordinates}
              strokeColor="#000"
              fillColor="rgba(0,128,0,0.3)"
              strokeWidth={2}
            />
            {coordinates.map((coord, index) => (
              <Marker
                key={index}
                coordinate={coord}
                draggable
                onDragEnd={(e) => handleMarkerDragEnd(index, e)}
                onPress={() => setSelectedIndex(index)}
                // onLongPress={() => handleMarkerLongPress(index)}
                pinColor={selectedIndex === index ? '#FF0000' : '#445F4A'}
              />
            ))}
          </>
        )}
      </MapView>

      <View className="absolute bottom-5 left-5 right-5 bg-white p-5 rounded-xl shadow-lg space-y-3">
        <View className="flex-row justify-between items-center">
          <Text className="text-base font-semibold">
            Selected Area: {area.toFixed(2)} m²
          </Text>
          <Text className="text-base text-gray-500">
            Points: {coordinates.length}
          </Text>
        </View>

        <View className="flex-row justify-between space-x-3">
          {selectedIndex !== null && (
            <TouchableOpacity
              className="bg-red-500 p-3 rounded-lg flex-1 items-center flex-row justify-center"
              onPress={deletePoint}
            >
              <Icon name="delete" size={20} color="white" />
              <Text className="text-white text-base ml-2">Delete Point</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            className="bg-primary p-3 rounded-lg flex-1 items-center flex-row justify-center"
            // onPress={confirmSelection}
          >
            <Icon name="check" size={20} color="white" />
            <Text className="text-white text-base ml-2">Confirm Area</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-gray-500">
          {coordinates.length < 3 
            ? 'Add at least 3 points by tapping on the map' 
            : 'Long press markers to select, drag to move'}
        </Text>
      </View>
    </View>
  );
};

export default AreaSelectionScreen;