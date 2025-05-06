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
- [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition): A React library for browser-based speech recognition.
- [fuse.js](https://www.fusejs.io/): A fuzzy-search library to interpret partial or mispronounced commands.


# Prerequisites
- [Node.js](https://nodejs.org/en)

# Voice Commands
- Command word: Say __"James"__ before saying any commands for the cart to start listening.
- Navigation Command: Say __"go to [location]"__ and the cart will begin navigation once the selection is confirmed. 
- Confirmation Command: Say __"confirm"__ once a location is selected to begin navigation.
- Cancellation Command: Say __"cancel"__ to deselect a location.
- Emergency Stop Command: Say __"stop"__ to initiate a remote emergency stop during navigation.
- Resume Command: Say __"resume"__ to resume cart navigation after it has been stopped.

# Installation & Running
`npm install`
`npm install regenerator-runtime`
`npm install fuse.js`
`npm run dev`
