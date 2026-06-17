import * as ROSLIB from "roslib";

const ROSBRIDGE_URL =
  import.meta.env.VITE_ROSBRIDGE_URL || "ws://127.0.0.1:9090";

const RECONNECT_INTERVAL_MS = 2000;

export const ros = new ROSLIB.Ros({});

let reconnectTimer: number | null = null;
let isConnecting = false;
let manuallyClosed = false;

function scheduleReconnect() {
  if (manuallyClosed) return;
  if (reconnectTimer !== null) return;

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;

    if (!ros.isConnected && !isConnecting) {
      connectToRos();
    }
  }, RECONNECT_INTERVAL_MS);
}

export function connectToRos() {
  if (ros.isConnected || isConnecting) return;

  manuallyClosed = false;
  isConnecting = true;

  console.log("Attempting ROS connection:", ROSBRIDGE_URL);

  try {
    ros.connect(ROSBRIDGE_URL);
  } catch (error) {
    console.error("ROS connect threw error:", error);
    isConnecting = false;
    scheduleReconnect();
  }
}

export function disconnectFromRos() {
  manuallyClosed = true;
  isConnecting = false;

  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  ros.close();
}

ros.on("connection", () => {
  console.log("Connected to ROS");
  console.log("Available ROS message types:", ros.messageTypes); // Log all available message types

  isConnecting = false;

  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
});

ros.on("error", (error) => {
  console.error("ROS connection error object:", error);
  console.error("ROS URL was:", ROSBRIDGE_URL);

  isConnecting = false;
  scheduleReconnect();
});

ros.on("close", (event) => {
  console.warn("ROS connection closed:", event);

  isConnecting = false;
  scheduleReconnect();
});

// Start initial connection attempt.
connectToRos();

// Periodic safety check in case the websocket fails silently.
window.setInterval(() => {
  if (!ros.isConnected && !isConnecting) {
    console.warn("ROS still disconnected. Retrying connection...");
    connectToRos();
  }
}, 5000);

export const visual_path = new ROSLIB.Topic({
  ros,
  name: "/visual_path",
  messageType: "visualization_msgs/msg/MarkerArray",
});

export const limited_pose = new ROSLIB.Topic({
  ros,
  name: "/pcl_pose",
  messageType: "geometry_msgs/msg/PoseWithCovarianceStamped",
});

export const vehicle_state = new ROSLIB.Topic({
  ros,
  name: "/vehicle_state",
  messageType: "navigation_interface/msg/VehicleState",
});

export const clicked_point = new ROSLIB.Topic({
  ros,
  name: "/clicked_point",
  messageType: "geometry_msgs/msg/PointStamped",
});

export const right_video = new ROSLIB.Topic({
  ros,
  name: "right_image",
  messageType: "sensor_msgs/msg/Image",
});

export const left_image = new ROSLIB.Topic({
  ros,
  name: "/zed/zed_node/rgb/image_rect_color",
  messageType: "sensor_msgs/msg/Image",
  throttle_rate: 150,
});

export const stop_topic = new ROSLIB.Topic({
  ros,
  name: "/set_manual_control",
  messageType: "std_msgs/Bool",
});

export const nav_cmd = new ROSLIB.Topic({
  ros,
  name: "/nav_cmd",
  messageType: "motor_control_interface/msg/VelAngle",
});

export const brake_cmd = new ROSLIB.Topic({
  ros,
  name: "/direct_brake",
  messageType: "std_msgs/UInt8",
});

// ai_anomaly_logging
export const ai_anomaly_logging = new ROSLIB.Topic({
  ros,
  name: "/ai_anomaly_logging_ui",
  messageType: "std_msgs/String",
});
