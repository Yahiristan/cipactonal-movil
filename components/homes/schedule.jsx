import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable
} from
  'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getHorarioPorEmpleado,
  parsearHorario,
  calcularResumenSemanal,
  getInfoDiaActual
} from
  '../../services/horariosService';
import { getAsistenciasEmpleado } from '../../services/asistenciasService';
import { IncidenciasScreen } from '../settingsPages/IncidentScreen';
import sqliteManager from '../../services/offline/sqliteManager.mjs';
import syncManager from '../../services/offline/syncManager.mjs';
import { scheduleStyles, scheduleStylesDark } from './scheduleStyles';

export const ScheduleScreen = ({ darkMode, userData }) => {
  const [scheduleData, setScheduleData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resumen, setResumen] = useState({ diasLaborales: 0, totalDias: 7, horasTotales: '0' });
  const [infoHoy, setInfoHoy] = useState({ trabaja: false, entrada: null, salida: null, turnos: [] });
  const [diaFestivo, setDiaFestivo] = useState(null);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showIncidencias, setShowIncidencias] = useState(false);

  const insets = useSafeAreaInsets();
  const styles = darkMode ? scheduleStylesDark : scheduleStyles;

  const obtenerTurnoRelevante = (turnos) => {
    if (!turnos || turnos.length === 0) return null;

    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

    const convertirAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(Number);
      return h * 60 + m;
    };

    for (const turno of turnos) {
      const inicio = convertirAMinutos(turno.entrada);
      const fin = convertirAMinutos(turno.salida);

      if (horaActual >= inicio && horaActual <= fin) {
        return { ...turno, estado: 'activo' };
      }
    }


    for (const turno of turnos) {
      const inicio = convertirAMinutos(turno.entrada);

      if (horaActual < inicio) {
        return { ...turno, estado: 'proximo' };
      }
    }
    return null;
  };

  const formatearRangoTiempo = (turno) => {
    if (!turno) return '---';
    return `${turno.entrada} - ${turno.salida}`;
  };




  const obtenerInfoHoyMejorada = (horarioParsed) => {
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    const nombreHoy = diasSemana[hoy.getDay()];

    const diaHoy = horarioParsed.find((d) => d.day === nombreHoy);

    if (!diaHoy || !diaHoy.active || !diaHoy.turnos || diaHoy.turnos.length === 0) {
      return { trabaja: false, turnos: [], turnoRelevante: null };
    }

    const turnoRelevante = obtenerTurnoRelevante(diaHoy.turnos);

    return {
      trabaja: true,
      turnos: diaHoy.turnos,
      turnoRelevante: turnoRelevante,
      tipo: diaHoy.tipo
    };
  };



  const getEmpleadoId = () => {
    if (userData?.empleado_id) return userData.empleado_id;
    if (userData?.empleadoInfo?.id) return userData.empleadoInfo.id;
    return null;
  };

  const cargarHorario = async (empleadoId) => {
    try {
      setIsLoading(true);
      setError(null);

      let horario = null;
      const online = await syncManager.isOnline() && !syncManager.getIsBackendDown();
      
      const now = new Date();
      const fechaInicio = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString().split('T')[0];
      const fechaFin = new Date(now.setDate(now.getDate() + 6)).toISOString().split('T')[0];
      let asistenciasSemana = [];
        
      if (online) {
        try {
          horario = await getHorarioPorEmpleado(empleadoId, userData?.token);
          
          try {
             const asisData = await getAsistenciasEmpleado(empleadoId, userData?.token, { fecha_inicio: fechaInicio, fecha_fin: fechaFin });
             if (asisData && asisData.data) {
                asistenciasSemana = asisData.data;
             }
           } catch(e) {
             console.log("Error fetching asistencias online", e.message);
           }
           
           try {
               const offlinePending = await sqliteManager.getPendingAsistencias();
               const misPending = offlinePending.filter(a => a.empleado_id === empleadoId && a.fecha_registro >= fechaInicio && a.fecha_registro <= fechaFin + 'T23:59:59');
               
               const onlineTiempos = new Set(asistenciasSemana.map(a => a.fecha_registro));
               misPending.forEach(p => {
                   if (!onlineTiempos.has(p.fecha_registro)) {
                       asistenciasSemana.push(p);
                   }
               });
           } catch(e) {
               console.log("Error sumando offline pending:", e.message);
           }
        } catch (e) {
          console.log('Online fetch failed for schedule:', e.message);
        }
      }


      if (!horario) {
        (function () { })('Trying offline schedule...');
        const hLocal = await sqliteManager.getHorario(empleadoId);
        if (hLocal) {
          horario = hLocal;
          (function () { })('Loaded offline schedule');
        }
      }

      if (!horario) {
        throw new Error('No se recibió información del horario (ni online ni offline)');
      }

      const horarioParsed = parsearHorario(horario);
      setScheduleData(horarioParsed);
      
      const resumenCalculado = calcularResumenSemanal(horarioParsed);
      
      let horasCumplidas = 0;
      try {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        
        const primerDia = new Date(now.getTime());
        const diaSemana = now.getDay(); 
        const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
        primerDia.setDate(now.getDate() + diffLunes);
        primerDia.setHours(0, 0, 0, 0);
        
        const ultimoDia = new Date(primerDia.getTime());
        ultimoDia.setDate(primerDia.getDate() + 6);
        ultimoDia.setHours(23, 59, 59, 999);
        
        const fI = new Date(primerDia.getTime() - tzOffset).toISOString().split('T')[0];
        const fF = new Date(ultimoDia.getTime() - tzOffset).toISOString().split('T')[0];
        
        const fechaInicio = fI + ' 00:00:00';
        const fechaFin = fF + ' 23:59:59';
        
        let asistenciasSemana = [];
        
        if (online) {
           try {
             const asisData = await getAsistenciasEmpleado(empleadoId, userData?.token, { fecha_inicio: fechaInicio, fecha_fin: fechaFin });
             if (asisData && asisData.data) {
                asistenciasSemana = asisData.data;
             }
           } catch(e) {
             console.log("Error fetching asistencias online", e.message);
           }
           
           try {
               const offlinePending = await sqliteManager.getPendingAsistencias();
               const misPending = offlinePending.filter(a => {
                   if (a.empleado_id !== empleadoId) return false;
                   const fechaSoloDia = (a.fecha_registro || '').substring(0, 10);
                   return fechaSoloDia >= fI && fechaSoloDia <= fF;
               });
               
               const onlineTiempos = new Set(asistenciasSemana.map(a => a.fecha_registro));
               misPending.forEach(p => {
                   if (!onlineTiempos.has(p.fecha_registro)) {
                       asistenciasSemana.push(p);
                   }
               });
           } catch(e) {
               console.log("Error sumando offline pending:", e.message);
           }
        } else {
           const mesKey = fI.substring(0, 7);
           const mesKeyFin = fF.substring(0, 7);
           let cached = await sqliteManager.getAsistenciasMesLocal(empleadoId, mesKey);
           if (mesKey !== mesKeyFin) {
               const cachedFin = await sqliteManager.getAsistenciasMesLocal(empleadoId, mesKeyFin);
               cached = [...(cached || []), ...(cachedFin || [])];
           }
           const offlinePending = await sqliteManager.getPendingAsistencias();
           const misPending = offlinePending.filter(a => a.empleado_id === empleadoId);
           
           const todas = [...(cached || []), ...misPending];
           asistenciasSemana = todas.filter(a => {
               const fechaSoloDia = (a.fecha_registro || '').substring(0, 10);
               return fechaSoloDia >= fI && fechaSoloDia <= fF;
           });
        }
        
        if (asistenciasSemana.length > 0) {
            const sorted = [...asistenciasSemana].sort((a, b) => {
                const da = new Date((a.fecha_registro || '').replace(' ', 'T'));
                const db = new Date((b.fecha_registro || '').replace(' ', 'T'));
                return da - db;
            });
            
            let currentEntrada = null;
            sorted.forEach(registro => {
               const rTipo = String(registro.tipo || '').toLowerCase().trim();
               if (rTipo === 'entrada') {
                   currentEntrada = new Date((registro.fecha_registro || '').replace(' ', 'T'));
               } else if (rTipo === 'salida' && currentEntrada) {
                   const salida = new Date((registro.fecha_registro || '').replace(' ', 'T'));
                   const diff = (salida - currentEntrada) / (1000 * 60 * 60);
                   if (diff > 0 && diff < 24) {
                       horasCumplidas += diff;
                   }
                   currentEntrada = null;
               }
            });
            
            if (currentEntrada) {
                const ahora = new Date();
                const diff = (ahora - currentEntrada) / (1000 * 60 * 60);
                if (diff > 0 && diff < 16) { 
                    horasCumplidas += diff;
                }
            }
        }
      } catch (e) {
          console.log("Error calculando horas cumplidas:", e.message);
      }

      setResumen({ ...resumenCalculado, horasCumplidas });
      setInfoHoy(obtenerInfoHoyMejorada(horarioParsed));

      const tzDate = new Date();
      const tzOffset = tzDate.getTimezoneOffset() * 60000;
      const hoyStr = new Date(tzDate.getTime() - tzOffset).toISOString().split('T')[0];
      const festivoLocal = await sqliteManager.getDiaFestivo(hoyStr);
      if (festivoLocal) {
        setDiaFestivo(festivoLocal);
      } else {
        setDiaFestivo(null);
      }

    } catch (error) {
      setError(error.message || 'Error desconocido al cargar horario');
      setScheduleData(obtenerHorarioVacio());
      setResumen({ diasLaborales: 0, totalDias: 7, horasTotales: '0' });
      setInfoHoy({ trabaja: false, turnos: [], turnoRelevante: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const empleadoId = getEmpleadoId();

    if (empleadoId) {
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setError('La carga del horario está tomando demasiado tiempo. Verifica tu conexión.');
          setIsLoading(false);
          setScheduleData(obtenerHorarioVacio());
        }
      }, 10000);

      cargarHorario(empleadoId).finally(() => clearTimeout(timeoutId));
      return () => clearTimeout(timeoutId);
    } else {
      setIsLoading(false);
      setError('No se pudo identificar al empleado. Verifica tu sesión.');
      setScheduleData(obtenerHorarioVacio());
    }
  }, [userData]);


  useEffect(() => {
    if (!scheduleData.length) return;

    const interval = setInterval(() => {
      setInfoHoy(obtenerInfoHoyMejorada(scheduleData));
    }, 60000);

    return () => clearInterval(interval);
  }, [scheduleData]);

  const onRefresh = async () => {
    const empleadoId = getEmpleadoId();
    if (empleadoId) {
      setRefreshing(true);
      await cargarHorario(empleadoId);
      setRefreshing(false);
    }
  };

  const obtenerHorarioVacio = () => {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias.map((day) => ({
      day,
      active: false,
      location: 'Sin configurar',
      time: '---',
      hours: '',
      turnos: []
    }));
  };



  const obtenerFechaSemana = () => {
    const hoy = new Date();
    const primerDia = new Date(hoy);
    primerDia.setDate(hoy.getDate() - hoy.getDay() + 1);

    const ultimoDia = new Date(primerDia);
    ultimoDia.setDate(primerDia.getDate() + 6);

    const formatoFecha = (fecha) => {
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
    };

    return `${formatoFecha(primerDia)} - ${formatoFecha(ultimoDia)}`;
  };

  const getDayInitial = (day) => {
    const initials = {
      'Lunes': 'L',
      'Martes': 'M',
      'Miércoles': 'MI',
      'Jueves': 'J',
      'Viernes': 'V',
      'Sábado': 'S',
      'Domingo': 'D'
    };
    return initials[day] || 'X';
  };

  const handleDayPress = async (day) => {
    // Verificar si el día presionado coincide con la fecha de algún festivo
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoy = new Date();
    const hoyIdx = hoy.getDay();
    const targetIdx = diasSemana.indexOf(day.day);

    // Calcular la fecha del día clickeado en base a la semana actual
    let diff = targetIdx - hoyIdx;
    const targetDate = new Date(hoy);
    targetDate.setDate(hoy.getDate() + diff);
    const tzOffset = targetDate.getTimezoneOffset() * 60000;
    const targetDateStr = new Date(targetDate.getTime() - tzOffset).toISOString().split('T')[0];

    const festivoLocal = await sqliteManager.getDiaFestivo(targetDateStr);

    setSelectedDay({ ...day, festivo: festivoLocal });
    setModalVisible(true);
  };



  if (showIncidencias) {
    return (
      <IncidenciasScreen
        userData={userData}
        darkMode={darkMode}
        onBack={() => setShowIncidencias(false)} />);


  }

  return (
    <View style={styles.mainContainer}>
      {isLoading ?
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View> :

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, paddingBottom: 80 + insets.bottom }]
          }
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563eb" />

          }>

          {error &&
            <View style={styles.errorCard}>
              <View style={styles.errorIcon}>
                <Ionicons name="alert-circle" size={24} color="#ef4444" />
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          }

          { }
          {diaFestivo ?
            <View style={styles.dayOffCard}>
              <View style={styles.dayOffIcon}>
                <Ionicons name="calendar-outline" size={48} color={darkMode ? "#60a5fa" : "#2563eb"} />
              </View>
              <Text style={styles.dayOffTitle}>Día Festivo</Text>
              <Text style={styles.dayOffText}>{diaFestivo.nombre}</Text>
            </View> :
            infoHoy.trabaja && infoHoy.turnoRelevante ?
              <View style={styles.todayCard}>
                <View style={styles.todayHeader}>
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>
                      {infoHoy.turnoRelevante.estado === 'activo' ? 'ACTIVO' : 'SIGUIENTE'}
                    </Text>
                  </View>
                  <Text style={styles.todayDate}>
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </Text>
                </View>

                { }
                <View style={styles.currentShiftContainer}>
                  <View style={styles.shiftTimeRow}>
                    <View style={styles.shiftTimeBlock}>
                      <Ionicons name="time-outline" size={24} color={darkMode ? "#60a5fa" : "#2563eb"} />
                      <View style={styles.shiftTimeInfo}>
                        <Text style={styles.shiftLabel}>
                          {infoHoy.turnoRelevante.estado === 'activo' ? 'En turno' : 'Próximo turno'}
                        </Text>
                        <Text style={styles.shiftTime}>
                          {formatearRangoTiempo(infoHoy.turnoRelevante)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  { }
                  {infoHoy.turnos.length > 1 &&
                    <TouchableOpacity
                      style={styles.moreTurnsButton}
                      onPress={() => {
                        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const nombreHoy = diasSemana[new Date().getDay()];
                        const diaHoy = scheduleData.find((d) => d.day === nombreHoy);
                        handleDayPress(diaHoy);
                      }}>

                      <Ionicons name="albums-outline" size={18} color={darkMode ? "#60a5fa" : "#2563eb"} />
                      <Text style={styles.moreTurnsText}>
                        Ver tus {infoHoy.turnos.length} turnos de hoy
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color={darkMode ? "#60a5fa" : "#2563eb"} />
                    </TouchableOpacity>
                  }
                </View>
              </View> :
              infoHoy.trabaja ?
                <View style={styles.todayCard}>
                  <View style={styles.todayHeader}>
                    <View style={[styles.todayBadge, { backgroundColor: '#6b7280' }]}>
                      <Text style={styles.todayBadgeText}>FINALIZADO</Text>
                    </View>
                    <Text style={styles.todayDate}>
                      {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                  <Text style={styles.finishedText}>Todos los turnos de hoy han finalizado</Text>
                </View> :

                <View style={styles.dayOffCard}>
                  <View style={styles.dayOffIcon}>
                    <Ionicons name="cafe-outline" size={48} color={darkMode ? "#60a5fa" : "#2563eb"} />
                  </View>
                  <Text style={styles.dayOffTitle}>Día de Descanso</Text>
                  <Text style={styles.dayOffText}>Disfruta tu día libre</Text>
                </View>
          }

          { }
          <Text style={styles.sectionLabel}>RESUMEN SEMANAL</Text>
          <View style={styles.sectionContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="time-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                <Text style={styles.settingTitle}>Horas Totales</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{resumen.horasTotales}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="checkmark-circle-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                <Text style={styles.settingTitle}>Horas Cumplidas</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{(resumen.horasCumplidas || 0).toFixed(1)}h</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="calendar-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                <Text style={styles.settingTitle}>Días Laborales</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{resumen.diasLaborales}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>PROGRESO SEMANAL</Text>
          <View style={styles.sectionContainer}>
            <View style={[styles.settingItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={styles.settingLeft}>
                  <Ionicons name="stats-chart" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                  <Text style={styles.settingTitle}>Progreso actual</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>
                    {(resumen.horasCumplidas || 0).toFixed(1)} <Text style={styles.settingTitleSecondary}>/ {resumen.horasTotales}h</Text>
                  </Text>
                </View>
              </View>
              
              <View style={{ height: 8, backgroundColor: darkMode ? '#334155' : '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                 <View style={{
                   height: '100%',
                   backgroundColor: '#2563eb',
                   borderRadius: 4,
                   width: `${Math.min(100, ((resumen.horasCumplidas || 0) / (parseFloat(resumen.horasTotales) || 1)) * 100)}%`
                 }} />
              </View>
              <Text style={[styles.settingTitleSecondary, { textAlign: 'right', marginTop: 8, fontSize: 12 }]}>
                 {Math.min(100, ((resumen.horasCumplidas || 0) / (parseFloat(resumen.horasTotales) || 1)) * 100).toFixed(0)}% completado
              </Text>
            </View>
          </View>

          { }
          <Text style={styles.sectionLabel}>HORARIO SEMANAL</Text>
          <View style={[styles.sectionContainer, { paddingVertical: 0, overflow: 'hidden' }]}>
            {scheduleData.map((schedule, index) => {
              const isLast = index === scheduleData.length - 1;
              const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
              const hoy = new Date();
              const diaActual = diasSemana[hoy.getDay()];
              const isToday = schedule.day.toLowerCase() === diaActual;


              let turnoMostrar = '---';
              let tieneMasTurnos = false;

              if (schedule.active && schedule.turnos && schedule.turnos.length > 0) {
                if (isToday) {

                  const turnoRelevante = obtenerTurnoRelevante(schedule.turnos);
                  turnoMostrar = turnoRelevante ? formatearRangoTiempo(turnoRelevante) : formatearRangoTiempo(schedule.turnos[0]);
                } else {

                  turnoMostrar = formatearRangoTiempo(schedule.turnos[0]);
                }
                tieneMasTurnos = schedule.turnos.length > 1;
              }

              return (
                <View key={index}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDayPress(schedule)}
                    style={[
                      styles.settingItem,
                      !schedule.active && styles.scheduleItemInactive,
                      isToday && styles.scheduleItemToday
                    ]}>

                  <View style={styles.scheduleLeft}>
                    <View style={[
                      styles.dayIconContainer,
                      schedule.active ? styles.dayIconActive : styles.dayIconInactive,
                      isToday && styles.dayIconToday
                    ]}>
                      <Text style={[
                        styles.dayInitialText,
                        schedule.active ? styles.dayInitialActive : styles.dayInitialInactive,
                        isToday && styles.dayInitialToday
                      ]}>
                        {getDayInitial(schedule.day)}
                      </Text>
                    </View>
                    <View style={styles.scheduleInfo}>
                      <View style={styles.scheduleTopRow}>
                        <Text style={[
                          styles.scheduleDay,
                          !schedule.active && styles.scheduleDayInactive]
                        }>
                          {schedule.day}
                        </Text>
                      </View>

                      {tieneMasTurnos &&
                        <Text style={{ fontSize: 12, color: darkMode ? '#9ca3af' : '#64748b', marginTop: 2 }}>
                          {schedule.turnos.length} turnos en total
                        </Text>
                      }
                    </View>
                  </View>

                  <View style={styles.scheduleRight}>
                    <Text style={[
                      styles.scheduleTime,
                      !schedule.active && styles.scheduleTimeInactive]
                    }>
                      {turnoMostrar}
                    </Text>

                    {schedule.active &&
                      <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={{ marginTop: 4 }} />
                    }
                  </View>
                </TouchableOpacity>
                {!isLast && <View style={styles.divider} />}
              </View>);

            })}
          </View>

          { }
          {userData?.es_empleado && userData?.empleado_id &&
            <>
              <Text style={styles.sectionLabel}>GESTIÓN</Text>
              <View style={styles.sectionContainer}>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() => setShowIncidencias(true)}
                  activeOpacity={0.7}>

                  <View style={styles.settingLeft}>
                    <Ionicons name="document-text-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} style={styles.settingIcon} />
                    <View>
                      <Text style={styles.settingTitle}>Incidencias</Text>
                      <Text style={styles.settingTitleSecondary}>Justificantes y permisos</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </>
          }
        </ScrollView>
      }

      { }
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>

        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)} />

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDay?.day}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDay?.active ? 'Turnos del día' : 'Día de descanso'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}>

                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never">

              {selectedDay?.festivo && (
                <View style={{ marginBottom: 16, backgroundColor: darkMode ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2563eb' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={24} color={darkMode ? "#60a5fa" : "#2563eb"} />
                    <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: darkMode ? "#60a5fa" : "#2563eb" }}>
                      Día Festivo: {selectedDay.festivo.nombre}
                    </Text>
                  </View>
                  <Text style={{ color: darkMode ? '#e2e8f0' : '#475569', fontSize: 14 }}>
                    El sistema indica que este es un día festivo. Si te asignaron turno por error, por favor notifica a tu administrador para que retire este horario, ya que el registro de asistencia estará deshabilitado.
                  </Text>
                </View>
              )}

              {selectedDay?.active && selectedDay?.turnos?.length > 0 ?
                selectedDay.turnos.map((turno, idx) =>
                  <View key={idx} style={styles.modalTurnoBlock}>
                    <Text style={styles.modalTurnoTitle}>Turno {idx + 1}</Text>
                    <View style={styles.modalTurnoDetails}>
                      <View style={styles.modalTurnoTimeContainer}>
                        <View style={[styles.modalTurnoIconWrapper, { backgroundColor: darkMode ? '#334155' : '#f1f5f9' }]}>
                           <Ionicons name="log-in-outline" size={20} color={darkMode ? '#cbd5e1' : '#475569'} />
                        </View>
                        <Text style={styles.modalTurnoLabel}>Entrada</Text>
                        <Text style={styles.modalTurnoTime}>{turno.entrada}</Text>
                      </View>

                      <View style={styles.modalTurnoArrow}>
                        <Ionicons name="arrow-forward" size={20} color={darkMode ? '#ffffff' : '#000000'} />
                      </View>

                      <View style={styles.modalTurnoTimeContainer}>
                        <View style={[styles.modalTurnoIconWrapper, { backgroundColor: darkMode ? '#334155' : '#f1f5f9' }]}>
                           <Ionicons name="log-out-outline" size={20} color={darkMode ? '#cbd5e1' : '#475569'} />
                        </View>
                        <Text style={styles.modalTurnoLabel}>Salida</Text>
                        <Text style={styles.modalTurnoTime}>{turno.salida}</Text>
                      </View>
                    </View>
                  </View>
                ) :

                !selectedDay?.festivo && (
                  <View style={styles.modalEmptyState}>
                    <Ionicons name="cafe-outline" size={48} color="#9ca3af" />
                    <Text style={styles.modalEmptyText}>No hay turnos programados</Text>
                  </View>
                )
              }
            </ScrollView>

            {selectedDay?.active &&
              <View style={styles.modalFooter}>
                <View style={styles.modalFooterInfo}>
                  <Ionicons name="time-outline" size={16} color="#6b7280" />
                  <Text style={styles.modalFooterText}>
                    Total: {selectedDay?.hours || '0h'}
                  </Text>
                </View>
              </View>
            }
          </View>
        </View>
      </Modal>
    </View>);

};



export default ScheduleScreen;