import { useState, useEffect } from 'react';
import { fetchOSMBuildings } from '../data/fetchOSMBuildings';
import type { OSMBuilding } from '../data/fetchOSMBuildings';
import { fallbackBuildings } from '../data/fallbackBuildings';

const CACHE_KEY = 'asu-osm-buildings';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  buildings: OSMBuilding[];
  timestamp: number;
}

export function useBuildings() {
  const [buildings, setBuildings] = useState<OSMBuilding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'osm' | 'cache' | 'fallback'>('fallback');

  useEffect(() => {
    async function loadBuildings() {
      // Try cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const data: CachedData = JSON.parse(cached);
          if (Date.now() - data.timestamp < CACHE_DURATION) {
            console.log('Using cached OSM buildings');
            setBuildings(data.buildings);
            setSource('cache');
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Cache read failed');
      }

      // Try fetching from OSM
      try {
        const osmBuildings = await fetchOSMBuildings();
        if (osmBuildings.length > 0) {
          setBuildings(osmBuildings);
          setSource('osm');

          // Cache the results
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              buildings: osmBuildings,
              timestamp: Date.now(),
            }));
          } catch (e) {
            console.log('Cache write failed');
          }

          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('OSM fetch failed:', e);
      }

      // Fallback to static data
      console.log('Using fallback buildings');
      setBuildings(fallbackBuildings);
      setSource('fallback');
      setIsLoading(false);
    }

    loadBuildings();
  }, []);

  return { buildings, isLoading, source };
}
