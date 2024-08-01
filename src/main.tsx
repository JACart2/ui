import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import maplibregl from "maplibre-gl";
import * as ROSLIB from "roslib";
import {
  clicked_point,
  vehicle_state,
  visual_path,
  limited_pose,
} from "./topics";
import { T, Y } from "./transform";

let protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);
let map = new maplibregl.Map({
  container: "map",
  style: "osm-liberty/style.json",
  center: [-78.869914, 38.435491],
  zoom: 16,
});

let nav = new maplibregl.NavigationControl();
map.addControl(nav, "top-left");

map.on("load", async () => {
  let point = (x, y) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [x, y],
    },
  });

  const image = await map.loadImage("osgeo-logo.png");
  map.addImage("custom-marker", image.data);
  function LineString(coordinates) {
    return {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coordinates,
      },
    };
  }
  map.addSource("limited_pose", {
    type: "geojson",
    data: point(-78.869914, 38.435491),
  });

  map.addSource("visual_path", {
    type: "geojson",
    data: LineString([]),
  });
  map.addSource("remaining_path", {
    type: "geojson",
    data: LineString([]),
  });

  map.addLayer({
    id: "visual_path",
    type: "line",
    source: "visual_path",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#bdcff0", // '#6495ED',
      "line-opacity": 1,
      "line-width": {
        base: 1.4,
        stops: [
          [14, 0],
          [20, 18],
        ],
      },
    },
  });
  map.addLayer({
    id: "remaining_path",
    type: "line",
    source: "remaining_path",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#6495ED",
      "line-opacity": 1,
      "line-width": {
        base: 1.4,
        stops: [
          [14, 0],
          [20, 18],
        ],
      },
    },
  });

  let visual_path_coordinates = [];
  visual_path.subscribe(function ({ markers }) {
    visual_path_coordinates = markers.map((m) => T(m.pose.position));
    map.getSource("visual_path").setData(LineString(visual_path_coordinates));
  });

  function navigateTo(lat, lng) {
    const [x, y] = Y({ lat, lng });
    let target = new ROSLIB.Message({
      point: { x, y, z: 0 },
    });
    clicked_point.publish(target);
  }
  [
    ...document.getElementById("destinations").getElementsByTagName("li"),
  ].forEach((el) => {
    const lat = parseFloat(el.getAttribute("lat"));
    const long = parseFloat(el.getAttribute("long"));
    el.addEventListener("click", () => {
      console.log(lat, long);
      if (!state.is_navigating) {
        navigateTo(lat, long);
        [
          ...document.getElementById("destinations").getElementsByTagName("li"),
        ].forEach((el2) => {
          el2.classList.remove("selected");
        });

        el.classList.add("selected");
      }
    });
  });

  vehicle_state.subscribe(function (message) {
    state = message;
    console.log(message);
    if (message.reached_destination) {
      map.getSource("remaining_path").setData(LineString([]));
    }
  });

  limited_pose.subscribe(function (message) {
    let [x1, y1] = T(message.pose.pose.position);
    let source = map.getSource("limited_pose").setData(point(x1, y1));

    if (visual_path_coordinates.length > 0 && state.is_navigating) {
      let closestInd = 0;
      let closestDist = Infinity;
      for (let i = 0; i < visual_path_coordinates.length; i++) {
        const [x2, y2] = visual_path_coordinates[i];
        const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        if (dist < closestDist) {
          closestInd = i;
          closestDist = dist;
        }
      }

      map
        .getSource("remaining_path")
        .setData(LineString(visual_path_coordinates.slice(closestInd)));

      map.flyTo({
        center: [x1, y1],
        zoom: 19,
      });
    }
  });

  map.addLayer({
    id: "limited_pose",
    type: "symbol",
    source: "limited_pose",
    layout: {
      "icon-image": "custom-marker",
    },
  });
});
