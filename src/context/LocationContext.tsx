import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type LocationMode = "global" | "country" | "city";

interface SelectedLocation {
  mode: LocationMode;
  country?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface LocationContextValue extends SelectedLocation {
  setGlobal: () => void;
  setCountry: (country: string) => void;
  setCity: (city: string, coords?: { latitude: number; longitude: number }, country?: string | null) => void;
  requestCityFromBrowser: () => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const STORAGE_KEY = "playgen:selectedLocation";

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<SelectedLocation>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SelectedLocation;
        return parsed;
      }
    } catch {
      // ignore
    }
    return { mode: "global" };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    } catch {
      // ignore
    }
  }, [location]);

  const setGlobal = useCallback(() => {
    setLocation({ mode: "global" });
  }, []);

  const setCountry = useCallback((country: string) => {
    setLocation({ mode: "country", country });
  }, []);

  const setCity = useCallback((city: string, coords?: { latitude: number; longitude: number }, country?: string | null) => {
    setLocation({
      mode: "city",
      city,
      country: country ?? null,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    });
  }, []);

  const requestCityFromBrowser = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setGlobal();
      return;
    }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || null;
      const country = data.address?.country || null;
      if (city) {
        setLocation({ mode: "city", city, country, latitude, longitude });
      } else if (country) {
        setLocation({ mode: "country", country, latitude, longitude });
      } else {
        setGlobal();
      }
    } catch {
      setGlobal();
    }
  }, [setGlobal]);

  const value = useMemo<LocationContextValue>(
    () => ({ ...location, setGlobal, setCountry, setCity, requestCityFromBrowser }),
    [location, setCountry, setCity, setGlobal, requestCityFromBrowser]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationContext must be used within LocationProvider");
  return ctx;
}
