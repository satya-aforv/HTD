import { useState, useEffect, useCallback } from 'react';
import { State, City } from 'country-state-city';

interface LocationOption {
  value: string;
  label: string;
  isoCode?: string;
}

interface LocationDetails {
  pincode: string;
  city: string;
  state: string;
  country: string;
  area?: string;
}

interface UseLocationDataReturn {
  states: LocationOption[];
  cities: LocationOption[];
  loadCitiesForState: (stateName: string) => void;
  searchPincodes: (query: string) => Promise<LocationOption[]>;
  getLocationByPincode: (pincode: string) => Promise<LocationDetails | null>;
  generatePincodes: (query: string) => LocationOption[];
  isValidPincode: (pincode: string) => boolean;
}

export const useLocationData = (): UseLocationDataReturn => {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);

  // Load Indian states on hook initialization
  useEffect(() => {
    const indianStates = State.getStatesOfCountry('IN');
    const stateOptions = indianStates.map(state => ({
      value: state.name,
      label: state.name,
      isoCode: state.isoCode
    }));
    setStates(stateOptions);
  }, []);

  // Load cities for a specific state
  const loadCitiesForState = useCallback((stateName: string) => {
    const indianStates = State.getStatesOfCountry('IN');
    const selectedState = indianStates.find(state => state.name === stateName);
    
    if (selectedState) {
      const stateCities = City.getCitiesOfState('IN', selectedState.isoCode);
      const cityOptions = stateCities.map(city => ({
        value: city.name,
        label: city.name
      }));
      setCities(cityOptions);
    } else {
      setCities([]);
    }
  }, []);

  // Validate pincode format
  const isValidPincode = useCallback((pincode: string): boolean => {
    return /^\d{6}$/.test(pincode);
  }, []);

  // Generate pincode suggestions based on input (fallback)
  const generatePincodes = useCallback((query: string): LocationOption[] => {
    if (!query || query.length === 0) return [];
    
    const pincodes: LocationOption[] = [];
    
    // Only generate if input is numeric
    if (!/^\d+$/.test(query)) return [];
    
    // Generate variations based on the input length
    const maxSuggestions = 10;
    const targetLength = 6;
    
    if (query.length < targetLength) {
      // Generate suggestions by padding with different digits
      for (let i = 0; i < 10 && pincodes.length < maxSuggestions; i++) {
        const pincode = query + i.toString().repeat(targetLength - query.length);
        if (pincode.length === targetLength) {
          pincodes.push({
            value: pincode,
            label: pincode
          });
        }
      }
    } else if (query.length === targetLength) {
      // If exact length, just return the input
      pincodes.push({
        value: query,
        label: query
      });
    }
    
    return pincodes;
  }, []);

  // Search for pincodes using Indian Postal API
  const searchPincodes = useCallback(async (query: string): Promise<LocationOption[]> => {
    if (!query || query.length < 3) return [];
    
    try {
      // Search by pincode
      const response = await fetch(`https://api.postalpincode.in/pincode/${query}`);
      
      if (!response.ok) {
        console.warn('Failed to fetch pincode data from API');
        return generatePincodes(query); // Fallback to generated suggestions
      }
      
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const postOffices = data[0].PostOffice as Array<{
          Name: string;
          Pincode: string;
          District: string;
          State: string;
        }>;
        
        const pincodes = postOffices
          .filter((office) => office.Pincode && /^\d{6}$/.test(office.Pincode))
          .map((office) => ({
            value: office.Pincode,
            label: `${office.Pincode} - ${office.Name}, ${office.District}, ${office.State}`
          }))
          .filter((pincode, index, arr) => 
            arr.findIndex(p => p.value === pincode.value) === index
          ); // Remove duplicates
        
        return pincodes;
      }
      
      return generatePincodes(query); // Fallback
    } catch (error) {
      console.error('Error searching pincodes:', error);
      return generatePincodes(query); // Fallback
    }
  }, [generatePincodes]);

  // Get location details by pincode
  const getLocationByPincode = useCallback(async (pincode: string): Promise<LocationDetails | null> => {
    if (!pincode || !isValidPincode(pincode)) return null;
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      
      if (!response.ok) {
        console.warn('Failed to fetch location data for pincode');
        return null;
      }
      
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0] as {
          Name: string;
          Pincode: string;
          District: string;
          State: string;
          Country: string;
        };
        
        return {
          pincode: postOffice.Pincode,
          city: postOffice.District,
          state: postOffice.State,
          country: postOffice.Country || 'India',
          area: postOffice.Name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching location by pincode:', error);
      return null;
    }
  }, [isValidPincode]);

  return {
    states,
    cities,
    loadCitiesForState,
    searchPincodes,
    getLocationByPincode,
    generatePincodes,
    isValidPincode
  };
};
