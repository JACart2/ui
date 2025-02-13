import { Card, Flex, Progress } from "antd";

interface TripInfoProps {
  name: string; 
  speed: number;
  tripProgress: number;
}


export default function TripInfoCard({ name, speed, tripProgress }: TripInfoProps) {


  function speedToPercent(speed: number) {
    const max = 8;
    return (Math.min(Math.max(0, speed), max) / max) * 100
  }
  return (
    <Card className="dashboard-card" title={name}>
      <Flex vertical gap="large">
          <div>
              <span>Trip Progress</span>
              <Progress type="line" percent={tripProgress} />
          </div>
          <Progress type="dashboard" percent={speedToPercent(speed)} format={() => `${speed} mph`} style={{ margin: '0 auto' }} />

      </Flex>
    </Card>
  );

}