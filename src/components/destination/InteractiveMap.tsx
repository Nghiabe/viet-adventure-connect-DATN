interface InteractiveMapProps {
  lat?: number;
  lng?: number;
  title?: string;
}

// Lightweight placeholder using Google Maps embed to avoid adding heavy deps
export function InteractiveMap({ lat, lng, title }: InteractiveMapProps) {
  if (!lat || !lng) return null;
  const q = encodeURIComponent(`${lat},${lng}`);
  return (
    <div className="w-full rounded-xl overflow-hidden border">
      <iframe
        title={title || 'Map'}
        width="100%"
        height="280"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps?q=${q}&output=embed`}
      />
    </div>
  );
}


