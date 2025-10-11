import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, MapPin } from "lucide-react";
import { toast } from "sonner";

type LocationMode = "global" | "country" | "city";

interface LocationFilterProps {
  onLocationChange: (mode: LocationMode, location?: string) => void;
}

export const LocationFilter = ({ onLocationChange }: LocationFilterProps) => {
  const [mode, setMode] = useState<LocationMode>("global");
  const [country, setCountry] = useState("");

  const handleModeChange = async (newMode: LocationMode) => {
    setMode(newMode);

    if (newMode === "global") {
      onLocationChange("global");
    } else if (newMode === "country") {
      // User will select country from dropdown
      if (country) {
        onLocationChange("country", country);
      }
    } else if (newMode === "city") {
      // Get user's location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Reverse geocode to get city name
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
              );
              const data = await response.json();
              const city = data.address?.city || data.address?.town || data.address?.village;
              
              if (city) {
                onLocationChange("city", city);
                toast.success(`Showing games from ${city}`);
              } else {
                toast.error("Could not determine your city");
                setMode("global");
                onLocationChange("global");
              }
            } catch (error) {
              toast.error("Failed to get location details");
              setMode("global");
              onLocationChange("global");
            }
          },
          (error) => {
            toast.error("Please enable location access");
            setMode("global");
            onLocationChange("global");
          }
        );
      } else {
        toast.error("Location not supported by your browser");
        setMode("global");
        onLocationChange("global");
      }
    }
  };

  const countries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Japan",
    "India",
    "Brazil",
    "Mexico",
  ];

  return (
    <div className="flex items-center gap-2 p-4 border-b">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={mode} onValueChange={(v) => handleModeChange(v as LocationMode)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="global">Global</SelectItem>
          <SelectItem value="country">Country</SelectItem>
          <SelectItem value="city">My City</SelectItem>
        </SelectContent>
      </Select>

      {mode === "country" && (
        <Select
          value={country}
          onValueChange={(v) => {
            setCountry(v);
            onLocationChange("country", v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};