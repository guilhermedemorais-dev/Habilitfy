import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Badge } from "@/components/ui/badge";

// Fix Leaflet/Vite icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

type GeoPoint = {
    lat: number;
    lng: number;
    label?: string | null;
    type: 'instructor' | 'student';
    data?: any;
};

interface AdminMapProps {
    instructors?: any[];
    students?: any[];
}

export function AdminMap({ instructors = [], students = [] }: AdminMapProps) {
    const points: GeoPoint[] = [
        ...instructors.map(i => ({
            lat: Number(i.lat || i.user?.lat || 0),
            lng: Number(i.lng || i.user?.lng || 0),
            label: i.user?.firstName,
            type: 'instructor' as const,
            data: i
        })).filter(p => p.lat !== 0 && p.lng !== 0),
        ...students.map(s => ({
            lat: Number(s.lat || 0),
            lng: Number(s.lng || 0),
            label: s.firstName,
            type: 'student' as const,
            data: s
        })).filter(p => p.lat !== 0 && p.lng !== 0)
    ];

    const center = points.length > 0
        ? [points[0].lat, points[0].lng] as [number, number]
        : [-14.2350, -51.9253] as [number, number]; // Brazil center

    return (
        <div className="h-[500px] w-full rounded-lg overflow-hidden border border-slate-200 z-0">
            <MapContainer
                center={center}
                zoom={points.length > 0 ? 10 : 4}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {points.slice(0, 100).map((point, idx) => ( // Limite de 100 pontos para performance sem cluster
                    <Marker
                        key={idx}
                        position={[point.lat, point.lng]}
                        icon={point.type === 'instructor'
                            ? new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                            : new L.Icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        }
                    >
                        <Popup>
                            <div className="p-2">
                                <strong>{point.label}</strong>
                                <br />
                                <Badge variant={point.type === 'instructor' ? 'default' : 'secondary'}>
                                    {point.type === 'instructor' ? 'Instrutor' : 'Aluno'}
                                </Badge>
                                {point.data?.city && <p className="text-xs mt-1">{point.data.city} - {point.data.state}</p>}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
