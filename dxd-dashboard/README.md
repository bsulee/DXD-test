# DXD Drone Command Dashboard

A real-time drone fleet command interface demo for Deus X Defense.

## How This Connects to DXD's Mission

This dashboard demonstrates how autonomous drone fleets can provide 24/7 perimeter security. By visualizing drone positions, patrol patterns, and threat responses in real-time, security teams can:

- **Monitor** multiple assets simultaneously from a single interface
- **Respond** to threats instantly with one-click drone dispatch
- **Coordinate** fleet movements across large facilities
- **Track** battery levels, speeds, and operational status

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Demo Script (60 seconds)

### 0-15 seconds
> "This is a unified command view for drone security operations. You can see three drones actively patrolling this facility."

*Point to the moving drone markers on the map. Each drone follows a circular patrol pattern around the facility.*

### 15-30 seconds
> "Watch — a perimeter breach alert just came in."

*A red alert banner appears at the top. The side panel shows alert details.*

> "I can see exactly where it is and which drones are nearby."

### 30-45 seconds
> "One click to dispatch."

*Click the "DISPATCH BRAVO" button in the side panel.*

> "The nearest drone immediately reroutes to investigate."

*Watch as the selected drone changes status to "responding" and flies directly to the alert location.*

### 45-60 seconds
> "In production, this integrates with live telemetry, video feeds, and AI detection. The architecture scales to hundreds of drones."

## Features

- **Live Map View**: Dark-themed Leaflet map with real-time drone positions
- **Patrol Simulation**: Drones follow circular patrol patterns
- **Alert System**: Scripted perimeter breach alert after 5 seconds
- **One-Click Dispatch**: Send nearest drone to threat location
- **Status Panel**: Real-time battery, speed, and status for each drone

## Tech Stack

- **React 18** + **TypeScript** - Modern component architecture
- **Vite** - Fast build tool and dev server
- **Leaflet.js** + **react-leaflet** - Interactive 2D mapping
- **TailwindCSS 4** - Utility-first styling

## In Production, This Would...

1. **Connect to live drone telemetry** via WebSocket streams for real-time position updates at 10Hz
2. **Integrate video feeds** from each drone's onboard camera, displayed in a picture-in-picture view
3. **Use AI-powered detection** (thermal, motion, facial recognition) to automatically generate alerts
4. **Support flight path planning** with no-fly zone overlays and automated collision avoidance
5. **Include historical replay** for incident review and training
6. **Scale to 100+ drones** with server-side aggregation and progressive loading
7. **Provide mobile companion app** for field operators

## File Structure

```
/dxd-dashboard
├── src/
│   ├── App.tsx              # Main app with simulation logic
│   ├── components/
│   │   ├── DroneMap.tsx     # Leaflet map + markers
│   │   └── StatusPanel.tsx  # Drone status sidebar
│   ├── data/
│   │   └── mockData.ts      # Simulated drone & alert data
│   ├── index.css            # Tailwind imports + custom styles
│   └── main.tsx             # React entry point
├── index.html
├── package.json
└── README.md
```

## Deploy

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag & drop 'dist' folder to Netlify
```

## License

Demo project for Deus X Defense.
