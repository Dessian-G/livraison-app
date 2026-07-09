import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function DraggableMarker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  if (!position) return null
  return (
    <Marker
      position={[position.lat, position.lng]}
      draggable
      eventHandlers={{
        dragend(e) {
          const ll = e.target.getLatLng()
          onChange({ lat: ll.lat, lng: ll.lng })
        },
      }}
    />
  )
}

function StaticMarker({ position }) {
  if (!position) return null
  return <Marker position={[position.lat, position.lng]} />
}

export default function CarteLeaflet({ centre, position, onChange, readonly = false }) {
  const centreDefault = centre || { lat: 5.3599, lng: -3.9870, zoom: 13 }

  return (
    <MapContainer
      center={[centreDefault.lat, centreDefault.lng]}
      zoom={centreDefault.zoom || 13}
      style={{ height: '260px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {readonly
        ? <StaticMarker position={position} />
        : <DraggableMarker position={position} onChange={onChange} />
      }
    </MapContainer>
  )
}
