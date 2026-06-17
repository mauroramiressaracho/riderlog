import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type SOSAction = {
  label: string;
  icon: string;
  query: string;
  tone?: 'danger' | 'default';
};

const sosActions: SOSAction[] = [
  { label: 'Restaurante perto de mim', icon: '🍽️', query: 'restaurante perto de mim' },
  { label: 'Hotel perto de mim', icon: '🛏️', query: 'hotel perto de mim' },
  { label: 'Posto de gasolina perto de mim', icon: '⛽', query: 'posto de gasolina perto de mim' },
  { label: 'Borracharia perto de mim', icon: '🛞', query: 'borracharia perto de mim' },
  { label: 'Oficina de moto perto de mim', icon: '🧰', query: 'oficina de moto perto de mim' },
  { label: 'Farmácia perto de mim', icon: '💊', query: 'farmácia perto de mim' },
  { label: 'Hospital perto de mim', icon: '🏥', query: 'hospital perto de mim', tone: 'danger' },
  { label: 'Polícia rodoviária perto de mim', icon: '🚓', query: 'polícia rodoviária perto de mim', tone: 'danger' },
  { label: 'Caixa eletrônico perto de mim', icon: '🏧', query: 'caixa eletrônico perto de mim' },
  { label: 'Ponto turístico perto de mim', icon: '📍', query: 'ponto turístico perto de mim' },
];

function buildMapsUrl(query: string, coordinates?: Coordinates) {
  const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+');

  if (coordinates) {
    return `https://www.google.com/maps/search/${encodedQuery}/@${coordinates.latitude},${coordinates.longitude},14z`;
  }

  return `https://www.google.com/maps/search/${encodedQuery}`;
}

export function SOSEstradaPage() {
  const [coordinates, setCoordinates] = useState<Coordinates>();
  const [locationStatus, setLocationStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('available');
      },
      () => setLocationStatus('unavailable'),
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 4500,
      },
    );
  }, []);

  function openMaps(query: string) {
    window.open(buildMapsUrl(query, coordinates), '_blank', 'noopener,noreferrer');
  }

  return (
    <section>
      <PageHeader
        eyebrow="SOS Estrada"
        title="Apoio perto de você"
        description="Use esta área quando estiver em viagem e precisar encontrar apoio próximo. As buscas serão abertas no Google Maps."
      />

      <div className="mb-5 rounded-[2rem] border border-red-400/20 bg-gradient-to-br from-road via-asphalt to-black p-5 text-white shadow-glow">
        <div className="flex items-start gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-ember to-flame text-2xl shadow-glow">🆘</span>
          <div>
            <h2 className="text-xl font-black">Toque e abra no Maps</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-white/70">
              {locationStatus === 'available'
                ? 'Localização detectada para melhorar o ponto inicial da busca.'
                : 'Funciona mesmo sem permissão de localização. O Google Maps usa sua posição quando possível.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sosActions.map((action) => (
          <button
            key={action.query}
            type="button"
            onClick={() => openMaps(action.query)}
            className={`flex min-h-16 w-full items-center justify-between rounded-3xl px-4 text-left shadow-soft transition active:scale-[0.99] ${
              action.tone === 'danger'
                ? 'border border-red-300/30 bg-red-950/65 text-red-50'
                : 'border border-white/10 bg-white/10 text-white backdrop-blur'
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`grid size-12 place-items-center rounded-2xl text-2xl ${
                  action.tone === 'danger' ? 'bg-red-100' : 'bg-orange-100'
                }`}
              >
                {action.icon}
              </span>
              <span className="text-base font-black">{action.label}</span>
            </span>
            <span className="text-2xl text-orange-200">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
