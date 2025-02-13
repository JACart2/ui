import { Button, Card, Flex, Progress } from "antd";
import clsx from "clsx";
import { FaCarSide, FaLocationArrow, FaLocationCrosshairs, FaLocationDot, FaRightLong } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

interface TripInfoProps {
  name: string;
  speed: number;
  tripProgress: number;
  startLocation?: string,
  endLocation?: string,
  longLat?: number[],
  focusCartCallback?: (a: number[]) => void
  doesNavToRoot?: boolean
}


export default function TripInfoCard({ name, speed, tripProgress, startLocation, endLocation, longLat, focusCartCallback, doesNavToRoot }: TripInfoProps) {
  const navigate = useNavigate();


  function speedToPercent(speed: number) {
    const max = 8;
    return (Math.min(Math.max(0, speed), max) / max) * 100;
  }

  function emitFocusCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (focusCartCallback == undefined || longLat == undefined) return;

    focusCartCallback(longLat);
  }

  function navToRoot(): void {
    if (doesNavToRoot) {
      navigate('/');
    }
  }

  return (
    <Card className={clsx('dashboard-card', { 'show-hover': doesNavToRoot })} onClick={() => navToRoot()} title={
      // Card title (icon, name, locate button)
      <Flex className='card-title' justify="space-between">
        <Flex className='card-title'><FaCarSide /> <span>{name}</span></Flex>
        {!!longLat &&
          <Button className="cart-locate-button" onClick={($event) => emitFocusCart($event)} icon={<FaLocationCrosshairs />} shape="circle"></Button>
        }
      </Flex>
    }>
      <Flex vertical gap="large">
        <div>
          <span style={{ fontWeight: 'bold' }}>Trip Progress</span>
          <Progress type="line" percent={tripProgress} />

          {!!startLocation && !!endLocation &&
            <Flex align="center" style={{ gap: '4px' }}>
              <FaLocationArrow color="blue" />
              <span>{startLocation}</span>
              <FaRightLong style={{ margin: '0 8px', opacity: 0.6 }} />
              <FaLocationDot color="#E04A3A" />
              <span>{endLocation}</span>
            </Flex>
          }
        </div>

        <Progress type="dashboard" percent={speedToPercent(speed)} format={() => `${speed} mph`} style={{ margin: '0 auto' }} />

      </Flex>
    </Card>
  );

}
