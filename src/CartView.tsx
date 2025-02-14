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
import { Button, Flex } from "antd";
import { FaStop } from "react-icons/fa6";
import { FaStopCircle } from "react-icons/fa";
import { IoCall, IoWarning } from "react-icons/io5";

export default function CartView() {
    const map = useRef<maplibregl.Map | null>(null);
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
        if (mapRef.current == undefined) return

        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        map.current = new maplibregl.Map({
            container: mapRef.current,
            style: "/basic_map.json",
            center: [-78.861814, 38.433129],
            zoom: 16,
            attributionControl: false
        });

        const nav = new maplibregl.NavigationControl();
        map.current.addControl(nav, "top-left");
        map.current.addControl(new maplibregl.AttributionControl(), 'top-right');

        const locationPins: Marker[] = [];

        map.current.on("load", async () => {
            if (map.current == undefined) return

            const point = (x: number, y: number): GeoJSON => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [x, y],
                },
                properties: {}
            });

            const image = await map.current.loadImage("osgeo-logo.png");
            map.current.addImage("custom-marker", image.data);
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
            map.current.addSource("limited_pose", {
                type: "geojson",
                data: point(-78.869914, 38.435491),
            });

            map.current.addSource("visual_path", {
                type: "geojson",
                data: LineString([]),
            });
            map.current.addSource("remaining_path", {
                type: "geojson",
                data: LineString([]),
            });


            map.current.addLayer({
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
            map.current.addLayer({
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
                if (map.current == undefined) return

                const markers = message as ROSMarker[];
                visual_path_coordinates = markers.map((m) => rosToMapCoords(m.pose.position));
                const source = map.current.getSource("visual_path") as GeoJSONSource;
                source.setData(LineString(visual_path_coordinates));
            });



            // Dynamically populate Destinations list with data from locations.json
            locations.forEach((location: { lat: number, long: number, name: string }, index) => {
                if (map.current == undefined) return

                const popup = new Popup({
                    anchor: 'bottom',
                    className: 'location-popup',
                    closeButton: false,
                    closeOnClick: false,
                    closeOnMove: false,
                })
                    .setText(location.name)

                const marker = new Marker({ color: PIN_COLORS[index] })
                    .setLngLat([location.long, location.lat])
                    .setPopup(popup)
                    .addTo(map.current);

                marker.togglePopup();
                marker.getElement().addEventListener('click', (e) => {
                    e.stopPropagation();

                    navigateToLocation(location)
                });

                locationPins.push(marker);


            });

            vehicle_state.subscribe((message: ROSLIB.Message) => {
                if (map.current == undefined) return

                state = message as VehicleState;
                console.log("Recieved vehicle state message:")
                console.log(message);
                if (state.reached_destination) {
                    const source = map.current.getSource("remaining_path") as GeoJSONSource;
                    source.setData(LineString([]));
                }
            });

            limited_pose.subscribe(function (message: ROSLIB.Message) {
                if (map.current == undefined) return

                const poseWithCovariance = message as PoseWithCovarianceStamped;
                const [x1, y1] = rosToMapCoords(poseWithCovariance.pose.position);
                const source = map.current.getSource("limited_pose") as GeoJSONSource;
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

                    const source = map.current.getSource("remaining_path") as GeoJSONSource;
                    source.setData(LineString(visual_path_coordinates.slice(closestInd)));

                    map.current.flyTo({
                        center: [x1, y1],
                        zoom: 19,
                    });
                }
            });

            map.current.addLayer({
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
                <div id="sidebar">
                    <h2>Destinations</h2>
                    <ul id="destinations">
                        {locations.map((location) => (
                            <li className={clsx('destination-item', { selected: currentLocation == location.name })} role='button' key={location.name}
                                onClick={() => navigateToLocation(location)}>{location.name}</li>
                        ))}
                    </ul>
                    <div id='trip-info-container'>
                        <TripInfoCard name="My Cart" speed={6} tripProgress={50} />
                    </div>
                    <Button id="info-button" size='large' onClick={() => {

                        const popup = document.getElementById('popup');
                        const overlay = document.getElementById('overlay');
                        popup.style.display = 'block';
                        overlay.style.display = 'block';

                    }
                    }>Additional Location Information</Button>
                </div>

                <div id="map-container">
                    <div ref={mapRef} id="map"></div>
                    <Flex id="map-buttons" gap='middle'>
                        { /* TODO: Only show emergency stop button when cart is navigating */}
                        <Button id="emergency-stop" type="primary" size="large" icon={<FaStopCircle />} danger>
                            Press for Emergency Stop
                        </Button>
                        <Button id="request-help" type="primary" size="large" icon={<IoCall />}>
                            Press to Request Help
                        </Button>
                    </Flex>
                </div>
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
                <button onClick={() => {
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
