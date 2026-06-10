import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation } from './homes/nav';

export const MainLayout = ({
  children,
  darkMode,
  currentScreen,
  onScreenChange,
  userData,
  navVisible = true
}) => {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={darkMode ? "#111827" : "#ffffff"} />

      <SafeAreaView
        style={[styles.safeArea, darkMode && styles.safeAreaDark]}
        edges={['top']}>

        <View style={[styles.container, darkMode && styles.containerDark]}>
          {children}

          {currentScreen !== 'avisos' && (
            <BottomNavigation
              currentScreen={currentScreen}
              onScreenChange={onScreenChange}
              darkMode={darkMode}
              userData={userData}
              isVisible={navVisible} />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  safeAreaDark: {
    backgroundColor: '#111827'
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  containerDark: {
    backgroundColor: '#111827'
  }
});
