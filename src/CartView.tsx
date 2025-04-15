import "maplibre-gl/dist/maplibre-gl.css";
import "./styles/CartView.css";
import { Protocol } from "pmtiles";
import maplibregl, { GeoJSONSource, Marker, Popup } from "maplibre-gl";
import GeoJSON, { Position } from "geojson";
type GeoJSON = GeoJSON.GeoJSON;
import * as ROSLIB from "roslib";
import {
    clicked_point,
    vehicle_state,
    visual_path,
    limited_pose,
    left_image
} from "./topics";
import { Image } from "./MessageTypes";
import { rosToMapCoords, lngLatToMapCoords } from "./transform";
import locations from "./locations.json";
import { PoseWithCovarianceStamped, ROSMarker, VehicleState } from "./MessageTypes";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import TripInfoCard from "./ui/TripInfoCard";
import { Button, Flex, Modal } from "antd"; // Import Modal from Ant Design
import { FaPlayCircle, FaStopCircle } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import DevMenu from "./ui/DevMenu";
import { vehicleService } from "./services/vehicleService";

export default function CartView() {
    const map = useRef<maplibregl.Map | null>(null);
    const mapRef = useRef(null);
    const [currentLocation, setCurrentLocation] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // State for additional info modal
    const [currentLink, setCurrentLink] = useState<string | null>(null); // State to track the current link
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false); // State for confirmation modal
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, long: number, name: string } | null>(null); // State to store the selected location for confirmation

    const [state, setState] = useState<VehicleState>({
        is_navigating: false,
        reached_destination: true,
        stopped: false,
    });

    const PIN_COLORS = [
        'red',
        'blue',
        'orange',
        'green',
        'purple',
        'pink',
        'skyblue'
    ];

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
        setCurrentLink(null); // Reset the current link when modal is closed
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setCurrentLink(null); // Reset the current link when modal is closed
    };

    const handleLinkClick = (url: string) => {
        setCurrentLink(url); // Set the current link to display in the modal
    };

    const handleBack = () => {
        setCurrentLink(null); // Reset the current link to go back to the list of locations
    };

    const handleLocationSelect = (location: { lat: number, long: number, name: string }) => {
        setSelectedLocation(location); // Store the selected location
        setIsConfirmationModalOpen(true); // Open the confirmation modal
    };

    const handleConfirmation = () => {
        if (selectedLocation) {
            navigateToLocation(selectedLocation)
        }
        setIsConfirmationModalOpen(false); // Close the confirmation modal
    };

    const handleConfirmationCancel = () => {
        setSelectedLocation(null); // Deselect the location
        setIsConfirmationModalOpen(false); // Close the confirmation modal
    };

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

    const registerCart = () => {
        console.log("About to register...")
        vehicleService.registerCart("James");
    };

    useEffect(() => {
        if (mapRef.current == undefined) return;

        registerCart();

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
            if (map.current == undefined) return;

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
                if (map.current == undefined) return;

                const markers = message as ROSMarker[];
                visual_path_coordinates = markers.map((m) => rosToMapCoords(m.pose.position));
                const source = map.current.getSource("visual_path") as GeoJSONSource;
                source.setData(LineString(visual_path_coordinates));
            });

            left_image.subscribe((message: ROSLIB.Message) => {
                // console.log(message)
                handle_image_data(message);
            });

            function handle_image_data(message: ROSLIB.Message) {
                const image = message as Image;
                const d = image.data;

                const binaryData = atob(d); // Decode Base64 string into binary data

                const rawData = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                    rawData[i] = binaryData.charCodeAt(i);
                }

                const width = 640;
                const height = 360;
                const rgbaData = new Uint8ClampedArray(width * height * 4);

                for (let i = 0; i < rawData.length; i += 4) {
                    const b = rawData[i];      // Blue
                    const g = rawData[i + 1];  // Green
                    const r = rawData[i + 2];  // Red
                    const a = rawData[i + 3];  // Alpha

                    rgbaData[i] = r;        // Red
                    rgbaData[i + 1] = g;    // Green
                    rgbaData[i + 2] = b;    // Blue
                    rgbaData[i + 3] = a;    // Alpha
                }

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;
                if (ctx) {
                    const actualImageData = ctx.createImageData(width, height);
                    actualImageData.data.set(rgbaData);
                    ctx.putImageData(actualImageData, 0, 0);
                    const base64Image = canvas.toDataURL("image/png");

                    const img = document.getElementById("camera-image") as HTMLImageElement;
                    img.src = base64Image
                    img.width = image.width
                    img.height = image.height
                }

            }

            // Dynamically populate Destinations list with data from locations.json
            locations.forEach((location: { lat: number, long: number, name: string }, index) => {
                if (map.current == undefined) return;

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

                    handleLocationSelect(location); // Open confirmation modal on marker click
                });

                locationPins.push(marker);
            });

            vehicle_state.subscribe((message: ROSLIB.Message) => {
                if (map.current == undefined) return;

                setState(message as VehicleState);
                console.log("Recieved vehicle state message:")
                console.log(message);
                if (state.reached_destination) {
                    const source = map.current.getSource("remaining_path") as GeoJSONSource;
                    source.setData(LineString([]));
                }
            });

            limited_pose.subscribe(function (message: ROSLIB.Message) {
                if (map.current == undefined) return;

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
    }, []);

    return (
        <>
            <div id="split">
                <div id="sidebar">
                    <img id="camera-image"></img>
                    <h2>Destinations</h2>
                    <ul id="destinations">
                        {locations.map((location) => (
                            <li className={clsx('destination-item', { selected: currentLocation == location.name })} role='button' key={location.name}
                                onClick={() => handleLocationSelect(location)}>{location.name}</li>
                        ))}
                    </ul>
                    <div id='trip-info-container'>
                        <TripInfoCard name="My Cart" speed={6} tripProgress={50} />
                    </div>
                    <Button id="info-button" size='large' onClick={showModal}>
                        Additional Location Information
                    </Button>
                </div>

                <div id="map-container">
                    <div ref={mapRef} id="map"></div>
                    <Flex id="map-buttons" gap='middle'>
                        { /* TODO: Only show emergency stop button when cart is navigating */}

                        {state.is_navigating &&
                            <>
                                {
                                    state.stopped ?

                                        <Button id="resume-trip" type="primary" size="large" icon={<FaPlayCircle />}>
                                            Press to Resume Trip
                                        </Button>

                                        :

                                        <Button id="emergency-stop" type="primary" size="large" icon={<FaStopCircle />} danger>
                                            Press for Emergency Stop
                                        </Button>
                                }

                            </>
                        }

                        <Button id="request-help" type="primary" size="large" icon={<IoCall />}>
                            Press to Request Help
                        </Button>
                    </Flex>
                </div>
            </div>

            {/* Ant Design Modal For Additional Location Infrormation */}
            <Modal
                title="Learn More"
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                footer={[
                    currentLink && (
                        <Button key="back" type="default" onClick={handleBack}>
                            Back
                        </Button>
                    ),
                    <Button key="close" type="primary" danger onClick={handleCancel}>
                        Close
                    </Button>
                ]}
                width={currentLink ? "85%" : "40%"}
                className="custom-modal learn-more-modal"
                closable={false}
                style={{ top: '8px' }}
                styles={{
                    body: {
                        padding: 0,
                        backgroundColor: 'var(--jmu-gold)',
                        height: currentLink ? 'calc(80vh)' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        textAlign: 'left',
                    }
                }}
            >
                {currentLink ? (
                    <iframe
                        src={currentLink}
                        className="modal-iframe"
                        title="Link Content"
                    />
                ) : (
                    <ul className="modal-link-list">
                        {locations.map(location => {
                            if (location.url) return (
                                <li className="modal-link-item" onClick={() => handleLinkClick(location.url)}>
                                    {location.name}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                title="Are You Sure?"
                open={isConfirmationModalOpen}
                onOk={handleConfirmation}
                onCancel={handleConfirmationCancel}
                footer={[
                    <Button key="cancel" type="default" danger onClick={handleConfirmationCancel}>
                        Cancel
                    </Button>,
                    <Button key="confirm" type="primary" onClick={handleConfirmation}>
                        Confirm
                    </Button>
                ]}
                width="40%"
                className="custom-modal"
                closable={false}
                style={{ top: '30%' }}
                styles={{
                    body: {
                        padding: '24px', // Add padding to the body
                        backgroundColor: 'var(--jmu-gold)',
                        height: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center', // Center content horizontally
                        textAlign: 'center', // Center text
                        fontSize: '1.2rem', // Increase font size
                    }
                }}
            >
                <p>Are you sure you want to navigate to {selectedLocation?.name}?</p>
            </Modal>

            {process.env.NODE_ENV === 'development' &&
                <DevMenu vehicleState={state} setVehicleState={setState} registerCart={registerCart}></DevMenu>
            }
        </>
    );
}
