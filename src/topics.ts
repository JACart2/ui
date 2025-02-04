import * as ROSLIB from "roslib";
const ros = new ROSLIB.Ros({
  url: "ws://localhost:9090",
});

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
