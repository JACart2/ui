import * as ROSLIB from "roslib";

// ROS Connection
const ros = new ROSLIB.Ros({
  url: "ws://localhost:9090",
});

ros.on("connection", () => console.log("Connected to ROS"));

// Topics
export const visual_path = new ROSLIB.Topic({
  ros: ros,
  name: "/visual_path",
  messageType: "visualization_msgs/msg/MarkerArray",
});

export const limited_pose = new ROSLIB.Topic({
  ros: ros,
  name: "/pcl_pose",
  messageType: "geometry_msgs/msg/PoseWithCovarianceStamped",
});

export const vehicle_state = new ROSLIB.Topic({
  ros: ros,
  name: "/vehicle_state",
  messageType: "navigation_interface/msg/VehicleState",
});

export const clicked_point = new ROSLIB.Topic({
  ros: ros,
  name: "/clicked_point",
  messageType: "geometry_msgs/msg/PointStamped",
});

export const right_video = new ROSLIB.Topic({
  ros: ros,
  name: "right_image",
  messageType: "sensor_msgs/msg/Image"
});

export const left_image = new ROSLIB.Topic({
  ros: ros,
  name: "/zed/zed_node/rgb/image_rect_color",
  messageType: "sensor_msgs/msg/Image",
  throttle_rate: 150
});

export const stop_topic = new ROSLIB.Topic({
  ros: ros,
  name: "/set_manual_control",
  messageType: "std_msgs/Bool"
});

export const nav_cmd = new ROSLIB.Topic({
  ros: ros,
  name: "/nav_cmd",
  messageType: "motor_control_interface/msg/VelAngle"
});

// Add direct brake command topic
export const brake_cmd = new ROSLIB.Topic({
  ros: ros,
  name: "/direct_brake",
  messageType: "std_msgs/UInt8"
});