import { Card, Flex, Layout, Progress } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import { useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css"

import { FaCarSide } from "react-icons/fa6";


export default function Dashboard() {
    const navigate = useNavigate();

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

    return (
        <Layout className="dashboard-container">
            <Header><h1 style={{ color: 'white' }}>JACart Dashboard</h1></Header>
            <Content>
                <Flex vertical justify="space-evenly" className="fill-height">
                    <div></div>
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
