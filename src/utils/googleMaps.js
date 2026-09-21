const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let loaderPromise = null;

export const loadGoogleMaps = () => {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  if (!API_KEY) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'));

  if (!loaderPromise) {
    loaderPromise = new Promise((resolve, reject) => {
      window.__googleMapsReady = () => resolve(window.google.maps);
      const script = document.createElement('script');
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${API_KEY}` +
        `&v=weekly&loading=async&language=en&region=IN&callback=__googleMapsReady`;
      script.async = true;
      script.onerror = () => {
        loaderPromise = null;
        reject(new Error('Failed to load Google Maps'));
      };
      document.head.appendChild(script);
    });
  }
  return loaderPromise;
};

// Resolves to { lat, lng } for the best match in India, or null when nothing is found.
export const geocodeAddress = async (query) => {
  const maps = await loadGoogleMaps();
  const { Geocoder } = await maps.importLibrary('geocoding');
  try {
    const { results } = await new Geocoder().geocode({
      address: query,
      componentRestrictions: { country: 'IN' },
    });
    const location = results?.[0]?.geometry?.location;
    return location ? { lat: location.lat(), lng: location.lng() } : null;
  } catch (error) {
    if (error?.code === 'ZERO_RESULTS') return null;
    throw error;
  }
};
