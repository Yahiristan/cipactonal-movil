import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView
} from
  'react-native';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Camera as VisionCamera, useCameraDevice } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera-face-detector';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const OVAL_WIDTH = SCREEN_WIDTH * 0.65;
const OVAL_HEIGHT = SCREEN_HEIGHT * 0.42;
const OVAL_CENTER_X = SCREEN_WIDTH / 2;
const OVAL_CENTER_Y = SCREEN_HEIGHT / 2;
const OVAL_LEFT = OVAL_CENTER_X - OVAL_WIDTH / 2;
const OVAL_RIGHT = OVAL_CENTER_X + OVAL_WIDTH / 2;
const OVAL_TOP = OVAL_CENTER_Y - OVAL_HEIGHT / 2;
const OVAL_BOTTOM = OVAL_CENTER_Y + OVAL_HEIGHT / 2;
const isFaceInOval = (face, livenessActive = false) => {
  if (!face?.bounds) return false;
  const { x, y, width, height } = face.bounds;
  const faceCX = x + width / 2;
  const faceCY = y + height / 2;
  const radiusX = OVAL_WIDTH / 2;
  const radiusY = OVAL_HEIGHT / 2;
  const ellipseTest =
    Math.pow((faceCX - OVAL_CENTER_X) / radiusX, 2) +
    Math.pow((faceCY - OVAL_CENTER_Y) / radiusY, 2);
  
  // Si liveness está activo, somos más permisivos para que pueda mover la cabeza
  const maxEllipse = livenessActive ? 3.0 : 1.05; 
  const isCentered = ellipseTest <= maxEllipse;
  const isBigEnough = width >= OVAL_WIDTH * (livenessActive ? 0.20 : 0.30);
  return isCentered && isBigEnough;
};

export const FacialCaptureScreen = ({
  onCapture,
  onCancel,
  darkMode = false,
  skipInstructions = false
}) => {
  const device = useCameraDevice('front');
  const camera = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const dm = darkMode;
  const bgColor = dm ? '#0f172a' : '#ffffff';
  const textColor = dm ? '#f1f5f9' : '#374151';
  const closeBtnBg = dm ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const closeIconClr = dm ? '#f1f5f9' : '#1f2937';

  const [alertModal, setAlertModal] = useState({ visible: false, title: '', message: '', actions: [] });
  const showCustomAlert = (title, message, actions = [{ text: 'OK', onPress: null }]) => {
    setAlertModal({ visible: true, title, message, actions });
  };
  const tipBg = dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const closeTop = Platform.OS === 'ios' ?
    50 :
    (StatusBar.currentHeight || 24) + 8;
  const faceDetectionOptions = useRef({
    performanceMode: 'fast',
    classificationMode: 'all',
    landmarkMode: 'all',
    contourMode: 'none',
    trackingEnabled: true,
    minFaceSize: 0.08, // Más sensible para detectar rostros un poco más lejanos
    autoMode: true,
    windowWidth: SCREEN_WIDTH,
    windowHeight: SCREEN_HEIGHT
  }).current;
  const [instruction, setInstruction] = useState('Centra tu rostro dentro del óvalo');
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const [isValidating, setIsValidating] = useState(false);
  const isValidatingRef = useRef(false);
  const [facesDetected, setFacesDetected] = useState([]);
  const [faceDetected, setFaceDetected] = useState(false);
  const [lastFaceData, setLastFaceData] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const faceDetectionTimeout = useRef(null);
  const errorFramesRef = useRef(0);

  // Keep refs in sync so the face-detection callback always has fresh values
  const setIsProcessingSafe = (val) => { isProcessingRef.current = val; setIsProcessing(val); };
  const setCountdownSafe = (val) => { countdownRef.current = typeof val === 'function' ? val(countdownRef.current) : val; setCountdown(val); };
  const setIsValidatingSafe = (val) => { isValidatingRef.current = val; setIsValidating(val); };
  
  const [showInstructions, setShowInstructions] = useState(!skipInstructions);
  const livenessStepRef = useRef(0); // 0: init, 1: first_move, 2: first_recenter, 3: second_move, 4: second_recenter, 5: done
  const livenessCompletedRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const targetDirectionRef = useRef(null); // 'left' | 'right' | 'up' | 'down' | 'center'
  const directionSequenceRef = useRef([]); // e.g. ['left', 'right']
  const transitionTimeoutRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const livenessFaceDataRef = useRef(null);

  const resetLiveness = () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    livenessStepRef.current = 0;
    targetDirectionRef.current = null;
    directionSequenceRef.current = [];
    isTransitioningRef.current = false;
    livenessFaceDataRef.current = null;
  };

  const handleRetry = () => {
    livenessCompletedRef.current = false;
    resetLiveness();
    setInstruction('Centra tu rostro dentro del óvalo');
  };

  const getDirectionText = (dir) => {
    switch (dir) {
      case 'left': return 'Gira la cabeza a la IZQUIERDA';
      case 'right': return 'Gira la cabeza a la DERECHA';
      case 'up': return 'Gira la cabeza hacia ARRIBA';
      case 'down': return 'Gira la cabeza hacia ABAJO';
      case 'center': return 'Mira al CENTRO';
      default: return '';
    }
  };

  const generateSequence = () => {
    const directions = ['left', 'right', 'up', 'down'];
    const first = directions[Math.floor(Math.random() * directions.length)];
    const remaining = directions.filter(d => d !== first);
    const second = remaining[Math.floor(Math.random() * remaining.length)];
    return [first, second];
  };

  useEffect(() => {
    checkPermissions();
    startPulseAnimation();
    return () => {
      if (faceDetectionTimeout.current) {
        clearTimeout(faceDetectionTimeout.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);
  const checkPermissions = async () => {
    const cameraPermission = await VisionCamera.getCameraPermissionStatus();
    if (cameraPermission === 'granted') {
      setHasPermission(true);
    } else {
      const newCameraPermission = await VisionCamera.requestCameraPermission();
      setHasPermission(newCameraPermission === 'granted');
    }
  };
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        })]
      )
    ).start();
  };
  const updateFaceDetection = useCallback((faces) => {
    setFacesDetected(faces);

    if (faces.length > 0) {
      const face = faces[0];
      setLastFaceData(face);

      if (faceDetectionTimeout.current) {
        clearTimeout(faceDetectionTimeout.current);
      }
      const leftEyeOpen = face.leftEyeOpenProbability !== undefined ? face.leftEyeOpenProbability : 1;
      const rightEyeOpen = face.rightEyeOpenProbability !== undefined ? face.rightEyeOpenProbability : 1;
      const yaw = face.yawAngle || 0;
      const pitch = face.pitchAngle || 0;
      const roll = Math.abs(face.rollAngle || 0);
      const step = livenessStepRef.current;
      const livenessActive = step >= 1 && step <= 4;
      const maxYaw = livenessActive ? 80 : 20; // 20 para centrar, 80 para permitir giro completo
      const isGoodQuality = leftEyeOpen > 0.3 && rightEyeOpen > 0.3 && Math.abs(yaw) <= maxYaw && roll <= 30; // Roll más permisivo
      const inOval = isFaceInOval(face, livenessActive);

      if (!countdownRef.current && !isProcessingRef.current && !isValidatingRef.current && !livenessCompletedRef.current && !isTransitioningRef.current) {
        if (!inOval) {
          errorFramesRef.current += 1;
          if (errorFramesRef.current > 5) {
            setFaceDetected(false);
            setInstruction('Centra tu rostro dentro del óvalo');
            resetLiveness();
            errorFramesRef.current = 0; // ← resetear para que al volver la cara arranque limpio
          }
        } else if (isGoodQuality && step === 0) {
          errorFramesRef.current = 0;
          setFaceDetected(true);
          const seq = generateSequence();
          directionSequenceRef.current = seq;
          targetDirectionRef.current = seq[0];
          livenessStepRef.current = 1;
          setInstruction(getDirectionText(seq[0]));
        } else if (!isGoodQuality && step === 0) {
          // Cara detectada en óvalo pero calidad insuficiente (ojos cerrados, ladeada)
          errorFramesRef.current = 0;
          setFaceDetected(true);
          setInstruction('Mira de frente con los ojos abiertos');
        } else if (step === 1 || step === 3) {
          errorFramesRef.current = 0;
          setFaceDetected(true);
          const target = targetDirectionRef.current;
          let hit = false;
          if (target === 'left' && yaw < -18) hit = true;
          else if (target === 'right' && yaw > 18) hit = true;
          else if (target === 'up' && pitch > 12) hit = true;
          else if (target === 'down' && pitch < -12) hit = true;

          if (hit) {
            isTransitioningRef.current = true;
            if (step === 1) {
              setInstruction('¡Bien hecho! Ahora regresa al centro');
              transitionTimeoutRef.current = setTimeout(() => {
                livenessStepRef.current = 2;
                targetDirectionRef.current = 'center';
                setInstruction('Mira al centro');
                isTransitioningRef.current = false;
                transitionTimeoutRef.current = null;
              }, 1000);
            } else {
              setInstruction('¡Excelente! Regresa al centro');
              transitionTimeoutRef.current = setTimeout(() => {
                livenessStepRef.current = 4;
                targetDirectionRef.current = 'center';
                setInstruction('Mira al centro');
                isTransitioningRef.current = false;
                transitionTimeoutRef.current = null;
              }, 1000);
            }
          } else {
            setInstruction(getDirectionText(target));
          }
        } else if (step === 2) {
          errorFramesRef.current = 0;
          setFaceDetected(true);
          const isCentered = Math.abs(yaw) < 8 && Math.abs(pitch) < 8;
          if (isCentered) {
            isTransitioningRef.current = true;
            const nextDir = directionSequenceRef.current[1];
            setInstruction('¡Listo! Prepárate para el siguiente movimiento');
            transitionTimeoutRef.current = setTimeout(() => {
              livenessStepRef.current = 3;
              targetDirectionRef.current = nextDir;
              setInstruction(getDirectionText(nextDir));
              isTransitioningRef.current = false;
              transitionTimeoutRef.current = null;
            }, 1000);
          } else {
            setInstruction('Mira al centro');
          }
        } else if (step === 4) {
          errorFramesRef.current = 0;
          setFaceDetected(true);
          const isCentered = Math.abs(yaw) < 8 && Math.abs(pitch) < 8;
          if (isCentered && isGoodQuality && inOval) {
            livenessStepRef.current = 5;
            livenessCompletedRef.current = true;
            livenessFaceDataRef.current = face;
            setInstruction('¡Perfecto! Mantén la posición');
            transitionTimeoutRef.current = setTimeout(() => {
              startCountdown();
              transitionTimeoutRef.current = null;
            }, 600);
          } else {
            setInstruction('Mira al centro');
          }
        }
      }

      faceDetectionTimeout.current = setTimeout(() => {
        errorFramesRef.current = 0; // ← reset para reinicio limpio
        setFaceDetected(false);
        if (!countdownRef.current && !isProcessingRef.current && !isValidatingRef.current && !livenessCompletedRef.current) {
          setInstruction('Centra tu rostro dentro del óvalo');
          resetLiveness();
        }
      }, 500);

    } else {
      if (faceDetectionTimeout.current) {
        clearTimeout(faceDetectionTimeout.current);
        faceDetectionTimeout.current = null;
      }
      errorFramesRef.current += 1;
      if (errorFramesRef.current > 5) {
        setFaceDetected(false);
        setLastFaceData(null);
        if (!countdownRef.current && !isProcessingRef.current && !isValidatingRef.current && !livenessCompletedRef.current) {
          setInstruction('No se detecta rostro');
          resetLiveness();
          errorFramesRef.current = 0; // ← reset para que al reaparecer no se quede en loop
        }
      }
    }
  }, []);

  const handleFaceDetection = useCallback((faces) => {
    updateFaceDetection(faces);
  }, [updateFaceDetection]);

  const startCountdown = () => {
    setCountdownSafe(3);
    setInstruction('Mantén la posición');
    countdownTimerRef.current = setInterval(() => {
      setCountdownSafe((prev) => {
        if (prev === 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          handleCapture();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCapture = async () => {
    if (!camera.current || isProcessingRef.current) return;
    try {
      setIsProcessingSafe(true);
      setInstruction(' Capturando foto...');
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
        skipMetadata: false
      });
      const fileUri = Platform.OS === 'ios' ? photo.path : `file://${photo.path}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      const actions = [];
      if (Platform.OS === 'android' && photo.width > photo.height) {
        if (photo.orientation === 'portrait') {
          actions.push({ rotate: 270 });
        } else if (photo.orientation === 'portrait-upside-down') {
          actions.push({ rotate: 90 });
        } else if (photo.orientation === 'landscape-left') {
          actions.push({ rotate: 180 });
        } else {
          actions.push({ rotate: 270 });
        }
      } else if (Platform.OS === 'android' && (!photo.width || !photo.height)) {
        actions.push({ rotate: 270 });
      }
      actions.push({ resize: { width: 1200 } });

      const manipResult = await ImageManipulator.manipulateAsync(
        fileUri,
        actions,
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const photoBase64 = manipResult.base64;
      if (!fileInfo.exists || fileInfo.size < 50000) {
        throw new Error('La captura falló. Intenta de nuevo con mejor iluminación.');
      }
      setInstruction(' Analizando rostro...');
      setIsValidatingSafe(true);
      
      const faceToVerify = livenessFaceDataRef.current || lastFaceData;
      if (!faceToVerify) {
        setIsValidatingSafe(false);
        setIsProcessingSafe(false);
        setCountdownSafe(null);
        showCustomAlert(
          ' No se detectó rostro',
          'No se detectó ningún rostro en el momento de la captura.\n\nPor favor:\n• Asegúrate de que tu rostro esté visible\n• Verifica que haya buena iluminación\n• Posiciónate dentro del óvalo',
          [{ text: 'Tomar otra foto', onPress: handleRetry }]
        );
        return;
      }
      if (!isFaceInOval(faceToVerify)) {
        setIsValidatingSafe(false);
        setIsProcessingSafe(false);
        setCountdownSafe(null);
        showCustomAlert(
          '️ Rostro fuera del óvalo',
          'Tu rostro no estaba centrado en el óvalo al momento de capturar.\n\nPor favor posiciona tu rostro dentro del óvalo e inténtalo de nuevo.',
          [{ text: 'Reintentar', onPress: handleRetry }]
        );
        return;
      }
      const detectedFace = faceToVerify;
      const leftEyeOpen = detectedFace.leftEyeOpenProbability !== undefined ? detectedFace.leftEyeOpenProbability : 1;
      const rightEyeOpen = detectedFace.rightEyeOpenProbability !== undefined ? detectedFace.rightEyeOpenProbability : 1;
      const yaw = Math.abs(detectedFace.yawAngle || 0);
      const roll = Math.abs(detectedFace.rollAngle || 0);
      if (leftEyeOpen < 0.2 || rightEyeOpen < 0.2 || yaw > 40 || roll > 40) {
        setIsValidatingSafe(false);
        setIsProcessingSafe(false);
        setCountdownSafe(null);
        showCustomAlert(
          '️ Calidad insuficiente',
          'Se detectó un rostro pero la calidad no es suficiente.\n\n' + (
            leftEyeOpen < 0.2 || rightEyeOpen < 0.2 ? '• Mantén los ojos abiertos\n' : '') + (
            yaw > 40 ? '• Mira de frente a la cámara\n' : '') + (
            roll > 40 ? '• Mantén la cabeza recta\n' : ''),
          [{ text: 'Tomar otra foto', onPress: handleRetry }]
        );
        return;
      }
      const realFaceData = {
        bounds: detectedFace.bounds,
        rollAngle: detectedFace.rollAngle,
        yawAngle: detectedFace.yawAngle,
        pitchAngle: detectedFace.pitchAngle || 0,
        smilingProbability: detectedFace.smilingProbability || 0,
        leftEyeOpenProbability: detectedFace.leftEyeOpenProbability,
        rightEyeOpenProbability: detectedFace.rightEyeOpenProbability,
        leftEyePosition: detectedFace.landmarks?.LEFT_EYE,
        rightEyePosition: detectedFace.landmarks?.RIGHT_EYE,
        noseBasePosition: detectedFace.landmarks?.NOSE_BASE,
        mouthPosition: detectedFace.landmarks?.MOUTH_BOTTOM,
        leftCheekPosition: detectedFace.landmarks?.LEFT_CHEEK,
        rightCheekPosition: detectedFace.landmarks?.RIGHT_CHEEK
      };

      setInstruction(' Rostro verificado correctamente');
      await new Promise((resolve) => setTimeout(resolve, 800));
      onCapture({
        photoUri: fileUri,
        photoBase64: photoBase64,
        faceData: realFaceData,
        timestamp: Date.now(),
        imageSize: fileInfo.size,
        validated: true,
        faceDetectionUsed: true
      });
    } catch (error) {
      setIsValidatingSafe(false);
      setIsProcessingSafe(false);
      setCountdownSafe(null);
      showCustomAlert(
        ' Error de captura',
        error.message || 'No se pudo capturar o analizar la foto correctamente.',
        [{ text: 'Reintentar', onPress: handleRetry }]
      );
    }
  };
  if (!hasPermission) {
    return (
      <Modal visible={true} animationType="fade" statusBarTranslucent>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.permissionText}>Solicitando permisos...</Text>
        </View>
      </Modal>);
  }

  if (hasPermission === false && hasPermission !== null) {
    return (
      <Modal visible={true} animationType="fade" statusBarTranslucent>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <Ionicons name="camera-off" size={56} color="#ef4444" />
          <Text style={styles.permissionText}>Acceso a cámara necesario</Text>
          <Text style={styles.permissionSubtext}>Ve a Ajustes para habilitar la cámara</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </Modal>);

  }

  if (!device) {
    return (
      <Modal visible={true} animationType="fade" statusBarTranslucent>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.permissionText}>Cargando cámara...</Text>
        </View>
      </Modal>);

  }

  const ovalBorderColor = countdown ?
    '#10b981' :
    isValidating ?
      '#2563eb' :
      faceDetected ?
        '#10b981' :
        '#2563eb';

  if (showInstructions) {
    return (
      <Modal visible={true} animationType="slide" statusBarTranslucent>
        <View style={[
          styles.instructionModalContainer,
          { backgroundColor: bgColor, paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 24) + 16 }
        ]}>
          <StatusBar barStyle={dm ? "light-content" : "dark-content"} backgroundColor={bgColor} />
          
          <View style={styles.instructionModalHeader}>
            <View style={styles.instructionIconHeaderCircle}>
              <Ionicons name="scan-circle-outline" size={52} color="#2563eb" />
            </View>
            <Text style={[styles.instructionModalTitle, { color: textColor }]}>
              Indicaciones de Registro
            </Text>
            <Text style={[styles.instructionModalSubtitle, { color: dm ? '#94a3b8' : '#64748b' }]}>
              Sigue estos consejos para un registro rápido y seguro
            </Text>
          </View>
          
          <ScrollView style={styles.instructionModalBody} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* Indicación 1: Gorra/Lentes */}
            <View style={[styles.instructionModalCard, { backgroundColor: tipBg }]}>
              <Ionicons name="glasses-outline" size={22} color={dm ? '#60a5fa' : '#2563eb'} style={styles.cardIcon} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Sin gorras ni accesorios</Text>
                <Text style={[styles.cardDesc, { color: dm ? '#94a3b8' : '#64748b' }]}>
                  Retira gorras, capuchas o lentes de sol. Tu rostro debe estar totalmente despejado.
                </Text>
              </View>
            </View>

            {/* Indicación 2: Iluminación */}
            <View style={[styles.instructionModalCard, { backgroundColor: tipBg }]}>
              <Ionicons name="sunny-outline" size={22} color={dm ? '#60a5fa' : '#2563eb'} style={styles.cardIcon} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Busca buena iluminación</Text>
                <Text style={[styles.cardDesc, { color: dm ? '#94a3b8' : '#64748b' }]}>
                  Usa luz frontal. Evita estar a contraluz o tener sombras marcadas sobre tu cara.
                </Text>
              </View>
            </View>

            {/* Indicación 3: Ojos abiertos */}
            <View style={[styles.instructionModalCard, { backgroundColor: tipBg }]}>
              <Ionicons name="eye-outline" size={22} color={dm ? '#60a5fa' : '#2563eb'} style={styles.cardIcon} />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Ojos abiertos y al frente</Text>
                <Text style={[styles.cardDesc, { color: dm ? '#94a3b8' : '#64748b' }]}>
                  Mira fijamente a la cámara y mantén los ojos bien abiertos al capturar.
                </Text>
              </View>
            </View>


          </ScrollView>
          
          <View style={styles.instructionModalFooter}>
            <TouchableOpacity 
              style={styles.instructionStartBtn} 
              onPress={() => setShowInstructions(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.instructionStartBtnText}>Comenzar Registro</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.instructionCancelBtn, { borderColor: dm ? '#334155' : '#cbd5e1' }]} 
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.instructionCancelBtnText, { color: dm ? '#94a3b8' : '#64748b' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={true} animationType="fade" statusBarTranslucent>
      <View style={styles.fullScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        { }
        <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor }]} />
        { }
        <View style={styles.cameraOval}>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            faceDetectionCallback={handleFaceDetection}
            faceDetectionOptions={faceDetectionOptions} />
        </View>
        { }
        <View style={styles.ovalContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.oval,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: ovalBorderColor
              }]
            } />
          {countdown &&
            <Text style={styles.countdownText}>{countdown}</Text>
          }
          {isValidating &&
            <ActivityIndicator size="large" color="#2563eb" style={styles.validatingIndicator} />
          }
        </View>
        { }
        <TouchableOpacity
          style={[styles.closeButton, {
            top: closeTop,
            backgroundColor: closeBtnBg
          }]}
          onPress={onCancel}
          disabled={isProcessing || isValidating}
          activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={closeIconClr} />
        </TouchableOpacity>
        { }
        <View style={[styles.instructionContainer, { top: closeTop + 56 }]} pointerEvents="none">
          <View style={[
            styles.instructionBadge,
            countdown && styles.instructionBadgeCountdown,
            isValidating && styles.instructionBadgeValidating,
            faceDetected && !countdown && !isValidating && styles.instructionBadgeDetected]
          }>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        </View>
        { }

        {/* Captura automática: no hay botón manual para evitar saltarse la validación de liveness */}
        {(isProcessing || isValidating || countdown) &&
          <View style={styles.bottomContainer}>
            <View style={styles.captureStatusContainer}>
              <ActivityIndicator size="small" color={dm ? '#60a5fa' : '#2563eb'} />
              <Text style={[styles.helpText, { color: textColor, marginTop: 8 }]}>
                {isProcessing
                  ? 'Procesando...'
                  : isValidating
                  ? 'Analizando rostro...'
                  : countdown
                  ? `Capturando en ${countdown}...`
                  : ''}
              </Text>
            </View>
          </View>
        }

        <CustomAlert
          visible={alertModal.visible}
          title={alertModal.title}
          message={alertModal.message}
          actions={alertModal.actions}
          darkMode={darkMode}
          onClose={() => setAlertModal(prev => ({ ...prev, visible: false }))}
        />
      </View>
    </Modal>);
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  cameraOval: {
    position: 'absolute',
    top: OVAL_TOP,
    left: OVAL_LEFT,
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    borderRadius: OVAL_WIDTH / 1.5,
    overflow: 'hidden',
    zIndex: 1
  },
  ovalContainer: {
    position: 'absolute',
    top: OVAL_TOP,
    left: OVAL_LEFT,
    width: OVAL_WIDTH,
    height: OVAL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3
  },
  oval: {
    width: '100%',
    height: '100%',
    borderRadius: OVAL_WIDTH / 1.5,
    borderWidth: 4,
    backgroundColor: 'transparent'
  },
  validatingIndicator: {
    position: 'absolute'
  },
  countdownText: {
    position: 'absolute',
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20
  },
  flashButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20
  },
  instructionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10
  },
  instructionBadge: {
    backgroundColor: 'rgba(59,130,246,0.92)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    maxWidth: '90%',
    elevation: 3
  },
  instructionBadgeCountdown: { backgroundColor: 'rgba(16,185,129,0.95)' },
  instructionBadgeValidating: { backgroundColor: 'rgba(245,158,11,0.95)' },
  instructionBadgeDetected: { backgroundColor: 'rgba(16,185,129,0.92)' },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  tipsContainer: {
    position: 'absolute',
    top: OVAL_BOTTOM + 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 10
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.07)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8
  },
  tipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500'
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10
  },
  captureStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  helpText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center'
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center'
  },
  permissionSubtext: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center'
  },
  cancelButton: {
    marginTop: 24,
    backgroundColor: '#ef4444',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  
  // Novedades para el Modal de Indicaciones Premium
  instructionModalContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionIconHeaderCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  instructionModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  instructionModalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  instructionModalBody: {
    flex: 1,
  },
  instructionModalCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  cardIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  instructionModalFooter: {
    paddingTop: 12,
    gap: 10,
  },
  instructionStartBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionStartBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  instructionCancelBtn: {
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  }
});