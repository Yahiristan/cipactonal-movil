import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const StepIndicator = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Afiliación' },
    { number: 2, label: 'Dispositivo' },
    { number: 3, label: 'Aprobación' }
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = currentStep >= step.number;
        const isCurrent = currentStep === step.number;
        const isCompleted = currentStep > step.number;

        return (
          <React.Fragment key={step.number}>
            <View style={styles.stepWrapper}>
              <View style={[
                styles.circle, 
                isCompleted ? styles.circleCompleted : (isCurrent ? styles.circleCurrent : styles.circleInactive)
              ]}>
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    isCurrent ? styles.textCurrent : styles.textInactive
                  ]}>
                    {step.number}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.label,
                isCurrent || isCompleted ? styles.labelActive : styles.labelInactive
              ]}>
                {step.label}
              </Text>
            </View>

            {index < steps.length - 1 && (
              <View style={[
                styles.line,
                isCompleted ? styles.lineActive : styles.lineInactive
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    width: '100%'
  },
  stepWrapper: {
    alignItems: 'center',
    width: 70
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    zIndex: 2
  },
  circleCompleted: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb'
  },
  circleCurrent: {
    borderColor: '#2563eb'
  },
  circleInactive: {
    borderColor: '#e2e8f0'
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  textCurrent: {
    color: '#2563eb'
  },
  textInactive: {
    color: '#94a3b8'
  },
  label: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2
  },
  labelActive: {
    color: '#1e293b'
  },
  labelInactive: {
    color: '#94a3b8'
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: 11,
    marginHorizontal: -15,
    zIndex: 1,
    borderRadius: 2
  },
  lineActive: {
    backgroundColor: '#2563eb'
  },
  lineInactive: {
    backgroundColor: '#e2e8f0'
  }
});
