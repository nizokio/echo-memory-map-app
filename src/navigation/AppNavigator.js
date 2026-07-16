import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';

import MainTabsScreen from '../screens/MainTabsScreen';
import DetailScreen from '../screens/DetailScreen';
import ItineraryScreen from '../screens/ItineraryScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen name="Home" component={MainTabsScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Itinerary" component={ItineraryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
