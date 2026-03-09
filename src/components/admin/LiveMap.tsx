import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useFirebaseRead } from "../../hooks/useFirebaseSync";
import { Navigation, Users, MapPin, Clock } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet default marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal component to handle map centering
function RecenterButton({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  return (
    <button 
      onClick={() => map.setView([lat, lng], 18)}
      className="absolute bottom-6 right-6 z-[1000] bg-white p-3 rounded-full shadow-2xl hover:bg-gray-50 text-blue-900 border border-gray-200 transition-transform active:scale-90"
      title="Recenter to Office"
    >
      <Navigation size={24} />
    </button>
  );
}

export function LiveMap() {
  const { data: attendanceData, loading } = useFirebaseRead<Record<string, any>>("attendance");
  
  // Coldsis GH Office Coordinates
  const OFFICE_LAT = 5.697796;
  const OFFICE_LNG = -0.176180;
  const GEOFENCE_RADIUS = 100; // 100 meters

  // Filter for staff currently "active" (checked in but not yet checked out)
  const activeStaff = attendanceData 
    ? Object.values(attendanceData).filter(record => record.status === "active")
    : [];

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
      
      {/* Live Status Overlay */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white w-64">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Users size={16} className="text-orange-600" /> Live Status
          </h3>
          {loading && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 font-medium">Staff Present:</span>
            <span className="text-lg font-black text-blue-900">{activeStaff.length}</span>
          </div>
          
          <div className="max-h-40 overflow-y-auto pt-2 space-y-2 border-t border-gray-100">
            {activeStaff.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic text-center py-2">No active sessions</p>
            ) : (
              activeStaff.map((staff, idx) => (
                <div key={idx} className="flex flex-col text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="font-bold text-gray-700">{staff.staffName}</span>
                  <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {staff.checkInTime}</span>
                    <span className="text-blue-600 font-bold">{staff.distanceFromOffice}m</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* The Map Component */}
      <MapContainer 
        center={[OFFICE_LAT, OFFICE_LNG]} 
        zoom={18} 
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* Office Geofence Circle */}
        <Circle 
          center={[OFFICE_LAT, OFFICE_LNG]} 
          radius={GEOFENCE_RADIUS} 
          pathOptions={{ 
            color: '#ea580c', // Orange-600 to match your theme
            fillColor: '#ea580c', 
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 10'
          }} 
        />

        {/* Office Center Marker */}
        <Marker position={[OFFICE_LAT, OFFICE_LNG]}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-blue-900">Coldsis GH Headquarters</p>
              <p className="text-[10px] text-gray-500">Geofence Center</p>
            </div>
          </Popup>
        </Marker>

        {/* Staff Location Markers */}
        {activeStaff.map((staff, idx) => (
          <Marker 
            key={idx} 
            position={[staff.latitude, staff.longitude]}
          >
            <Popup>
              <div className="p-1 min-w-[120px]">
                <p className="font-bold text-gray-900 border-b pb-1 mb-1">{staff.staffName}</p>
                <div className="space-y-1 text-xs">
                  <p className="flex items-center gap-1 text-gray-600">
                    <Clock size={12} className="text-orange-600" /> {staff.checkInTime}
                  </p>
                  <p className="flex items-center gap-1 text-gray-600">
                    <MapPin size={12} className="text-blue-600" /> {staff.distanceFromOffice}m away
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <RecenterButton lat={OFFICE_LAT} lng={OFFICE_LNG} />
      </MapContainer>
    </div>
  );
}