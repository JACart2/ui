# JACart2 / ui
A user interface for autonomous navigation of a JACART.

# Important Tools/Libraries Used
- [React](https://react.dev/): for implementing ui elements declaratively.
- [Ant Design](https://ant.design/components/overview/): to provide accessible UI components across the app.
- [Maplibre](https://maplibre.org/): for rendering the map
- [React Map GL](https://visgl.github.io/react-map-gl/): react wrapper for Maplibre
- [OpenStreetMap](https://www.openstreetmap.org/#map=17/38.43711/-78.87157): Current map data was directly exported from OpenStreetMap
- [OSM Liberty](https://github.com/maputnik/osm-liberty): Open Source style for the map. Copied and modified in [public/osm-liberty/](public/osm-liberty/)
- [pmtiles](https://www.npmjs.com/package/pmtiles): Provides protocol that enables loading map from a singular static file.
- [Tilemaker](https://github.com/systemed/tilemaker/): Convert .osm.pbf file to .pmtiles
- [Osmconvert](https://wiki.openstreetmap.org/wiki/Osmconvert): Convert .osm (exported from OSM) file to .osm.pbf

# Prerequisites
- [Node.js](https://nodejs.org/en)

# Installation & Running
`npm install`
`npm install regenerator-runtime`
`npm install fuse.js`
`npm run dev`