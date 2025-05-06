# ZED with ROS Setup and Usage

## Running ZED with ROS

To run the ZED camera with ROS 2, you can use the following launch command. You must specify the camera model from the valid models list below.

### Valid Camera Models:
- `zed`
- `zedm`
- `zed2`
- `zed2i`
- `zedx`
- `zedxm`
- `virtual`
- `zedxonegs`
- `zedxone4k`

### Launch Command(s):

To launch the ZED camera (e.g., `zed2i` model) with ROS 2, use the following command:

```bash
ros2 launch zed_wrapper zed_camera.launch.py camera_model:=zed2i
```

To launch ZED Explorer

```bash
/usr/local/zed/ZED_Explorer
```

To launch the rosbridge server run the following command:

```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml 
```

