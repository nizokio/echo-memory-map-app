import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';

import MainTabsScreen from '../screens/MainTabsScreen';
import AlbumScreen from '../screens/AlbumScreen';
import DetailScreen from '../screens/DetailScreen';
import MemoryTimelineScreen from '../screens/MemoryTimelineScreen';

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
        <Stack.Screen name="Album" component={AlbumScreen} />
        <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="MemoryTimeline" component={MemoryTimelineScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
