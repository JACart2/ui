import { Button, Card, Flex, Layout, Progress } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css"

import { FaCarSide, FaLocationArrow, FaLocationCrosshairs, FaLocationDot, FaRightLong } from "react-icons/fa6";
import { useEffect, useRef } from "react";
import { Protocol } from "pmtiles";
import maplibregl, { Marker } from "maplibre-gl";


export default function Dashboard() {
    const navigate = useNavigate();
    const map = useRef<maplibregl.Map | null>(null)
    const mapRef = useRef<HTMLDivElement | null>(null)
    const cartMarkers = useRef<{ [key: string]: Marker }>({})

    // This will be replaced with real data when everything is hooked up
    const carts = [
        {
            name: 'James',
            speed: 3,
            tripProgress: 75,
            lat: 38.433347,
            long: -78.863156,
            start: 'Chesapeake Hall',
            stop: 'Front of King Hall'
        },
        {
            name: 'Madison',
            speed: 6,
            tripProgress: 20,
            lat: 38.431957,
            long: -78.860981,
            start: 'E-Hall',
            stop: 'Festival'
        },
    ]

    function speedToPercent(speed: number) {
        const max = 8;
        return (Math.min(Math.max(0, speed), max) / max) * 100
    }

    function flyToCart(index: number, e?: React.MouseEvent) {
        e?.preventDefault()
        e?.stopPropagation()

        if (map.current == undefined) return

        const cart = carts[index];

        map.current.flyTo({
            center: [cart.long, cart.lat],
            zoom: 17,
        });
    }

    useEffect(() => {
        if (mapRef.current == undefined) return

        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        map.current = new maplibregl.Map({
            container: mapRef.current,
            style: "/basic_map.json",
            center: [-78.861814, 38.433129],
            zoom: 15,
        });

        const nav = new maplibregl.NavigationControl();
        map.current.addControl(nav, "top-left");

        // const locationPins: Marker[] = [];

        map.current.on("load", async () => {
            if (map.current == undefined) return

            cartMarkers.current = {}

            carts.forEach(cart => {
                const marker = new Marker()
                    .setLngLat([cart.long, cart.lat])
                    .addTo(map.current!);


                // .setPopup(popup)

                cartMarkers.current[cart.name] = marker
            })
        });
    })

    return (
        <Layout className="dashboard-container">
            <Header><h1 style={{ color: 'white' }}>JACart Dashboard</h1></Header>
            <Content>
                <Flex className="fill-height">
                    <Flex className="dashboard-cards" vertical gap="middle" justify="flex-start">

                        {carts.map((cart, index) => (
                            <Card className="dashboard-card" onClick={() => navigate('/')} title={
                                // Card title (icon, name, locate button)
                                <Flex className='card-title' justify="space-between">
                                    <Flex className='card-title'><FaCarSide /> <span>{cart.name}</span></Flex>
                                    <Button className="cart-locate-button" onClick={($event) => flyToCart(index, $event)} icon={<FaLocationCrosshairs />} shape="circle"></Button>
                                </Flex>
                            }>
                                { /* Card body */}
                                <Flex vertical gap="large">

                                    <div>
                                        <span style={{ fontWeight: 'bold' }}>Trip Progress</span>
                                        <Progress type="line" percent={cart.tripProgress} />
                                        <Flex align="center" style={{ gap: '4px' }}>
                                            <FaLocationArrow color="blue" />
                                            <span>{cart.start}</span>
                                            <FaRightLong style={{ margin: '0 8px', opacity: 0.6 }} />
                                            <FaLocationDot color="#E04A3A" />
                                            <span>{cart.stop}</span>
                                        </Flex>
                                    </div>

                                    <Progress className="margin-center" type="dashboard" percent={speedToPercent(cart.speed)} format={() => `${cart.speed} mph`} />
                                </Flex>
                            </Card>
                        ))}
                    </Flex>
                    <div ref={mapRef} id="map"></div>
                </Flex>
            </Content>
        </Layout>
    )
}
