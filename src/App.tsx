import React, { useState, useEffect } from 'react';
import { MapPin, Search, Home, Coffee, Utensils, Navigation, Loader2, Map as MapIcon, Landmark } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { searchPlaces } from './services/geminiService';
import MapComponent from './components/MapComponent';

export default function App() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; places: any[]; mapPlaces?: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.9716, 77.5946]); // Default: Bangalore
  const [isMapMoved, setIsMapMoved] = useState(false);

  useEffect(() => {
    // Try to get location on mount
    getLocation();
  }, []);

  const getLocation = () => {
    setLocationStatus('loading');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setLocationStatus('success');
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationStatus('error');
        }
      );
    } else {
      setLocationStatus('error');
    }
  };

  const handleSearch = async (searchQuery: string, useMapCenter: boolean = false) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setQuery(searchQuery);
    setIsMapMoved(false);

    const searchLocation = useMapCenter ? { latitude: mapCenter[0], longitude: mapCenter[1] } : location;

    try {
      const res = await searchPlaces(searchQuery, searchLocation);
      setResult(res);
      if (res.mapPlaces && res.mapPlaces.length > 0 && res.mapPlaces[0].lat && res.mapPlaces[0].lng) {
        setMapCenter([res.mapPlaces[0].lat, res.mapPlaces[0].lng]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapMove = (newCenter: { latitude: number; longitude: number }) => {
    setMapCenter([newCenter.latitude, newCenter.longitude]);
    setIsMapMoved(true);
  };

  const quickLinks = [
    { icon: <Home className="w-5 h-5" />, label: "Cheap PGs", query: "affordable and safe PG accommodations" },
    { icon: <Coffee className="w-5 h-5" />, label: "Budget Hotels", query: "budget hotels for a short stay" },
    { icon: <Utensils className="w-5 h-5" />, label: "Local Food", query: "cheap and authentic local restaurants or darshinis" },
    { icon: <Navigation className="w-5 h-5" />, label: "Transport Hubs", query: "nearest metro stations or bus stops" },
  ];

  const mainPlaces = result?.mapPlaces?.filter(p => p.type !== 'attraction') || [];
  const attractions = result?.mapPlaces?.filter(p => p.type === 'attraction') || [];
  const hasMapPlaces = mainPlaces.length > 0 || attractions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900">
      {/* Header */}
      <header className="bg-emerald-800 text-white py-6 px-4 shadow-md relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-emerald-300" />
            <h1 className="text-2xl font-bold tracking-tight">Namma Bengaluru Guide</h1>
          </div>
          <div className="flex items-center gap-2 text-sm bg-emerald-900/50 px-3 py-1.5 rounded-full">
            <MapPin className="w-4 h-4 text-emerald-300" />
            {locationStatus === 'loading' && <span>Locating you...</span>}
            {locationStatus === 'success' && <span>Location active</span>}
            {locationStatus === 'error' && (
              <button onClick={getLocation} className="underline hover:text-emerald-200">
                Enable Location
              </button>
            )}
            {locationStatus === 'idle' && <span>Location idle</span>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-stone-800">
            Welcome to the Silicon Valley of India!
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto text-lg">
            New to Bangalore? We'll help you find the best and most affordable places to stay, eat, and explore around your current location.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8">
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
              <input
                type="text"
                placeholder="What are you looking for? (e.g., 'Cheap PG in Koramangala')"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              />
            </div>
            <button
              onClick={() => handleSearch(query)}
              disabled={loading || !query.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(link.query)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-stone-700 hover:text-emerald-700"
              >
                {link.icon}
                <span className="text-sm font-medium text-center">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {result && (
          <div className="grid lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-semibold mb-6 text-stone-800 border-b pb-4">
                  Recommendations for you
                </h3>
                
                <div className="prose prose-stone max-w-none prose-headings:text-emerald-800 prose-a:text-emerald-600 hover:prose-a:text-emerald-700">
                  <ReactMarkdown>{result.text}</ReactMarkdown>
                </div>

                {hasMapPlaces ? (
                  <>
                    {mainPlaces.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-stone-200">
                        <h4 className="text-lg font-medium mb-4 text-stone-800 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                          Recommended Places
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {mainPlaces.map((place, idx) => (
                            <div key={idx} className="flex flex-col p-4 rounded-lg border border-stone-200 bg-stone-50">
                              <span className="font-medium text-stone-800 mb-1">{place.name}</span>
                              <span className="text-xs text-stone-500 capitalize mb-3">{place.type}</span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                              >
                                <MapPin className="w-4 h-4" />
                                View on Google Maps
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {attractions.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-stone-200">
                        <h4 className="text-lg font-medium mb-4 text-stone-800 flex items-center gap-2">
                          <Landmark className="w-5 h-5 text-purple-600" />
                          Nearby Attractions
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {attractions.map((place, idx) => (
                            <div key={idx} className="flex flex-col p-4 rounded-lg border border-stone-200 bg-purple-50/50">
                              <span className="font-medium text-stone-800 mb-1">{place.name}</span>
                              <span className="text-xs text-stone-500 capitalize mb-3">{place.type}</span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                              >
                                <MapPin className="w-4 h-4" />
                                View on Google Maps
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  result.places && result.places.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-stone-200">
                      <h4 className="text-lg font-medium mb-4 text-stone-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        Places on Google Maps
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {result.places.map((place, idx) => (
                          <div key={idx} className="flex flex-col p-4 rounded-lg border border-stone-200 bg-stone-50">
                            <span className="font-medium text-stone-800 mb-3">{place.title}</span>
                            <a
                              href={place.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                            >
                              <MapPin className="w-4 h-4" />
                              View on Google Maps
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden h-[500px] lg:h-[calc(100vh-200px)] lg:sticky lg:top-8 relative">
                <MapComponent 
                  places={result.mapPlaces || []} 
                  center={mapCenter} 
                  onMapMove={handleMapMove} 
                />
                {isMapMoved && (
                  <div className="absolute top-4 left-1/2 z-[1000] animate-slide-down">
                    <button
                      onClick={() => handleSearch(query, true)}
                      className="bg-stone-900 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Search this area
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-100 border-t border-stone-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-stone-500 text-sm">
          <p>Built with Gemini API • Data provided by Google Maps</p>
          <p className="mt-2 text-stone-400">Prices and availability may vary. Always verify before visiting.</p>
        </div>
      </footer>
    </div>
  );
}
