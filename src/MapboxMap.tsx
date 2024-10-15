import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxMap.css'

mapboxgl.accessToken = 'pk.eyJ1IjoiamFrZWplbmRlbiIsImEiOiJjbTFpMm5mOHcwaWo0MmpzaXBkZ2s2eWMzIn0.GV26kFhLYpyeTc_xNh6Stw';

interface MapboxMapProps {
  gpxDataList: GPXData[]; // GPX data in string format
}

interface GPXData {
  Key: string;
  GPX: string; // GPX data in string format (can be base64 encoded)
}

interface LegendProps {
  gpxDataList: GPXData[];
  routeColors: string[];
  toggleRouteVisibility: (index: number) => void;
  visibleRoutes: boolean[]; // Tracks the visibility of each route
}

function formatFileName(fileName: string): string {
  // Remove the file extension using regex
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

  // Replace underscores with spaces
  const formattedName = nameWithoutExtension.replace(/_/g, " ");

  return formattedName;
}

const Legend: React.FC<LegendProps> = ({ gpxDataList, routeColors, toggleRouteVisibility, visibleRoutes }) => {
  return (
    <div className="legend">
      <h5>Legend (Click to Toggle Routes)</h5>
      <ul>
        {gpxDataList.map((gpxData, index) => (
          <li
            key={formatFileName(gpxData.Key)}
            onClick={() => toggleRouteVisibility(index)}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              opacity: visibleRoutes[index] ? 1 : 0.5, // Dim the item if hidden
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                backgroundColor: routeColors[index % routeColors.length],
                marginRight: '10px',
              }}
            />
            {formatFileName(gpxData.Key)}
          </li>
        ))}
      </ul>
    </div>
  );
};

const MapboxMap: React.FC<MapboxMapProps> = ({ gpxDataList }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [routeColors, setRouteColors] = useState<string[]>([]);
  const [visibleRoutes, setVisibleRoutes] = useState<boolean[]>([]); 

  useEffect(() => {
    if (!mapInstance.current && mapContainerRef.current) {
      mapInstance.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-0.09, 51.505], // Default map center
        zoom: 13,
      });

      mapInstance.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    

    const map = mapInstance.current;


    if (gpxDataList) {
      let allCoordinates: [number, number][] = [];
      const colors = ['#FF0000', '#0000FF', '#FF00FF'];
      setRouteColors(colors);

      map?.on('load', () => {
        gpxDataList.forEach((GPXData, index) => {
          const initialVisibility = gpxDataList.map(() => true); // All routes visible initially
          setVisibleRoutes(initialVisibility);

          const decodedGPX = atob(GPXData.GPX);
          let gpxParser = require('gpxparser');
          var gpx = new gpxParser();
          gpx.parse(decodedGPX);
          const geojson = gpx.toGeoJSON();

          if (geojson && geojson.features && geojson.features.length > 0) {
            const gpxRoute = 'gpxRoute' + String(index);
            const gpxRouteLine = 'gpxRouteLine' + String(index);

            if (!map.getSource(gpxRoute)) { // Check if the source already exists
              map.addSource(gpxRoute, {
                type: 'geojson',
                data: geojson,
              });
            }

            if (!map.getLayer(gpxRouteLine)) { // Check if the layer already exists
              map.addLayer({
                id: gpxRouteLine,
                type: 'line',
                source: gpxRoute,
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round',
                },
                paint: {
                  'line-color': colors[index % colors.length],
                  'line-width': 4,
                },
              });
            }

            // Add digital elevation model tiles for the first file only
            if (index === 1 && !map.getSource('mapbox-dem')) {
              map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 20,
              });
              map.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });
            }

            const coordinates = geojson.features[0].geometry.coordinates;

            if (Array.isArray(coordinates) && coordinates.length > 0) {
              allCoordinates = [...allCoordinates, ...coordinates]; // Merge all coordinates
            } else {
              console.error('No valid coordinates found in GPX file:', GPXData.Key);
            }
          } else {
            console.error('Invalid GeoJSON structure or empty features:', geojson);
          }
        });

        // Fit the map to the bounds after processing all GPX files
        if (allCoordinates.length > 0) {
          const bounds = allCoordinates.reduce((bounds, coord) => {
            return bounds.extend(coord); // Extend bounds with each coordinate
          }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));

          map.fitBounds(bounds, { padding: 20 });
        } else {
          console.error('No valid coordinates found for fitting bounds:', allCoordinates);
        }
      });
    }
  }

    return () => {
      // Check if mapInstance.current is initialized before calling remove
      if (mapInstance.current) {
        mapInstance.current?.remove();  // Clean up the map instance
        mapInstance.current = null; // Clear reference to allow re-initialization
      }
    };
  }, [gpxDataList]);

  const toggleRouteVisibility = (index: number) => {
    if (!mapInstance.current) {
      console.error("Map is not initialized.");
      return;
    }

    const routeLineId = 'gpxRouteLine' + String(index);

    // Log to verify that the layer exists before trying to access it
    if (mapInstance.current.getLayer(routeLineId)) {
      const currentVisibility = mapInstance.current.getLayoutProperty(routeLineId, 'visibility');
      console.log("Current visibility for route", routeLineId, ":", currentVisibility);

      // Toggle visibility
      const newVisibility = currentVisibility === 'visible' ? 'none' : 'visible';
      mapInstance.current.setLayoutProperty(routeLineId, 'visibility', newVisibility);

      // Update state to reflect the new visibility state
      const updatedVisibility = [...visibleRoutes];
      updatedVisibility[index] = newVisibility === 'visible'; // Sync with map state
      setVisibleRoutes(updatedVisibility);
    } else {
      console.error("Layer not found for route:", routeLineId);
    }
  };

  return <div className='map-container'>
    <div ref={mapContainerRef} className='map' />
    <Legend
      gpxDataList={gpxDataList}
      routeColors={routeColors}
      toggleRouteVisibility={toggleRouteVisibility}
      visibleRoutes={visibleRoutes}
    />
  </div>
};

export default MapboxMap;
