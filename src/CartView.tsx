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
import { Image, ROSMarkerList } from "./MessageTypes";
import { rosToMapCoords, lngLatToMapCoords } from "./transform";
import locations from "./locations.json";
import { PoseWithCovarianceStamped, VehicleState } from "./MessageTypes";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import TripInfoCard from "./ui/TripInfoCard";
import { Button, Flex, Modal, Tour, TourProps, ConfigProvider, message } from "antd";
import { FaPlayCircle, FaStopCircle } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import DevMenu from "./ui/DevMenu";
import VoiceCommands from "./VoiceRecognition";
import { useTTS } from './useTTS';
import { vehicleService } from "./services/vehicleService";

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

export default function CartView() {
    const map = useRef<maplibregl.Map | null>(null);
    const mapRef = useRef(null);
    const [currentLocation, setCurrentLocation] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentLink, setCurrentLink] = useState<string | null>(null);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, long: number, name: string, displayName: string } | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const { speak } = useTTS();

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

    // Refs for Tour targets
    const ref1 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);
    const ref4 = useRef(null);
    const ref5 = useRef(null);

    // Reusable button styles for the Tour component
    const tourButtonStyles = {
        style: {
            backgroundColor: 'var(--jmu-purple)',
            color: 'white',
            border: 'none',
            padding: '17px 25px',
            fontSize: '1.25rem',
            borderRadius: '5px',
        },
    };

    // Reusable popup styles for the Tour component
    const tourPopupStyles = {
        maxWidth: '600px',
        fontSize: '1.2rem',
        padding: '20px',
    };

    // Tour steps
    const steps: TourProps['steps'] = [
        {
            title: 'Select a Destination',
            description: 'Here are the selectable destinations. Click one or use the voice command "James go to [location name]" in order to select a destination. Then select Confirm or say "James Confirm" for the cart to begin navigating.',
            target: () => ref1.current,
            style: tourPopupStyles,
            nextButtonProps: {
                children: 'Next',
                ...tourButtonStyles,
            },
            prevButtonProps: {
                children: 'Previous',
                ...tourButtonStyles,
            },
        },
        {
            title: 'Map View',
            description: 'Here are the selectable locations on the map. You can also click on the markers to navigate.',
            target: () => ref2.current,
            style: tourPopupStyles,
            nextButtonProps: {
                children: 'Next',
                ...tourButtonStyles,
            },
            prevButtonProps: {
                children: 'Previous',
                ...tourButtonStyles,
            },
        },
        {
            title: 'Additional Location Information',
            description: 'This button provides more in-depth information about all the selectable locations.',
            target: () => ref3.current,
            style: tourPopupStyles,
            nextButtonProps: {
                children: 'Next',
                ...tourButtonStyles,
            },
            prevButtonProps: {
                children: 'Previous',
                ...tourButtonStyles,
            },
        },
        {
            title: 'Emergency Stop Button',
            description: 'Press this button to stop the cart if needed. This button will only be visible when the cart is Navigating. In order to resume navigation there will be a resume button located in the same spot.',
            target: () => ref4.current,
            style: tourPopupStyles,
            nextButtonProps: {
                children: 'Next',
                ...tourButtonStyles,
            },
            prevButtonProps: {
                children: 'Previous',
                ...tourButtonStyles,
            },
        },
        {
            title: 'Request Help',
            description: 'Press this button to request help if you need assistance.',
            target: () => ref5.current,
            style: tourPopupStyles,
            nextButtonProps: {
                children: 'Next',
                ...tourButtonStyles,
            },
            prevButtonProps: {
                children: 'Previous',
                ...tourButtonStyles,
            },
        },
    ];

    const customTourTokens = {
        closeBtnSize: 26,
        primaryNextBtnHoverBg: 'var(--jmu-gold)',
        primaryPrevBtnBg: 'var(--jmu-purple)',
        zIndexPopup: 1070,
    };

    const [isTutorialPromptOpen, setIsTutorialPromptOpen] = useState(true); // Set to true to show on launch

    const ros = new ROSLIB.Ros({
        url: "http://localhost:5173/" // Replace with your ROS WebSocket URL if different
    });

    ros.on("connection", () => {
        console.log("Connected to ROS");
    });

    ros.on("error", (error) => {
        console.log("Error connecting to ROS: ", error);
    });

    ros.on("close", () => {
        console.log("Connection to ROS closed");
    });

    const stop_topic = new ROSLIB.Topic({
        ros: ros,
        name: "/set_manual_control",
        messageType: "std_msgs/Bool"
    });

    const nav_cmd = new ROSLIB.Topic({
        ros: ros,
        name: "/nav_cmd",
        messageType: "motor_control_interface/msg/VelAngle"
    });

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = () => {
        setIsModalOpen(false);
        setCurrentLink(null);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setCurrentLink(null);
    };

    const handleLinkClick = (url: string) => {
        setCurrentLink(url);
    };

    const handleBack = () => {
        setCurrentLink(null);
    };

    const handleLocationSelect = (location: { lat: number, long: number, name: string, displayName: string }) => {
        setSelectedLocation(location);
        setIsConfirmationModalOpen(true);
        setCurrentLocation(null); // Clear current location when selecting a new one
        speak(`Confirm to go to ${location.name}`);
    };

    const handleConfirmation = () => {
        if (selectedLocation) {
            speak(`Now navigating to ${selectedLocation.name}`);
            setState(prev => ({ ...prev, is_navigating: true, reached_destination: false }));
            navigateToLocation(selectedLocation);
        }
        setIsConfirmationModalOpen(false);
    };

    const handleConfirmationCancel = () => {
        setSelectedLocation(null);
        setIsConfirmationModalOpen(false);
        speak("Navigation cancelled");
    };

    const stopCart = () => {
        console.log("Initiating immediate stop...");

        // Publish zero velocity and angle for complete stop (like 'x' key in teleop)
        const stopMsg = new ROSLIB.Message({
            vel: 0.0,
            angle: 0.0
        });
        nav_cmd.publish(stopMsg);

        // Also publish to manual control topic to ensure stop
        const manualStopMsg = new ROSLIB.Message({ data: true });
        stop_topic.publish(manualStopMsg);

        // Update vehicle state
        const stateMsg = new ROSLIB.Message({
            is_navigating: false,
            reached_destination: state.reached_destination,
            stopped: true,
        });
        vehicle_state.publish(stateMsg);

        setState(prev => ({
            ...prev,
            is_navigating: false,
            stopped: true
        }));

        message.success("Cart stopped immediately");
        speak("Cart stopped");
    };

    const handleCommand = (command: string) => {
        console.log("Command received:", command);

        if (command === "STOP") {
            console.log("STOP command recognized");
            stopCart();
        } else if (command === "HELP") {
            console.log("HELP command recognized");
            message.info("Help requested.");
            speak("Help requested");
        } else if (command === "RESUME") {
            console.log("RESUME command recognized");
            if (state.stopped) {
                console.log("Resuming the cart...");
                // Publish false to manual control topic to disable emergency stop
                const resumeMsg = new ROSLIB.Message({ data: false });
                stop_topic.publish(resumeMsg);

                // Also publish to vehicle_state with stopped: false
                const stateMsg = new ROSLIB.Message({
                    is_navigating: true,
                    reached_destination: false,
                    stopped: false,
                });
                vehicle_state.publish(stateMsg);

                setState((prevState) => ({ ...prevState, stopped: false, is_navigating: true }));
                message.success("Cart resumed.");
                speak("Cart resuming navigation");
            } else {
                console.log("Cart is not stopped.");
            }
        } else if (command.startsWith("GO TO")) {
            const locationName = command.replace("GO TO", "").trim();
            const location = locations.find((loc) => loc.name.toLowerCase() === locationName.toLowerCase());
            if (location) {
                console.log(`Navigating to ${location.displayName}...`);
                setSelectedLocation(location);
                setIsConfirmationModalOpen(true);
                message.info(`Say "James Confirm" to navigate to ${location.displayName} or "James Cancel" to cancel.`);
                setState(prev => ({ ...prev }));
                speak(`Confirm to go to ${location.displayName}`);
            } else {
                console.log(`Location "${locationName}" not found.`);
                message.warning(`Location "${locationName}" not found.`);
                speak(`Location ${locationName} not found`);
            }
        } else if (command === "CONFIRM" && isConfirmationModalOpen) {
            console.log("CONFIRM command recognized");
            handleConfirmation();
        } else if (command === "CANCEL" && isConfirmationModalOpen) {
            console.log("CANCEL command recognized");
            handleConfirmationCancel();
        }
    };

    // Log initial state
    useEffect(() => {
        console.log("Initial state:", state); // Log the initial state
    }, []);

    // Propagate stopped state to ROS
    useEffect(() => {
        if (state.stopped) {
            console.log("Publishing STOP command to ROS...");
            // Publish the STOP command to the ROS system
            const stopMessage = new ROSLIB.Message({
                stopped: true,
            });
            vehicle_state.publish(stopMessage);
        }
    }, [state.stopped]);

    useEffect(() => {
        // This ensures the speech synthesis is ready
        if ('speechSynthesis' in window) {
            // Force a state update to ensure TTS works
            setState(prev => ({ ...prev }));
        }
    }, []);


    function navigateTo(lat: number, lng: number) {
        console.log(`Target Coordinates: ${lat}, ${lng}`);
        const [x, y] = lngLatToMapCoords({ lat, lng });
        const target = new ROSLIB.Message({
            point: { x, y, z: 0 },
        });
        clicked_point.publish(target);
    }

    function navigateToLocation(location: { lat: number, long: number, name: string, displayName: string }) {
        console.log("Navigating to: " + location.displayName);
        setState(prev => ({ ...prev, is_navigating: true, reached_destination: false }));
        setCurrentLocation(location.displayName);
        navigateTo(location.lat, location.long);
    }

    const registerCart = () => {
        console.log("About to register...")
        vehicleService.registerCart("James");
    };


    useEffect(() => {
        const callback = (message: ROSLIB.Message) => {
            if (map.current == undefined) return;

            const newState = message as VehicleState;
            setState(newState);

            if (newState.reached_destination && currentLocation) {
                speak(`Arrived at ${currentLocation}`);
                setCurrentLocation(null); // Clear current location when destination is reached
            }

            if (newState.reached_destination) {
                const source = map.current.getSource("remaining_path") as GeoJSONSource;
                source.setData(LineString([]));
            }
        };

        vehicle_state.subscribe(callback);
        return () => vehicle_state.unsubscribe(callback);
    }, [speak, currentLocation]);

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
                    "line-color": "#bdcff0",
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

                const markers = message as ROSMarkerList;
                console.log("visual_path Message:")
                console.log(message)
                visual_path_coordinates = markers.markers.map((m) => rosToMapCoords(m.pose.position));
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
            locations.forEach((location: { lat: number, long: number, name: string, displayName: string }, index) => {
                if (map.current == undefined) return;

                const popup = new Popup({
                    anchor: 'bottom',
                    className: 'location-popup',
                    closeButton: false,
                    closeOnClick: false,
                    closeOnMove: false,
                })
                    .setText(location.displayName)

                const marker = new Marker({ color: PIN_COLORS[index] })
                    .setLngLat([location.long, location.lat])
                    .setPopup(popup)
                    .addTo(map.current);

                marker.togglePopup();
                marker.getElement().addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Marker clicked:', location.displayName);
                    handleLocationSelect(location);
                });

                locationPins.push(marker);
            });


            limited_pose.subscribe(function (message: ROSLIB.Message) {
                if (map.current == undefined) return;

                const poseWithCovariance = message as PoseWithCovarianceStamped;
                const [x1, y1] = rosToMapCoords(poseWithCovariance.pose.pose.position);
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
        <ConfigProvider
            theme={{
                components: {
                    Tour: customTourTokens,
                },
            }}
        >
            <div id="split">
                <div id="sidebar">
                    <img id="camera-image"></img>
                    <h2>Destinations</h2>
                    <ul id="destinations">
                        {locations.map((location, index) => (
                            <li
                                className={clsx('destination-item', {
                                    selected: currentLocation === location.displayName ||
                                        (selectedLocation?.displayName === location.displayName && isConfirmationModalOpen)
                                })}
                                role='button'
                                key={location.name}
                                onClick={() => handleLocationSelect(location)}
                                ref={index === 0 ? ref1 : null}
                            >
                                {location.displayName}
                            </li>
                        ))}
                    </ul>
                    <VoiceCommands onCommand={handleCommand} locations={locations} />
                    <div id='trip-info-container'>
                        <TripInfoCard name="My Cart" speed={6} tripProgress={50} />
                    </div>
                    <Button id="info-button" size='large' onClick={showModal} ref={ref3}>
                        Additional Location Information
                    </Button>
                </div>

                <div id="map-container">
                    <div ref={mapRef} id="map"></div>
                    <div
                        ref={ref2}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                        }}
                    ></div>
                    <Flex id="map-buttons" gap='middle'>
                        {state.is_navigating ? (
                            <Button
                                id="emergency-stop"
                                type="primary"
                                size="large"
                                icon={<FaStopCircle />}
                                ref={ref4}
                                danger
                                onClick={stopCart}
                            >
                                Press for Emergency Stop
                            </Button>
                        ) : state.stopped ? (
                            <Button
                                id="resume-trip"
                                type="primary"
                                size="large"
                                icon={<FaPlayCircle />}
                                onClick={() => handleCommand("RESUME")}
                            >
                                Press to Resume Trip
                            </Button>
                        ) : null}

                        <Button id="request-help" type="primary" size="large" icon={<IoCall />} ref={ref5}>
                            Press to Request Help
                        </Button>
                    </Flex>
                </div>
            </div>

            {/* Ant Design Modal For Additional Location Information */}
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
                style={{ top: '50%', transform: 'translateY(-50%)' }}
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
                                    {location.displayName}
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
                        padding: '24px',
                        backgroundColor: 'var(--jmu-gold)',
                        height: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        fontSize: '1.2rem',
                    }
                }}
            >
                <p>Are you sure you want to navigate to {selectedLocation?.displayName}?</p>
            </Modal>

            {/* Ant Design Tour */}
            <Tour
                open={isNewUser}
                onClose={() => { setIsNewUser(false); setState({ ...state, stopped: true }); setState({ ...state, is_navigating: false }) }}
                steps={steps}
            />

            {process.env.NODE_ENV === 'development' &&
                <DevMenu vehicleState={state} setVehicleState={setState} registerCart={registerCart} isNewUser={isNewUser} setIsNewUser={setIsNewUser}></DevMenu>
            }

            {/* New User Tutorial Prompt Modal */}
            <Modal
                title="Welcome to the JACart"
                open={isTutorialPromptOpen}
                onOk={() => {
                    setIsTutorialPromptOpen(false);
                    setIsNewUser(true);
                    setState(prev => ({ ...prev, is_navigating: true }));
                }}
                onCancel={() => setIsTutorialPromptOpen(false)}
                footer={[
                    <Button key="cancel" type="default" danger onClick={() => setIsTutorialPromptOpen(false)}>
                        No Thanks
                    </Button>,
                    <Button key="confirm" type="primary" onClick={() => {
                        setIsTutorialPromptOpen(false);
                        setIsNewUser(true);
                        setState(prev => ({ ...prev, is_navigating: true }));
                    }}>
                        Show Tutorial
                    </Button>
                ]}
                width="40%"
                className="custom-modal"
                closable={false}
                style={{ top: '30%' }}
                styles={{
                    body: {
                        padding: '24px',
                        backgroundColor: 'var(--jmu-gold)',
                        height: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        fontSize: '1.2rem',
                    }
                }}
            >
                <p>Are you a new user and would like a tutorial?</p>
            </Modal>
        </ConfigProvider>
    );
}
