import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Text
} from
  'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NavItem = ({ item, isActive, onPress, darkMode, navStyles }) => {
  const customAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(customAnim, {
      toValue: isActive ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    if (!isActive) {
      Animated.timing(customAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: false
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!isActive) {
      Animated.timing(customAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false
      }).start();
    }
  };

  return (
    <TouchableOpacity
      style={navStyles.navItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}>

      <View style={navStyles.iconWrapper}>
        <Ionicons
          name={isActive ? item.icon : `${item.icon}-outline`}
          size={24}
          color={isActive ? '#2563eb' : darkMode ? '#9ca3af' : '#6b7280'} />
        <Text style={[
          navStyles.label,
          { color: isActive ? '#2563eb' : darkMode ? '#9ca3af' : '#6b7280' },
          isActive && navStyles.labelActive
        ]}>
          {item.label}
        </Text>
      </View>
    </TouchableOpacity>);

};

export const BottomNavigation = ({ currentScreen, onScreenChange, darkMode, userData, isVisible = true }) => {
  const insets = useSafeAreaInsets();
  const styles = darkMode ? navStylesDark : navStyles;

  const opacityAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const translateYAnim = useRef(new Animated.Value(isVisible ? 0 : 50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: isVisible ? 1 : 0,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: isVisible ? 0 : 50,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  }, [isVisible]);

  const navItems = [
    { id: 'home', icon: 'home', label: 'Inicio' },
    { id: 'history', icon: 'time', label: 'Historial' },
    { id: 'schedule', icon: 'calendar', label: 'Horario' }];


  if (userData?.esAdmin) {
    navItems.push({ id: 'admin', icon: 'shield-checkmark', label: 'Admin' });
  }

  navItems.push({ id: 'settings', icon: 'settings', label: 'Ajustes' });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          bottom: 0,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
          pointerEvents: isVisible ? 'auto' : 'none'
        }]
      }>

      <View style={styles.innerContainer}>
        <View style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;

          return (
            <NavItem
              key={item.id}
              item={item}
              isActive={isActive}
              onPress={() => onScreenChange(item.id)}
              darkMode={darkMode}
              navStyles={styles} />);
        })}
        </View>
      </View>
    </Animated.View>);

};

const navStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  innerContainer: {
    overflow: 'hidden'
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    height: 60,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%'
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 4
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500'
  },
  labelActive: {
    fontWeight: '700'
  }
});

const navStylesDark = StyleSheet.create({
  container: {
    ...navStyles.container,
    backgroundColor: '#1f2937',
    borderTopColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  navBar: {
    ...navStyles.navBar,
    backgroundColor: 'transparent'
  },
  innerContainer: navStyles.innerContainer,
  navItem: navStyles.navItem,
  iconWrapper: navStyles.iconWrapper,
  label: navStyles.label,
  labelActive: navStyles.labelActive
});