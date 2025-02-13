import { Flex, Layout } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import "./styles/Dashboard.css"

import { useEffect, useRef } from "react";
import { Protocol } from "pmtiles";
import maplibregl, { Marker } from "maplibre-gl";

import TripInfoCard from "./ui/TripInfoCard";

export default function Dashboard() {
    const map = useRef<maplibregl.Map | null>(null)
    const mapRef = useRef<HTMLDivElement | null>(null)
    const cartMarkers = useRef<{ [key: string]: Marker }>({})

    // This will be replaced with real data when everything is hooked up
    const carts = [
        {
            name: 'James',
            speed: 3,
            tripProgress: 75,
            longLat: [-78.863156, 38.433347],
            startLocation: 'Chesapeake Hall',
            endLocation: 'Front of King Hall'
        },
        {
            name: 'Madison',
            speed: 6,
            tripProgress: 20,
            longLat: [-78.860981, 38.431957],
            startLocation: 'E-Hall',
            endLocation: 'Festival'
        },
    ]

    function focusCart(longLat: number[]) {
        if (map.current == undefined) return

        map.current.flyTo({
            center: [longLat[0], longLat[1]],
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
                    .setLngLat([cart.longLat[0], cart.longLat[1]])
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
                        {carts.map((cart) => (
                            <TripInfoCard {...cart} doesNavToRoot={true} focusCartCallback={(longLat: number[]) => focusCart(longLat)}></TripInfoCard>
                        ))}
                    </Flex>
                    <div ref={mapRef} id="map"></div>
                </Flex>
            </Content>
        </Layout>
    )
}
