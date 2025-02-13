import "maplibre-gl/dist/maplibre-gl.css";
import "./styles/CartView.css"
import { Protocol } from "pmtiles";
import maplibregl, { GeoJSONSource, Marker, Popup } from "maplibre-gl";
import GeoJSON, { Position } from "geojson";
type GeoJSON = GeoJSON.GeoJSON
import * as ROSLIB from "roslib";
import {
    clicked_point,
    vehicle_state,
    visual_path,
    limited_pose,
} from "./topics";
import { rosToMapCoords, lngLatToMapCoords } from "./transform";
import locations from "./locations.json";
import { PoseWithCovarianceStamped, ROSMarker, VehicleState } from "./MessageTypes";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import TripInfoCard from "./ui/TripInfoCard";

export default function CartView() {
    const mapRef = useRef(null)
    const [currentLocation, setCurrentLocation] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const PIN_COLORS = [
        'red',
        'blue',
        'orange',
        'green',
        'purple',
        'pink',
        'skyblue'
    ]

    function navigateTo(lat: number, lng: number) {
        console.log(`Target Coordinates: ${lat}, ${lng}`);
        const [x, y] = lngLatToMapCoords({ lat, lng });
        const target = new ROSLIB.Message({
            point: { x, y, z: 0 },
        });
        clicked_point.publish(target);
    }

    function navigateToLocation(location: { lat: number, long: number, name: string }) {
        if (!state.is_navigating) {
            console.log("Navigating to: " + location.name)
            navigateTo(location.lat, location.long);
            setCurrentLocation(location.name);
        }
    }

    let state: VehicleState = {
        is_navigating: false,
        reached_destination: true,
        stopped: false,
    };

    useEffect(() => {
        if (mapRef.current == undefined) {
            return
        }

        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        const map = new maplibregl.Map({
            container: mapRef.current,
            style: "../basic_map.json",
            center: [-78.861814, 38.433129],
            zoom: 16,
        });

        const nav = new maplibregl.NavigationControl();
        map.addControl(nav, "top-left");

        const locationPins: Marker[] = [];

        map.on("load", async () => {
            const point = (x: number, y: number): GeoJSON => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [x, y],
                },
                properties: {}
            });

            const image = await map.loadImage("osgeo-logo.png");
            map.addImage("custom-marker", image.data);
            function LineString(coordinates: Position[]): GeoJSON {
                return {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: coordinates,
                    },
                    properties: {}
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
                    "line-width": [
                        "interpolate",
                        ["exponential", 1.4],
                        ["zoom"],
                        14, 0,
                        20, 18
                    ],
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
                    "line-width": [
                        "interpolate",
                        ["exponential", 1.4],
                        ["zoom"],
                        14, 0,
                        20, 18
                    ],
                },
            });
            let visual_path_coordinates: number[][] = [];

            visual_path.subscribe((message: ROSLIB.Message) => {
                const markers = message as ROSMarker[];
                visual_path_coordinates = markers.map((m) => rosToMapCoords(m.pose.position));
                const source = map.getSource("visual_path") as GeoJSONSource;
                source.setData(LineString(visual_path_coordinates));
            });



            // Dynamically populate Destinations list with data from locations.json
            locations.forEach((location: { lat: number, long: number, name: string }, index) => {
                const popup = new Popup({
                    anchor: 'bottom',
                    className: 'location-popup',
                    closeButton: false,
                    closeOnClick: false,
                    closeOnMove: false,
                })
                    .setText(location.name)
                    .addTo(map);

                const marker = new Marker({ color: PIN_COLORS[index] })
                    .setLngLat([location.long, location.lat])
                    .setPopup(popup)
                    .addTo(map);

                marker.togglePopup();
                marker.getElement().addEventListener('click', (e) => {
                    e.stopPropagation();

                    navigateToLocation(location)
                });

                locationPins.push(marker);


            });

            vehicle_state.subscribe((message: ROSLIB.Message) => {
                state = message as VehicleState;
                console.log("Recieved vehicle state message:")
                console.log(message);
                if (state.reached_destination) {
                    const source = map.getSource("remaining_path") as GeoJSONSource;
                    source.setData(LineString([]));
                }
            });

            limited_pose.subscribe(function (message: ROSLIB.Message) {
                const poseWithCovariance = message as PoseWithCovarianceStamped;
                const [x1, y1] = rosToMapCoords(poseWithCovariance.pose.position);
                const source = map.getSource("limited_pose") as GeoJSONSource;
                source.setData(point(x1, y1));

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

                    const source = map.getSource("remaining_path") as GeoJSONSource;
                    source.setData(LineString(visual_path_coordinates.slice(closestInd)));

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
    }, [])

    return (
        <>
        <div id="split">
            <div id="split2">
                <h2>Destinations</h2>
                <ul id="destinations">
                    {locations.map((location) => (
                        <li className={clsx('destination-item', { selected: currentLocation == location.name })} role='button' key={location.name}
                            onClick={() => navigateToLocation(location)}>{location.name}</li>
                    ))}
                </ul>
                <TripInfoCard name="My cart" speed={6} tripProgress={50}/>
                <button id="info-button" onClick={() => 
                {

                    const popup = document.getElementById('popup');
                    const overlay = document.getElementById('overlay');
                    popup.style.display = 'block';
                    overlay.style.display = 'block';

                }
            }>Additional Location Information</button>

            </div>

            <div ref={mapRef} id="map"></div>
        </div>
        <div id="overlay"></div>
        <div id="popup">
            <h3>Learn More</h3>
            <ul>
                <li><a href="https://www.jmu.edu/festival/index.shtml" target="_blank">Festival Conference & Student Center</a></li>
                <li><a href="https://jmu.campusdish.com/LocationsAndMenus/PODinEnGeo" target="_blank">P.O.D. in EnGeo</a></li>
                <li><a href="https://www.jmu.edu/orl/our-residence-halls/area-skyline.shtml" target="_blank">Chesapeake Hall</a></li>
                <li><a href="https://map.jmu.edu/?id=1869#!ct/0?m/576605?s/" target="_blank">King Hall</a></li>
                <li><a href="https://map.jmu.edu/?id=1869#!bm/?ct/0?m/623302?s/Paul" target="_blank">Paul Jennings Hall</a></li>
                <li><a href="https://map.jmu.edu/?id=1869#!bm/?ct/0?m/622822?s/E-hall" target="_blank">E-Hall</a></li>
            </ul>
            <button onClick={() => 
            {
                const popup = document.getElementById('popup');
                const overlay = document.getElementById('overlay');
                popup.style.display = 'none';
                overlay.style.display = 'none';
            }
            }>Close</button>
        </div>
        </>
        
    )
}
