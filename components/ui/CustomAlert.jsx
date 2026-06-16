import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const CustomAlert = ({
  visible,
  title = '',
  message = '',
  actions = [],
  darkMode = false,
  onClose
}) => {
  const alertAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(alertAnim, {
        toValue: 1,
        tension: 120,
        friction: 12,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(alertAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  // Determinar icono y color basado en el titulo
  let icon = 'information-circle';
  let iconColor = '#2563eb';
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes('error') ||
    lowerTitle.includes('fall') ||
    lowerTitle.includes('insuficiente') ||
    lowerTitle.includes('bloqueo') ||
    lowerTitle.includes('sin acceso') ||
    lowerTitle.includes('no disponible') ||
    lowerTitle.includes('denegada') ||
    lowerTitle.includes('sin conexión')
  ) {
    icon = 'alert-circle';
    iconColor = '#ef4444';
  } else if (
    lowerTitle.includes('exitoso') ||
    lowerTitle.includes('completada') ||
    lowerTitle.includes('éxito') ||
    lowerTitle.includes('eliminado') ||
    lowerTitle.includes('correcto')
  ) {
    icon = 'checkmark-circle';
    iconColor = '#10b981';
  } else if (
    lowerTitle.includes('aviso') ||
    lowerTitle.includes('pendiente') ||
    lowerTitle.includes('eliminar') ||
    lowerTitle.includes('advertencia') ||
    lowerTitle.includes('seguridad')
  ) {
    icon = 'warning';
    iconColor = '#f59e0b';
  }

  const handleActionPress = (action) => {
    Animated.timing(alertAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      onClose();
      if (typeof action.onPress === 'function') {
        action.onPress();
      }
    });
  };

  const activeActions = actions && actions.length > 0 ? actions : [{ text: 'OK', onPress: null }];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
              styles.card,
              { backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderColor: darkMode ? '#334155' : '#e2e8f0' },
              {
                opacity: alertAnim,
                transform: [{ scale: alertAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }]
              }
            ]}>
              <View style={[styles.topStripe, { backgroundColor: iconColor }]} />
              <View style={styles.body}>
                <View style={[styles.iconCircle, { backgroundColor: `${iconColor}1A` }]}>
                  <Ionicons name={icon} size={36} color={iconColor} />
                </View>
                <Text style={[styles.title, { color: darkMode ? '#f1f5f9' : '#111827' }]}>{title}</Text>
                <Text style={[styles.message, { color: darkMode ? '#94a3b8' : '#4b5563' }]}>{message}</Text>

                <View style={styles.alertActions}>
                  {activeActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.btn,
                        action.style === 'cancel'
                          ? { backgroundColor: darkMode ? '#334155' : '#f1f5f9' }
                          : (action.style === 'destructive' ? { backgroundColor: '#ef4444' } : { backgroundColor: iconColor })
                      ]}
                      onPress={() => handleActionPress(action)}
                      activeOpacity={0.85}>
                      <Text style={[
                        styles.btnText,
                        action.style === 'cancel' && { color: darkMode ? '#f1f5f9' : '#111827' }
                      ]}>
                        {action.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  topStripe: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 28,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  alertActions: {
    width: '100%',
    gap: 10,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  }
});

export default CustomAlert;
