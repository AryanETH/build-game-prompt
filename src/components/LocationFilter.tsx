import { useEffect, useState } from "react";
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
import { useLocationContext } from "@/context/LocationContext";

type LocationMode = "global" | "country" | "city";

interface LocationFilterProps {
  onLocationChange: (mode: LocationMode, location?: string) => void;
}

export const LocationFilter = ({ onLocationChange }: LocationFilterProps) => {
  const [mode, setMode] = useState<LocationMode>("global");
  const [country, setCountry] = useState("");
  const { setGlobal, setCountry: setGlobalCountry, setCity, requestCityFromBrowser, city, country: ctxCountry } = useLocationContext();

  const handleModeChange = async (newMode: LocationMode) => {
    setMode(newMode);

    if (newMode === "global") {
      setGlobal();
      onLocationChange("global");
    } else if (newMode === "country") {
      // User will select country from dropdown
      if (country) {
        setGlobalCountry(country);
        onLocationChange("country", country);
      }
    } else if (newMode === "city") {
      // Get user's location
      try {
        await requestCityFromBrowser();
        if (city) {
          onLocationChange("city", city);
          toast.success(`Showing games from ${city}`);
        } else if (ctxCountry) {
          onLocationChange("country", ctxCountry);
        } else {
          onLocationChange("global");
        }
      } catch {
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