/* eslint-disable @typescript-eslint/no-unused-vars */
import * as ROSLIB from "roslib";

declare interface VehicleState extends ROSLIB.Message {
  is_navigating: boolean;
  reached_destination: boolean;
  stopped: boolean;
}

declare interface PoseWithCovarianceStamped extends ROSLIB.Message {
  header: {
    seq: number;
    stamp: { secs: number; nsecs: number };
    frame_id: string;
  };
  pose: ROSLIB.Pose;
}

declare interface Header {
  seq: number;
  stamp: {
    secs: number;
    nsecs: number;
  };
  frame_id: string;
}

declare interface ColorRGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

declare interface Image {
  header: Header;
  height: number;
  width: number;
  encoding: string;
  is_bigendian: number;
  step: number;
  data: string;
}

declare interface CompressedImage {
  header: Header;
  format: string;
  data: Uint8Array;
}

declare interface ROSMarkerList {
  markers: ROSMarker[];
}

declare interface ROSMarker {
  header: Header;
  ns: string;
  id: number;
  type: number; // Marker type (e.g., ARROW, CUBE)
  action: number; // Action (ADD, MODIFY, DELETE)
  pose: ROSLIB.Pose;
  scale: Vector3;
  color: ColorRGBA;
  lifetime: { secs: number; nsecs: number }; // How long the marker lasts
  frame_locked?: boolean;
  points?: Vector3[];
  colors?: ColorRGBA[]; // Per-vertex colors (optional)
  text?: string;
  mesh_resource?: string; // URL for mesh resources
  mesh_use_embedded_materials?: boolean;
}
