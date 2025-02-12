import { Card, Flex, Layout, Progress } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import "./styles/Dashboard.css"


export default function Dashboard() {
    const carts = [
        {
            name: 'James',
            speed: 6,
            tripProgress: 75
        },
        {
            name: 'Madison',
            speed: 4,
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
                    <div>test</div>
                    <Flex className="dashboard-cards" wrap gap="middle" justify="center">

                        {carts.map((cart) => (
                            <Card className="dashboard-card" title={cart.name}>
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
