// Comprehensive ASU Tempe Campus - Based on actual satellite/map data
// Buildings positioned and sized to match real campus layout

import type { OSMBuilding } from './fetchOSMBuildings';

// Color palette matching ASU architecture
const COLORS = {
  brick: '#9B4B3C',      // Classic ASU brick
  sandstone: '#D4A574',  // Desert sandstone
  modern: '#6B7B8C',     // Modern gray buildings
  stadium: '#4A4A4A',    // Concrete structures
  glass: '#5A7A9A',      // Glass/modern buildings
  residential: '#C9A86C', // Dorm buildings
  terracotta: '#C65D3B', // Terracotta roofs
  cream: '#E8DCC4',      // Light colored buildings
};

export const fallbackBuildings: OSMBuilding[] = [
  // ==========================================
  // HAYDEN LIBRARY AREA (Central Campus)
  // ==========================================
  {
    id: 101,
    name: 'Hayden Library',
    lat: 33.4197,
    lng: -111.9341,
    width: 70,
    depth: 55,
    height: 15,
    color: COLORS.brick,
  },
  {
    id: 102,
    name: 'Hayden Library Annex',
    lat: 33.4193,
    lng: -111.9335,
    width: 30,
    depth: 25,
    height: 10,
    color: COLORS.brick,
  },

  // ==========================================
  // MEMORIAL UNION AREA
  // ==========================================
  {
    id: 201,
    name: 'Memorial Union',
    lat: 33.4178,
    lng: -111.9361,
    width: 65,
    depth: 50,
    height: 12,
    color: COLORS.sandstone,
  },
  {
    id: 202,
    name: 'MU Annex',
    lat: 33.4182,
    lng: -111.9368,
    width: 25,
    depth: 20,
    height: 8,
    color: COLORS.sandstone,
  },

  // ==========================================
  // OLD MAIN / ADMINISTRATION
  // ==========================================
  {
    id: 301,
    name: 'Old Main',
    lat: 33.4181,
    lng: -111.9326,
    width: 50,
    depth: 35,
    height: 18,
    color: COLORS.brick,
  },
  {
    id: 302,
    name: 'Administration Building',
    lat: 33.4175,
    lng: -111.9320,
    width: 40,
    depth: 30,
    height: 12,
    color: COLORS.sandstone,
  },

  // ==========================================
  // ENGINEERING / FULTON CENTER
  // ==========================================
  {
    id: 401,
    name: 'Fulton Center',
    lat: 33.4215,
    lng: -111.9285,
    width: 55,
    depth: 45,
    height: 14,
    color: COLORS.modern,
  },
  {
    id: 402,
    name: 'Engineering Center A',
    lat: 33.4220,
    lng: -111.9305,
    width: 50,
    depth: 40,
    height: 12,
    color: COLORS.modern,
  },
  {
    id: 403,
    name: 'Engineering Center B',
    lat: 33.4225,
    lng: -111.9295,
    width: 45,
    depth: 35,
    height: 12,
    color: COLORS.modern,
  },
  {
    id: 404,
    name: 'Goldwater Center',
    lat: 33.4210,
    lng: -111.9295,
    width: 60,
    depth: 40,
    height: 10,
    color: COLORS.glass,
  },
  {
    id: 405,
    name: 'ISTB 1',
    lat: 33.4205,
    lng: -111.9275,
    width: 50,
    depth: 45,
    height: 14,
    color: COLORS.glass,
  },

  // ==========================================
  // SCIENCE BUILDINGS
  // ==========================================
  {
    id: 501,
    name: 'Physical Sciences',
    lat: 33.4200,
    lng: -111.9358,
    width: 70,
    depth: 45,
    height: 11,
    color: COLORS.cream,
  },
  {
    id: 502,
    name: 'Life Sciences A',
    lat: 33.4195,
    lng: -111.9375,
    width: 50,
    depth: 40,
    height: 10,
    color: COLORS.cream,
  },
  {
    id: 503,
    name: 'Life Sciences B',
    lat: 33.4190,
    lng: -111.9385,
    width: 45,
    depth: 35,
    height: 10,
    color: COLORS.cream,
  },
  {
    id: 504,
    name: 'Biodesign A',
    lat: 33.4185,
    lng: -111.9395,
    width: 55,
    depth: 50,
    height: 12,
    color: COLORS.glass,
  },
  {
    id: 505,
    name: 'Biodesign B',
    lat: 33.4178,
    lng: -111.9390,
    width: 55,
    depth: 50,
    height: 12,
    color: COLORS.glass,
  },

  // ==========================================
  // STADIUM DISTRICT
  // ==========================================
  {
    id: 601,
    name: 'Sun Devil Stadium',
    lat: 33.4256,
    lng: -111.9326,
    width: 120,
    depth: 90,
    height: 25,
    color: COLORS.stadium,
  },
  {
    id: 602,
    name: 'Wells Fargo Arena',
    lat: 33.4245,
    lng: -111.9360,
    width: 70,
    depth: 65,
    height: 18,
    color: COLORS.stadium,
  },
  {
    id: 603,
    name: 'Sun Devil Fitness Complex',
    lat: 33.4238,
    lng: -111.9340,
    width: 60,
    depth: 80,
    height: 10,
    color: COLORS.modern,
  },
  {
    id: 604,
    name: 'Packard Stadium',
    lat: 33.4260,
    lng: -111.9295,
    width: 80,
    depth: 60,
    height: 8,
    color: COLORS.stadium,
  },

  // ==========================================
  // BUSINESS / WEST CAMPUS
  // ==========================================
  {
    id: 701,
    name: 'W.P. Carey School',
    lat: 33.4220,
    lng: -111.9370,
    width: 60,
    depth: 50,
    height: 12,
    color: COLORS.sandstone,
  },
  {
    id: 702,
    name: 'McCord Hall',
    lat: 33.4228,
    lng: -111.9380,
    width: 55,
    depth: 40,
    height: 14,
    color: COLORS.modern,
  },
  {
    id: 703,
    name: 'Brickyard',
    lat: 33.4215,
    lng: -111.9390,
    width: 45,
    depth: 35,
    height: 10,
    color: COLORS.brick,
  },

  // ==========================================
  // GAMMAGE / ARTS
  // ==========================================
  {
    id: 801,
    name: 'Gammage Auditorium',
    lat: 33.4140,
    lng: -111.9405,
    width: 70,
    depth: 70,
    height: 15,
    color: COLORS.terracotta,
  },
  {
    id: 802,
    name: 'Music Building',
    lat: 33.4155,
    lng: -111.9395,
    width: 50,
    depth: 60,
    height: 10,
    color: COLORS.sandstone,
  },
  {
    id: 803,
    name: 'ASU Art Museum',
    lat: 33.4162,
    lng: -111.9385,
    width: 40,
    depth: 35,
    height: 12,
    color: COLORS.modern,
  },
  {
    id: 804,
    name: 'Dance Building',
    lat: 33.4148,
    lng: -111.9385,
    width: 35,
    depth: 40,
    height: 8,
    color: COLORS.cream,
  },

  // ==========================================
  // RESIDENTIAL HALLS
  // ==========================================
  {
    id: 901,
    name: 'Manzanita Hall',
    lat: 33.4160,
    lng: -111.9308,
    width: 80,
    depth: 30,
    height: 16,
    color: COLORS.residential,
  },
  {
    id: 902,
    name: 'Palo Verde East',
    lat: 33.4152,
    lng: -111.9290,
    width: 45,
    depth: 55,
    height: 14,
    color: COLORS.residential,
  },
  {
    id: 903,
    name: 'Palo Verde West',
    lat: 33.4152,
    lng: -111.9325,
    width: 45,
    depth: 55,
    height: 14,
    color: COLORS.residential,
  },
  {
    id: 904,
    name: 'Hassayampa',
    lat: 33.4142,
    lng: -111.9350,
    width: 70,
    depth: 45,
    height: 12,
    color: COLORS.residential,
  },
  {
    id: 905,
    name: 'Barrett Honors Complex',
    lat: 33.4145,
    lng: -111.9310,
    width: 55,
    depth: 50,
    height: 10,
    color: COLORS.sandstone,
  },
  {
    id: 906,
    name: 'Tooker House',
    lat: 33.4230,
    lng: -111.9265,
    width: 60,
    depth: 45,
    height: 12,
    color: COLORS.modern,
  },

  // ==========================================
  // ADDITIONAL ACADEMIC BUILDINGS
  // ==========================================
  {
    id: 1001,
    name: 'Social Sciences',
    lat: 33.4188,
    lng: -111.9312,
    width: 50,
    depth: 40,
    height: 10,
    color: COLORS.brick,
  },
  {
    id: 1002,
    name: 'Language & Literature',
    lat: 33.4185,
    lng: -111.9350,
    width: 55,
    depth: 35,
    height: 9,
    color: COLORS.sandstone,
  },
  {
    id: 1003,
    name: 'Coor Hall',
    lat: 33.4170,
    lng: -111.9335,
    width: 60,
    depth: 45,
    height: 11,
    color: COLORS.cream,
  },
  {
    id: 1004,
    name: 'Discovery Hall',
    lat: 33.4208,
    lng: -111.9345,
    width: 40,
    depth: 35,
    height: 8,
    color: COLORS.modern,
  },
  {
    id: 1005,
    name: 'Armstrong Hall',
    lat: 33.4165,
    lng: -111.9370,
    width: 45,
    depth: 35,
    height: 10,
    color: COLORS.brick,
  },
  {
    id: 1006,
    name: 'Computing Commons',
    lat: 33.4202,
    lng: -111.9322,
    width: 35,
    depth: 30,
    height: 6,
    color: COLORS.glass,
  },
  {
    id: 1007,
    name: 'Noble Library',
    lat: 33.4188,
    lng: -111.9340,
    width: 45,
    depth: 40,
    height: 10,
    color: COLORS.brick,
  },
  {
    id: 1008,
    name: 'Durham Hall',
    lat: 33.4175,
    lng: -111.9295,
    width: 40,
    depth: 35,
    height: 9,
    color: COLORS.sandstone,
  },

  // ==========================================
  // PARKING STRUCTURES (darker)
  // ==========================================
  {
    id: 1101,
    name: 'Fulton Parking',
    lat: 33.4225,
    lng: -111.9270,
    width: 50,
    depth: 70,
    height: 8,
    color: '#3A3A3A',
  },
  {
    id: 1102,
    name: 'Rural Road Parking',
    lat: 33.4180,
    lng: -111.9270,
    width: 45,
    depth: 60,
    height: 8,
    color: '#3A3A3A',
  },
  {
    id: 1103,
    name: 'Stadium Parking',
    lat: 33.4270,
    lng: -111.9355,
    width: 55,
    depth: 70,
    height: 6,
    color: '#3A3A3A',
  },
];
