import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const StepIndicator = ({ currentStep }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const t = isDark ? dark : light;

  const steps = [
    { number: 1, label: 'Afiliación' },
    { number: 2, label: 'Dispositivo' },
    { number: 3, label: 'Aprobación' }
  ];

  return (
    <View style={[styles.container, { backgroundColor: t.headerBg }]}>
      {steps.map((step, index) => {
        const isActive = currentStep >= step.number;
        const isCurrent = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <React.Fragment key={step.number}>
            <View style={styles.stepWrapper}>
              <View style={[
                styles.circle,
                isCompleted
                  ? { borderColor: t.accent, backgroundColor: t.accent }
                  : isCurrent
                    ? { borderColor: t.accent, backgroundColor: t.headerBg }
                    : { borderColor: t.lineInactive, backgroundColor: t.headerBg }
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    { color: isCurrent ? t.accent : t.textInactive }
                  ]}>
                    {step.number}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.label,
                { color: isCurrent || isCompleted ? t.labelActive : t.textInactive }
              ]}>
                {step.label}
              </Text>
            </View>

            {index < steps.length - 1 && (
              <View style={[
                styles.line,
                { backgroundColor: isCompleted ? t.accent : t.lineInactive }
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// ─── Paletas ──────────────────────────────────────────────────────────────────
const light = {
  headerBg:     '#ffffff',
  accent:       '#2563eb',
  lineInactive: '#e2e8f0',
  textInactive: '#94a3b8',
  labelActive:  '#1e293b',
};

const dark = {
  headerBg:     '#0f172a',
  accent:       '#3b82f6',
  lineInactive: '#334155',
  textInactive: '#94a3b8',
  labelActive:  '#ffffff',
};

// ─── Estilos base (layout/dimensiones sin color) ──────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%',
  },
  stepWrapper: {
    alignItems: 'center',
    width: 70,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 11,
    marginHorizontal: -15,
    zIndex: 1,
    borderRadius: 2,
  },
});
