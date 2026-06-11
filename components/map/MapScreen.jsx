import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions
} from
  'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { extraerCoordenadas } from '../../services/ubicacionService';
import { getCentroPoligono, calcularDistancia } from '../../services/ubicacionService';
import { useNavigationBarColor } from '../../services/useNavigationBarColor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Distancia del usuario al centroide del polígono de un departamento (metros).
// Usa extraerCoordenadas y getCentroPoligono del servicio oficial para que el
// parseo sea idéntico al del resto del sistema.
// Devuelve Infinity si no hay GPS o no se pueden extraer coordenadas.
const distanciaAlDepto = (depto, userLat, userLng) => {
  if (userLat == null || userLng == null || !depto.ubicacion) return Infinity;
  try {
    const coords = extraerCoordenadas(depto.ubicacion);
    if (!coords || coords.length === 0) return Infinity;

    // MultiPolygon: array de arrays → aplanar para el centroide
    const puntos = Array.isArray(coords[0]) && !('lat' in coords[0])
      ? coords.flat(1)
      : coords;

    const centro = getCentroPoligono(puntos);
    if (!centro) return Infinity;

    return calcularDistancia({ lat: userLat, lng: userLng }, centro);
  } catch {
    return Infinity;
  }
};


const MapaZonasPermitidas = ({
  departamento,
  departamentos = [],
  ubicacionActual,
  onClose,
  onDepartamentoSeleccionado,
  darkMode
}) => {
  const [loading, setLoading] = useState(true);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState(null);
  const [zonasData, setZonasData] = useState([]);
  const [mostrandoMiUbicacion, setMostrandoMiUbicacion] = useState(false);
  const webViewRef = useRef(null);

  const styles = darkMode ? mapStylesDark : mapStyles;

  // Guardamos la ubicación al momento de abrir el mapa para el HTML inicial.
  // El GPS puede seguir actualizando via postMessage sin recrear el WebView.
  const ubicacionInicialRef = useRef(ubicacionActual);

  // Ref mutable que siempre apunta a la ubicación más reciente sin ser
  // dependencia del useMemo (evita recargar el WebView en cada tick de GPS).
  const ubicacionActualRef = useRef(ubicacionActual);
  useEffect(() => { ubicacionActualRef.current = ubicacionActual; }, [ubicacionActual]);

  useNavigationBarColor(darkMode);


  // Ordenar departamentos por distancia al usuario (más cercano primero).
  // Los que no tienen ubicación o el usuario no tiene GPS van al final.
  const userLat = ubicacionActual?.lat ?? null;
  const userLng = ubicacionActual?.lng ?? null;

  const listaDepartamentos = useMemo(() => {
    const base = departamentos.length > 0
      ? departamentos
      : departamento ? [departamento] : [];

    const initLat = ubicacionInicialRef.current?.lat;
    const initLng = ubicacionInicialRef.current?.lng;

    if (initLat == null || initLng == null) return base; // sin GPS: orden original

    return [...base].sort((a, b) =>
      distanciaAlDepto(a, initLat, initLng) - distanciaAlDepto(b, initLat, initLng)
    );
  }, [departamentos, departamento]);

  useEffect(() => {
    if (!listaDepartamentos.length) return;
    // Si ya hay un departamento específico solicitado, usarlo;
    // de lo contrario usar el primero de la lista (que ya está ordenado por distancia).
    setDepartamentoSeleccionado(departamento ?? listaDepartamentos[0]);
  }, [departamento, listaDepartamentos]);

  useEffect(() => {
    if (listaDepartamentos.length === 0) {
      setLoading(false);
      return;
    }

    try {

      const zonas = [];

      for (const depto of listaDepartamentos) {
        if (!depto.ubicacion) continue;

        const coords = extraerCoordenadas(depto.ubicacion);
        if (!coords || coords.length === 0) continue;

        let coordsFormateadas;
        const isMultiPolygon = Array.isArray(coords[0]);

        if (isMultiPolygon) {
          coordsFormateadas = coords.map(poly => poly.map(coord => {
            const lat = coord.lat || coord[0];
            const lng = coord.lng || coord[1];
            return [lat, lng];
          }));
        } else {
          coordsFormateadas = coords.map((coord) => {
            const lat = coord.lat || coord[0];
            const lng = coord.lng || coord[1];
            return [lat, lng];
          });
        }

        zonas.push({
          id: depto.id,
          nombre: depto.nombre,
          coordenadas: coordsFormateadas,
          esMultiPolygon: isMultiPolygon,
          color: depto.color || '#3b82f6'
        });
      }

      setZonasData(zonas);
      setLoading(false);

    } catch (error) {
      setLoading(false);
    }
  }, [listaDepartamentos]);


  useEffect(() => {
    if (webViewRef.current && ubicacionActual) {
      const message = JSON.stringify({
        action: 'updateUserLocation',
        location: [ubicacionActual.lat, ubicacionActual.lng]
      });
      webViewRef.current.postMessage(message);
    }
  }, [ubicacionActual]);

  const handleDepartamentoClick = (depto) => {
    setDepartamentoSeleccionado(depto);
    setMostrandoMiUbicacion(false);

    if (onDepartamentoSeleccionado) {
      onDepartamentoSeleccionado(depto);
    }


    const zona = zonasData.find((z) => z.id === depto.id);
    if (zona && webViewRef.current) {

      const sumLat = zona.coordenadas.reduce((sum, c) => sum + c[0], 0);
      const sumLng = zona.coordenadas.reduce((sum, c) => sum + c[1], 0);
      const centerLat = sumLat / zona.coordenadas.length;
      const centerLng = sumLng / zona.coordenadas.length;


      const message = JSON.stringify({
        action: 'focusDepartamento',
        departamentoId: depto.id,
        center: [centerLat, centerLng]
      });

      webViewRef.current.postMessage(message);
    }
  };

  const handleFocusUserLocation = () => {
    setMostrandoMiUbicacion(true);

    if (webViewRef.current && ubicacionActual) {
      const message = JSON.stringify({
        action: 'focusUserLocation',
        center: [ubicacionActual.lat, ubicacionActual.lng]
      });
      webViewRef.current.postMessage(message);
    }
  };

  const generarHTMLLeaflet = (zonas, userLocation, departamentoSeleccionadoId) => {
    const zonasJSON = JSON.stringify(zonas);
    const userLocationJSON = userLocation ? JSON.stringify([userLocation.lat, userLocation.lng]) : 'null';

    const selectedId = departamentoSeleccionadoId ? `"${departamentoSeleccionadoId}"` : 'null';


    let totalLat = 0;
    let totalLng = 0;
    let totalPuntos = 0;

    zonas.forEach((zona) => {
      if (zona.esMultiPolygon) {
        zona.coordenadas.forEach(poly => {
          poly.forEach(coord => {
            totalLat += coord[0];
            totalLng += coord[1];
            totalPuntos++;
          });
        });
      } else {
        zona.coordenadas.forEach((coord) => {
          totalLat += coord[0];
          totalLng += coord[1];
          totalPuntos++;
        });
      }
    });

    let centerLat = totalPuntos > 0 ? totalLat / totalPuntos : NaN;
    let centerLng = totalPuntos > 0 ? totalLng / totalPuntos : NaN;

    if (isNaN(centerLat) || isNaN(centerLng)) {
      if (userLocation) {
        centerLat = userLocation.lat;
        centerLng = userLocation.lng;
      } else {
        // Default to Mexico City if no user location and no zones
        centerLat = 19.4326;
        centerLng = -99.1332;
      }
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Mapa de Zonas Permitidas</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #map {
      height: 100%;
      width: 100%;
    }
    /* Leaflet user marker */
    .user-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #ef4444;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script>
    // ========== DATA ==========
    var zonas = ${zonasJSON};
    var userLocation = ${userLocationJSON};
    var selectedDepartamentoId = ${selectedId};

    // ========== TRY LEAFLET (ONLINE) ==========
    var leafletScript = document.createElement('script');
    leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    leafletScript.onload = function() {
      initLeafletMap();
    };

    var leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    document.head.appendChild(leafletCSS);
    document.body.appendChild(leafletScript);

    // ========== LEAFLET MAP (ONLINE) ==========
    function initLeafletMap() {
      var map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([${centerLat}, ${centerLng}], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualrQAAAABJRU5ErkJggg=='
      }).addTo(map);

      var polygons = {};

      function updatePolygonStyles() {
        zonas.forEach(function(zona) {
          var isSelected = zona.id === selectedDepartamentoId;
          var polygon = polygons[zona.id];
          if (polygon) {
            polygon.setStyle({
              color: isSelected ? '#10b981' : '#3b82f6',
              fillColor: isSelected ? '#10b981' : '#3b82f6',
              fillOpacity: 0.3,
              weight: 3,
              opacity: 0.8
            });
            if (isSelected) polygon.bringToFront();
          }
        });
      }

      var bounds = [];

      zonas.forEach(function(zona) {
        var isSelected = selectedDepartamentoId === zona.id;
        var polygon; // referiremos genéricamente como polygon localmente

        // Filtrar puntos duplicados exactos (para evitar poligonos de area 0)
        var uniqueCoords = [];
        var handlePoly = function(arr) {
          var u = [];
          arr.forEach(function(c) {
            var isDuplicate = u.some(function(x) { return x[0] === c[0] && x[1] === c[1]; });
            if (!isDuplicate) u.push(c);
          });
          return u;
        };

        if (zona.esMultiPolygon) {
          // Ya viene preparado como Array de Arrays de LatLngs. 
          // Limpiamos los duplicados internamente pero pasamos directamente a Leaflet (MultiPolygon nativo)
          var cleanMulti = zona.coordenadas.map(function(p) { return handlePoly(p); });
          polygon = L.polygon(cleanMulti, {
            color: isSelected ? '#10b981' : '#3b82f6',
            fillColor: isSelected ? '#10b981' : '#3b82f6',
            fillOpacity: 0.3,
            weight: 3,
            opacity: 0.8
          }).addTo(map);
          cleanMulti.forEach(function(p) { p.forEach(function(ll) { bounds.push(ll); }); });
        } else {
          // Standard Poligono simple
          uniqueCoords = handlePoly(zona.coordenadas);
          if (uniqueCoords.length < 3) {
            var centerLat = uniqueCoords[0][0];
            var centerLng = uniqueCoords[0][1];
            polygon = L.circle([centerLat, centerLng], {
              radius: 200,
              color: isSelected ? '#10b981' : '#3b82f6',
              fillColor: isSelected ? '#10b981' : '#3b82f6',
              fillOpacity: 0.3,
              weight: 3,
              opacity: 0.8
            }).addTo(map);
            bounds.push([centerLat, centerLng]);
          } else {
            polygon = L.polygon(uniqueCoords, {
              color: isSelected ? '#10b981' : '#3b82f6',
              fillColor: isSelected ? '#10b981' : '#3b82f6',
              fillOpacity: 0.3,
              weight: 3,
              opacity: 0.8
            }).addTo(map);
            uniqueCoords.forEach(function(latlng) { bounds.push(latlng); });
          }
        }

        polygons[zona.id] = polygon;

        var popupContent = isSelected
          ? '<b>' + zona.nombre + '</b><br>Departamento seleccionado<br>Zona permitida para registro'
          : '<b>' + zona.nombre + '</b><br>Zona permitida para registro';
        polygon.bindPopup(popupContent);
      });

      if (bounds.length > 0) {
        var selectedZona = zonas.find(function(z) { return z.id === selectedDepartamentoId; });
        if (selectedZona && selectedDepartamentoId) {
          var selectedPolygon = polygons[selectedDepartamentoId];
          if (selectedPolygon) map.fitBounds(selectedPolygon.getBounds(), { padding: [50, 50], maxZoom: 16 });
        } else {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
      }

      var userMarker = null;
      if (userLocation) {
        var userIcon = L.divIcon({ className: 'user-marker', iconSize: [24, 24] });
        userMarker = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
        userMarker.bindPopup('<b>Tu ubicación</b><br>Aquí te encuentras ahora');
      }

      map.scrollWheelZoom.disable();

      function handleMessage(event) {
        try {
          var data = JSON.parse(event.data);
          if (data.action === 'focusDepartamento') {
            selectedDepartamentoId = data.departamentoId;
            updatePolygonStyles();
            var p = polygons[data.departamentoId];
            if (p) map.fitBounds(p.getBounds(), { padding: [80, 80], maxZoom: 17, animate: true, duration: 0.5 });
          } else if (data.action === 'focusUserLocation') {
            if (data.center) {
              map.setView(data.center, 17, { animate: true, duration: 0.5 });
              if (userMarker) userMarker.openPopup();
            }
          } else if (data.action === 'updateUserLocation') {
 // Actualización en tiempo real del marcador GPS 
            userLocation = data.location;
            if (userMarker) {
              userMarker.setLatLng(data.location);
            } else {
              var userIcon = L.divIcon({ className: 'user-marker', iconSize: [24, 24] });
              userMarker = L.marker(data.location, { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
              userMarker.bindPopup('<b>Tu ubicación</b><br>Aquí te encuentras ahora');
            }
          }
        } catch (e) {}
      }
      window.addEventListener('message', handleMessage);
      document.addEventListener('message', handleMessage);
    }


  </script>
</body>
</html>
    `;
  };

  // IMPORTANTE: useMemo debe estar ANTES de cualquier early return para no
  // violar las Rules of Hooks (los hooks deben llamarse siempre en el mismo orden).
  // El HTML del mapa solo se regenera cuando cambian las zonas o el departamento;
  // las actualizaciones de GPS se propagan via postMessage sin recargar el WebView.
  const htmlContent = useMemo(() => {
    // Leer del ref para obtener la ubicación más reciente sin hacer que
    // ubicacionActual sea dependencia (lo que recargaría el WebView cada 5s).
    const ubicacionParaHTML = ubicacionActualRef.current ?? ubicacionInicialRef.current;
    return generarHTMLLeaflet(
      zonasData,
      ubicacionParaHTML,
      departamentoSeleccionado?.id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonasData, departamentoSeleccionado?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </SafeAreaView>);

  }


  return (
    <View style={styles.container}>

      {/* Header estilo settings */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.topBarIconWrapper}>
              <Ionicons name="map-outline" size={20} color={darkMode ? '#9ca3af' : '#4b5563'} />
            </View>
            <View>
              <Text style={styles.topBarTitle}>
                {listaDepartamentos.length === 1 ? 'Zona Permitida' : 'Zonas Permitidas'}
              </Text>
              <Text style={styles.topBarSubtitle} numberOfLines={1}>
                {departamentoSeleccionado?.nombre || `${listaDepartamentos.length} departamentos`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.topBarClose}
            onPress={onClose}
            activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={darkMode ? '#9ca3af' : '#64748b'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.contentSafeArea}>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          onLoadEnd={() => {
            if (webViewRef.current && ubicacionActual) {
              webViewRef.current.postMessage(JSON.stringify({
                action: 'updateUserLocation',
                location: [ubicacionActual.lat, ubicacionActual.lng]
              }));
            }
          }}
          renderLoading={() =>
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          } />
      </View>

      {/* Selector de departamentos */}
      {listaDepartamentos.length > 0 &&
        <View style={styles.departamentosContainer}>
          <Text style={styles.departamentosTitle}>DEPARTAMENTO</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.departamentosContent}>

            {ubicacionActual &&
              <TouchableOpacity
                style={[styles.departamentoChip, mostrandoMiUbicacion && styles.departamentoChipActivo]}
                onPress={handleFocusUserLocation}
                activeOpacity={0.7}>
                <Ionicons name="navigate" size={14} color={mostrandoMiUbicacion ? '#10b981' : (darkMode ? '#9ca3af' : '#6b7280')} />
                <Text style={[styles.departamentoChipText, mostrandoMiUbicacion && styles.departamentoChipTextActivo]} numberOfLines={1}>
                  Mi ubicación
                </Text>
                {mostrandoMiUbicacion && <View style={styles.activeDot} />}
              </TouchableOpacity>
            }

            {listaDepartamentos.map((depto, index) => {
              const esSeleccionado = departamentoSeleccionado?.id === depto.id && !mostrandoMiUbicacion;
              return (
                <TouchableOpacity
                  key={depto.id || index}
                  style={[styles.departamentoChip, esSeleccionado && styles.departamentoChipActivo]}
                  onPress={() => handleDepartamentoClick(depto)}
                  activeOpacity={0.7}>
                  <Ionicons name={esSeleccionado ? 'location' : 'location-outline'} size={14} color={esSeleccionado ? '#10b981' : (darkMode ? '#9ca3af' : '#6b7280')} />
                  <Text style={[styles.departamentoChipText, esSeleccionado && styles.departamentoChipTextActivo]} numberOfLines={1} ellipsizeMode="tail">
                    {depto.nombre}
                  </Text>
                  {esSeleccionado && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      }



      {/* Leyenda */}
      <View style={styles.legend}>
        {!mostrandoMiUbicacion && departamentoSeleccionado &&
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText} numberOfLines={1}>{departamentoSeleccionado.nombre}</Text>
          </View>
        }
        {listaDepartamentos.length > 1 && !mostrandoMiUbicacion &&
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Otras zonas disponibles</Text>
          </View>
        }
        {ubicacionActual &&
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Tu ubicación</Text>
          </View>
        }
      </View>
      </SafeAreaView>
    </View>
  );

};


const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },

  // TOP BAR (header estilo settings)
  headerSafeArea: {
    backgroundColor: '#ffffff'
  },
  contentSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8
  },
  topBarIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.2
  },
  topBarSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1
  },
  topBarClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0
  },

  // LOADING / ERROR
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500'
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center'
  },
  closeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },

  // MAP
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  webviewLoading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },

  // DEPARTMENT CHIPS
  departamentosContainer: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    paddingBottom: 10
  },
  departamentosTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginBottom: 8
  },
  departamentosContent: {
    gap: 8,
    paddingHorizontal: 20,
    paddingRight: 20
  },
  departamentoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    maxWidth: SCREEN_WIDTH * 0.65
  },
  departamentoChipActivo: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981'
  },
  chipIcon: { flexShrink: 0 },
  departamentoChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    flexShrink: 1
  },
  departamentoChipTextActivo: {
    color: '#059669',
    fontWeight: '600'
  },
  activeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#10b981', flexShrink: 0
  },

  singleLocationContainer: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'flex-start'
  },

  // LEGEND
  legend: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendColor: {
    width: 10, height: 10, borderRadius: 5, flexShrink: 0
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500'
  }
});

const mapStylesDark = StyleSheet.create({
  ...mapStyles,
  container: { ...mapStyles.container, backgroundColor: '#0f172a' },
  loadingContainer: { ...mapStyles.loadingContainer, backgroundColor: '#0f172a' },
  errorContainer: { ...mapStyles.errorContainer, backgroundColor: '#0f172a' },
  topBar: {
    ...mapStyles.topBar,
    backgroundColor: '#0f172a',
    borderBottomColor: '#1e293b'
  },
  headerSafeArea: {
    ...mapStyles.headerSafeArea,
    backgroundColor: '#0f172a'
  },
  contentSafeArea: {
    ...mapStyles.contentSafeArea,
    backgroundColor: '#0f172a'
  },
  topBarIconWrapper: { ...mapStyles.topBarIconWrapper, backgroundColor: '#1e293b' },
  topBarTitle: { ...mapStyles.topBarTitle, color: '#f9fafb' },
  topBarSubtitle: { ...mapStyles.topBarSubtitle, color: '#9ca3af' },
  topBarClose: { ...mapStyles.topBarClose, backgroundColor: '#1e293b' },
  webviewLoading: { ...mapStyles.webviewLoading, backgroundColor: '#0f172a' },
  departamentosContainer: {
    ...mapStyles.departamentosContainer,
    backgroundColor: '#1e293b',
    borderTopColor: '#334155'
  },
  departamentosTitle: { ...mapStyles.departamentosTitle, color: '#64748b' },
  departamentoChip: {
    ...mapStyles.departamentoChip,
    backgroundColor: '#0f172a',
    borderColor: '#334155'
  },
  departamentoChipActivo: {
    ...mapStyles.departamentoChipActivo,
    backgroundColor: '#064e3b',
    borderColor: '#10b981'
  },
  departamentoChipText: { ...mapStyles.departamentoChipText, color: '#d1d5db' },
  singleLocationContainer: {
    ...mapStyles.singleLocationContainer,
    backgroundColor: '#1e293b',
    borderTopColor: '#334155'
  },
  legend: {
    ...mapStyles.legend,
    backgroundColor: '#1e293b',
    borderTopColor: '#334155'
  },
  legendText: { ...mapStyles.legendText, color: '#94a3b8' }
});

export default MapaZonasPermitidas;