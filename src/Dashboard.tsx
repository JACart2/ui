import { Card, Flex, Layout, Progress } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css"

import { FaCarSide } from "react-icons/fa6";
import { useEffect, useRef } from "react";
import { Protocol } from "pmtiles";
import maplibregl from "maplibre-gl";


export default function Dashboard() {
    const navigate = useNavigate();
    const map = useRef<maplibregl.Map | null>(null)
    const mapRef = useRef<HTMLDivElement | null>(null)

    const carts = [
        {
            name: 'James',
            speed: 3,
            tripProgress: 75
        },
        {
            name: 'Madison',
            speed: 6,
            tripProgress: 20
        },
    ]

    function speedToPercent(speed: number) {
        const max = 8;
        return (Math.min(Math.max(0, speed), max) / max) * 100
    }

    useEffect(() => {
        if (mapRef.current == undefined) return

        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        map.current = new maplibregl.Map({
            container: mapRef.current,
            style: "/osm-liberty/style.json",
            center: [-78.869914, 38.435491],
            zoom: 16,
        });

        const nav = new maplibregl.NavigationControl();
        map.current.addControl(nav, "top-left");

        // const locationPins: Marker[] = [];

        map.current.on("load", async () => {
            console.log(12)
        });
    }, [])

    return (
        <Layout className="dashboard-container">
            <Header><h1 style={{ color: 'white' }}>JACart Dashboard</h1></Header>
            <Content>
                <Flex vertical justify="space-evenly" className="fill-height">
                    <div ref={mapRef} id="map"></div>
                    <Flex className="dashboard-cards" wrap gap="middle" justify="center">

                        {carts.map((cart) => (
                            <Card className="dashboard-card" title={<div className='card-title'><FaCarSide /> <span>{cart.name}</span></div>} onClick={() => navigate('/')}>
                                <Flex vertical gap="large">
                                    <div>
                                        <span>Trip Progress</span>
                                        <Progress type="line" percent={cart.tripProgress} />
                                    </div>
                                    <Progress type="dashboard" percent={speedToPercent(cart.speed)} format={() => `${cart.speed} mph`} style={{ margin: '0 auto' }} />

                                </Flex>
                            </Card>
                        ))}
                    </Flex>
                </Flex>
            </Content>
        </Layout>
    )
}
