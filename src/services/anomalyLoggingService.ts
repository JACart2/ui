import * as ROSLIB from "roslib";
import { ai_anomaly_logging, ros } from "../topics";
import type { AnomalyMsg } from "../MessageTypes";
import locations from "../locations.json";


type Location = {
  name: string;
  displayName: string;
  lat: number;
  long: number;
  url: string;
  disabled?: boolean;
};

const destinationLocations = locations as Location[];

type CommandSource = "voice" | "touch" | "unknown";

/**
 * A small helper for publishing AnomalyMsg-style events from the UI.
 * This follows the existing repo pattern: ROSLIB.Topic + ROSLIB.Message
 *
 * We intentionally keep payloads TEXT-only for now:
 *  - type = TEXT
 *  - msg filled with context-specific info
 */
export const anomalyLoggingService = {
  logStop: (params: {
    nodeName?: string;
    source?: CommandSource;
    isNavigating?: boolean;
    destination?: string | null;
    reason?: string;
  } = {}) => {
    publishText({
      nodeName: params.nodeName ?? "ui_interaction",
      importance: Importance.ERROR,
      msg:
        `USER_CMD STOP: Emergency stop requested by user.` +
        ` source=${params.source ?? "unknown"}.` +
        (typeof params.isNavigating === "boolean" ? ` is_navigating=${params.isNavigating}.` : "") +
        (params.destination ? ` destination="${params.destination}".` : "") +
        (params.reason ? ` reason="${params.reason}".` : ""),
    });
  },

  logResume: (params: {
    nodeName?: string;
    source?: CommandSource;
    wasStopped?: boolean;
    destination?: string | null;
  } = {}) => {
    publishText({
      nodeName: params.nodeName ?? "ui_interaction",
      importance: Importance.INFO,
      msg:
        `USER_CMD RESUME: User resumed ride.` +
        ` source=${params.source ?? "unknown"}.` +
        (typeof params.wasStopped === "boolean" ? ` was_stopped=${params.wasStopped}.` : "") +
        (params.destination ? ` destination="${params.destination}".` : ""),
    });
  },

  logHelp: (params: {
    nodeName?: string;
    source?: CommandSource;
    destination?: string | null;
    isNavigating?: boolean;
  } = {}) => {
    publishText({
      nodeName: params.nodeName ?? "ui_interaction",
      importance: Importance.WARNING,
      msg:
        `USER_CMD HELP: User requested help.` +
        ` source=${params.source ?? "unknown"}.` +
        (typeof params.isNavigating === "boolean" ? ` is_navigating=${params.isNavigating}.` : "") +
        (params.destination ? ` destination="${params.destination}".` : ""),
    });
  },

  logTripStart: (params: {
    nodeName?: string;
    source?: CommandSource;
    destination: string;
  }) => {
    const normalizedDestination = params.destination.trim().toLowerCase();

    const location = destinationLocations.find(
      (item) =>
        item.name.toLowerCase() === normalizedDestination ||
        item.displayName.toLowerCase() === normalizedDestination
    );

    publishText({
      nodeName: params.nodeName ?? "ui_interaction",
      importance: Importance.INFO,
      msg:
        `TRIP_START: Navigation started to` +
        ` "${params.destination}"` +
        ` (Lat:${location?.lat ?? "unknown"} Long:${location?.long ?? "unknown"})` +
        ` source=${params.source ?? "unknown"}.`,
    });
  },

  logSpeech: (params: {
    nodeName?: string;
    text: string;
    source?: CommandSource;
  }) => {
    publishText({
      nodeName: params.nodeName ?? "ui_speech_recognition",
      importance: Importance.INFO,
      frameId: "microphone",
      msg:
        `SPEECH_TRANSCRIPTION: ${params.text}`,
    });
  },
};

enum Importance {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
}

enum AnomalyType {
  TEXT = 0,
  IMAGE = 1,
  DATA = 2,
}

function nowRosStamp(): { sec: number; nanosec: number } {
  const ms = Date.now();
  return {
    sec: Math.floor(ms / 1000),
    nanosec: (ms % 1000) * 1_000_000,
  };
}

function publishText(params: {
  nodeName: string;
  importance: number;
  msg: string;
  frameId?: string;
}) {
  const trimmedMsg = params.msg.trim();

  if (!trimmedMsg) {
    console.warn("[ai_anomaly_logging] empty message ignored");
    return;
  }

  if (!ros.isConnected) {
    console.warn(
      "[ai_anomaly_logging] ROS is not connected. Message was not published:",
      trimmedMsg
    );
    return;
  }

  const message = new ROSLIB.Message({
    header: {
      stamp: nowRosStamp(),
      frame_id: params.frameId ?? "ui",
    },
    node_name: params.nodeName,
    importance: params.importance,
    type: AnomalyType.TEXT,
    msg: trimmedMsg,
    image: {
      header: {
        stamp: {
          sec: 0,
          nanosec: 0,
        },
        frame_id: "",
      },
      height: 0,
      width: 0,
      encoding: "",
      is_bigendian: 0,
      step: 0,
      data: [] as number[],
    },
    data_type: "",
    data: [] as number[],
  } as Partial<AnomalyMsg>);

  try {
    ai_anomaly_logging.publish(message);

    console.log("[ai_anomaly_logging] published AnomalyMsg:", {
      nodeName: params.nodeName,
      importance: params.importance,
      type: AnomalyType.TEXT,
      msg: trimmedMsg,
    });
  } catch (err) {
    console.warn("[ai_anomaly_logging] failed to publish", err);
  }
}