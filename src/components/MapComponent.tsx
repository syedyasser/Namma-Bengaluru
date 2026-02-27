import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Home, Coffee, Utensils, Landmark } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons based on type
const getIcon = (type: string) => {
  let color = '#6b7280'; // gray
  let iconHtml = renderToString(<MapPin className="w-4 h-4 text-white" />);

  if (type === 'pg') {
    color = '#2563eb'; // blue
    iconHtml = renderToString(<Home className="w-4 h-4 text-white" />);
  } else if (type === 'hotel') {
    color = '#059669'; // emerald
    iconHtml = renderToString(<Coffee className="w-4 h-4 text-white" />);
  } else if (type === 'restaurant') {
    color = '#ea580c'; // orange
    iconHtml = renderToString(<Utensils className="w-4 h-4 text-white" />);
  } else if (type === 'attraction') {
    color = '#9333ea'; // purple
    iconHtml = renderToString(<Landmark className="w-4 h-4 text-white" />);
  }

  const svgMarker = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.3));">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}" stroke="white" stroke-width="2.5"/>
    </svg>
  `;

  return new L.DivIcon({
    className: 'custom-icon',
    html: `
      <div class="marker-container" style="position: relative; width: 36px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; top: 0; left: 0;">
          ${svgMarker}
        </div>
        <div style="position: absolute; top: 8px; left: 8px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; z-index: 10;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -48],
  });
};

function MapEvents({ onBoundsChange }: { onBoundsChange: (center: { latitude: number; longitude: number }) => void }) {
  const map = useMapEvents({
    dragend: () => {
      const center = map.getCenter();
      onBoundsChange({ latitude: center.lat, longitude: center.lng });
    },
    zoomend: () => {
      const center = map.getCenter();
      onBoundsChange({ latitude: center.lat, longitude: center.lng });
    }
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MapComponentProps {
  places: any[];
  center: [number, number];
  onMapMove: (center: { latitude: number; longitude: number }) => void;
}

export default function MapComponent({ places, center, onMapMove }: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapUpdater center={center} />
      <MapEvents onBoundsChange={onMapMove} />
      {places && places.map((place: any, idx: number) => (
        place.lat && place.lng ? (
          <Marker key={idx} position={[place.lat, place.lng]} icon={getIcon(place.type)}>
            <Popup>
              <div className="font-sans min-w-[200px]">
                <h3 className="font-bold text-lg text-stone-800 leading-tight mb-1">{place.name}</h3>
                <span className="inline-block px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full capitalize mb-2 border border-stone-200">
                  {place.type}
                </span>
                <p className="text-sm text-stone-600 leading-snug mb-3">{place.description}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md text-xs font-medium transition-colors w-full"
                >
                  <MapPin className="w-3 h-3" />
                  View on Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
}
