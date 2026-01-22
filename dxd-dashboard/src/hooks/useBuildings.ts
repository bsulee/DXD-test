import { useState, useEffect } from 'react';
import { fetchOSMBuildings } from '../data/fetchOSMBuildings';
import type { OSMBuilding, OSMRoad } from '../data/fetchOSMBuildings';
import { fallbackBuildings } from '../data/fallbackBuildings';

// Versioned cache key - increment when data structure changes
const CACHE_KEY = 'asu-osm-data-v2';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  buildings: OSMBuilding[];
  roads: OSMRoad[];
  timestamp: number;
}

export function useBuildings() {
  const [buildings, setBuildings] = useState<OSMBuilding[]>([]);
  const [roads, setRoads] = useState<OSMRoad[]>([]);
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
            console.log(`Using cached OSM data: ${data.buildings.length} buildings, ${data.roads?.length || 0} roads`);
            setBuildings(data.buildings);
            setRoads(data.roads || []);
            setSource('cache');
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Cache read failed, clearing old cache');
        // Clear potentially corrupted cache
        localStorage.removeItem(CACHE_KEY);
        // Also clear old cache key
        localStorage.removeItem('asu-osm-buildings');
      }

      // Try fetching from OSM
      try {
        const osmData = await fetchOSMBuildings();
        if (osmData.buildings.length > 0) {
          setBuildings(osmData.buildings);
          setRoads(osmData.roads);
          setSource('osm');

          // Cache the results
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              buildings: osmData.buildings,
              roads: osmData.roads,
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

      // Fallback to static data (no roads in fallback)
      console.log('Using fallback buildings');
      setBuildings(fallbackBuildings);
      setRoads([]);
      setSource('fallback');
      setIsLoading(false);
    }

    loadBuildings();
  }, []);

  return { buildings, roads, isLoading, source };
}

// Utility function to clear cache (useful for development)
export function clearBuildingCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem('asu-osm-buildings');
  console.log('Cache cleared - will fetch fresh OSM data on next load');
}
