const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  'pk.eyJ1IjoiZmFzdDIiLCJhIjoiY21mbW9qbzZlMDQ5dzJpcXhlOW82ODdlcSJ9.HYJxZbPDCZHD8_Q5faa6ig';

// Resolves to { lat, lng } for the best match in India, or null when nothing is found.
export const geocodeAddress = async (query) => {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${MAPBOX_TOKEN}&country=in&limit=1`
  );
  if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
  const data = await response.json();
  const [lng, lat] = data.features?.[0]?.center || [];
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};
