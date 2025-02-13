import { Flex, Layout } from "antd";
import { Content, Header } from "antd/es/layout/layout";
import "./styles/Dashboard.css"
import TripInfoCard from "./ui/TripInfoCard";

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

    return (
        <Layout className="dashboard-container">
            <Header><h1 style={{ color: 'white' }}>JACart Dashboard</h1></Header>
            <Content>
                <Flex vertical justify="space-evenly" className="fill-height">
                    <div>test</div>
                    <Flex className="dashboard-cards" wrap gap="middle" justify="center">

                        {carts.map((cart) => (
                            <TripInfoCard {...cart}></TripInfoCard>
                        ))}
                    </Flex>
                </Flex>
            </Content>
        </Layout>
    )
}
