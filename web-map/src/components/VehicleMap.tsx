import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './VehicleMap.css';
import { VehiclePosition, SpeedZone, TrafficAlert } from '../types/web';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface VehicleMapProps {
  vehicles: VehiclePosition[];
  speedZones: SpeedZone[];
  alerts: TrafficAlert[];
  onMapClick: (lng: number, lat: number) => void;
}

export default function VehicleMap({ vehicles, speedZones, alerts, onMapClick }: VehicleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const alertMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const onMapClickRef = useRef(onMapClick);

  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  const centerOnVehicles = () => {
    if (!map.current || vehicles.length === 0) return;

    if (vehicles.length === 1) {
      map.current.flyTo({
        center: vehicles[0].coordinates,
        zoom: 15,
        duration: 1000
      });
    } else {
      const bounds = new mapboxgl.LngLatBounds();
      vehicles.forEach(vehicle => bounds.extend(vehicle.coordinates));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const initTimeout = setTimeout(() => {
      if (!mapContainer.current || map.current) return;

      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-84.3880, 33.7490],
          zoom: 12,
          bearing: 0,
          pitch: 0
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        map.current.on('click', (e) => {
          onMapClickRef.current(e.lngLat.lng, e.lngLat.lat);
        });

        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
        });

        map.current.on('load', () => {
          setMapLoaded(true);

          map.current!.setPaintProperty('road-primary', 'line-color', '#00FF88');
          map.current!.setPaintProperty('road-secondary-tertiary', 'line-color', '#FFD400');
          map.current!.setPaintProperty('road-street', 'line-color', '#888888');

          map.current!.addLayer({
            id: 'traffic-flow',
            type: 'line',
            source: {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FF4444',
              'line-width': 3,
              'line-opacity': 0.8
            }
          });

          map.current!.addLayer({
            id: 'speed-zones',
            type: 'circle',
            source: {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            },
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'radius'],
                0, 0,
                1000, 50
              ],
              'circle-color': [
                'case',
                ['<=', ['get', 'speedLimit'], 35], 'rgba(255, 68, 68, 0.3)',
                ['<=', ['get', 'speedLimit'], 55], 'rgba(255, 212, 0, 0.3)',
                'rgba(0, 255, 136, 0.3)'
              ],
              'circle-stroke-color': [
                'case',
                ['<=', ['get', 'speedLimit'], 35], '#FF4444',
                ['<=', ['get', 'speedLimit'], 55], '#FFD400',
                '#00FF88'
              ],
              'circle-stroke-width': 2
            }
          });

          map.current!.addLayer({
            id: 'vehicles',
            type: 'circle',
            source: {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: []
              }
            },
            paint: {
              'circle-radius': 8,
              'circle-color': [
                'case',
                ['>', ['get', 'speed'], 60], '#FF4444',
                ['>', ['get', 'speed'], 30], '#FFD400',
                ['>', ['get', 'speed'], 0], '#00FF88',
                '#888'
              ],
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 2
            }
          });
        });
      } catch (error) {
        console.error('Error setting up map:', error);
        return;
      }
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    try {
      const features = vehicles.map(vehicle => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: vehicle.coordinates
        },
        properties: {
          id: vehicle.id,
          speed: vehicle.speed,
          bearing: vehicle.bearing,
          lastUpdate: vehicle.lastUpdate
        }
      }));

      const source = map.current.getSource('vehicles') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features
        });

        if (vehicles.length > 0) {
          console.log(`Updated ${features.length} vehicles on map - Vehicle 1 at: [${vehicles[0].coordinates[0].toFixed(4)}, ${vehicles[0].coordinates[1].toFixed(4)}] Speed: ${Math.round(vehicles[0].speed)} MPH`);
        }
      } else {
        console.warn('Vehicles source not found');
      }
    } catch (error) {
      console.error('Error updating vehicles:', error);
    }
  }, [vehicles, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const features = speedZones.filter(zone => zone.active).map(zone => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: zone.center
      },
      properties: {
        id: zone.id,
        speedLimit: zone.speedLimit,
        radius: zone.radius
      }
    }));

    const source = map.current.getSource('speed-zones') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [speedZones, mapLoaded]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    alertMarkers.current.forEach(marker => marker.remove());
    alertMarkers.current.clear();

    alerts.filter(alert => alert.active).forEach(alert => {
      const alertElement = document.createElement('div');
      alertElement.className = `alert-marker severity-${alert.severity}`;
      alertElement.innerHTML = `
        <div class="alert-icon">
          ${alert.type === 'construction' ? '🚧' :
            alert.type === 'accident' ? '💥' :
            alert.type === 'weather' ? '🌧️' :
            alert.type === 'emergency' ? '🚨' : '⚠️'}
        </div>
      `;

      const marker = new mapboxgl.Marker(alertElement)
        .setLngLat(alert.coordinates)
        .addTo(map.current!);

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="alert-popup severity-${alert.severity}">
            <h4>${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert</h4>
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Message:</strong> ${alert.message}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleTimeString()}</p>
          </div>
        `);

      marker.setPopup(popup);
      alertMarkers.current.set(alert.id, marker);
    });
  }, [alerts, mapLoaded]);

  return (
    <div className="vehicle-map-container">
      <div className="map-header">
        <h3>Real-Time Traffic Control Center</h3>
        <div className="map-controls">
          <div className="map-stats">
            <span>📍 Vehicles: {vehicles.length}</span>
            <span>⚠️ Alerts: {alerts.filter(a => a.active).length}</span>
            <span>🚦 Speed Zones: {speedZones.filter(z => z.active).length}</span>
          </div>
          <button
            className="locate-vehicles-btn"
            onClick={centerOnVehicles}
            disabled={vehicles.length === 0}
            title="Center map on vehicles"
          >
            🎯 Locate Vehicles
          </button>
        </div>
      </div>

      <div className="map-wrapper">
        <div
          ref={mapContainer}
          className="map-container"
        />

        <div className="map-overlays">
          <div className="map-legend">
            <h4>Traffic Status</h4>
            <div className="legend-item">
              <div className="legend-color speed-normal"></div>
              <span>Normal Speed (0-30 MPH)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color speed-moderate"></div>
              <span>Moderate Speed (30-60 MPH)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color speed-high"></div>
              <span>High Speed (60+ MPH)</span>
            </div>
            <hr />
            <h4>Alert Types</h4>
            <div className="legend-item">
              <span>🚧 Construction</span>
            </div>
            <div className="legend-item">
              <span>💥 Accident</span>
            </div>
            <div className="legend-item">
              <span>🌧️ Weather</span>
            </div>
            <div className="legend-item">
              <span>🚨 Emergency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}