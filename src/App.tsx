import 'maplibre-gl/dist/maplibre-gl.css';
import * as R from "react";
import Map, * as M from 'react-map-gl/maplibre';
import { Protocol } from 'pmtiles';
import maplibregl from 'maplibre-gl';
Geolocation.prototype.getCurrentPosition = ()=>{
	alert("TODO (h8avsde9832uef)")
}
function App() {
  R.useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles",protocol.tile);
   return () => {
      maplibregl.removeProtocol("pmtiles");
    }
  }, []);
  return (
    <Map
      mapLib={maplibregl}
      initialViewState={{
        latitude: 38.435491,
        longitude: -78.869914,
        zoom: 16
      }}
      style={{width:"100vw",height:"100vh"}}
      mapStyle="osm-liberty/style.json"
    >
	<M.NavigationControl/>
    	<M.GeolocateControl showUserLocation={false} />
    </Map>
  );
}

export default App;
