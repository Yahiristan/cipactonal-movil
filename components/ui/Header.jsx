import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const Header = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  darkMode
}) => {
  const textColor = darkMode ? '#f8fafc' : '#0f172a';
  const subtitleColor = darkMode ? '#94a3b8' : '#64748b';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: 16 }
      ]}
    >
      <View style={styles.topBar}>
        <View style={styles.leftContainer}>
          {leftComponent && (
            <View style={styles.leftComponentWrap}>
              {leftComponent}
            </View>
          )}
          {(title || subtitle) && (
            <View style={styles.textContainer}>
              {subtitle ? <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>{subtitle}</Text> : null}
              {title ? <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>{title}</Text> : null}
            </View>
          )}
        </View>

        {rightComponent && (
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftComponentWrap: {
    marginRight: 12,
  },
  rightContainer: {
    marginLeft: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  }
});
