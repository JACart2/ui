import * as ROSLIB from "roslib";
import { ai_anomaly_logging } from "../topics";

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
    isNavigating?: boolean;
    destination?: string | null;
    reason?: string;
  } = {}) => {
    publishText({
      nodeName: params.nodeName ?? "ui_voice",
      importance: Importance.ERROR,
      msg:
        `VOICE_CMD STOP: Emergency stop requested by user.` +
        (typeof params.isNavigating === "boolean" ? ` is_navigating=${params.isNavigating}.` : "") +
        (params.destination ? ` destination="${params.destination}".` : "") +
        (params.reason ? ` reason="${params.reason}".` : ""),
    });
  },

  logResume: (params: {
    nodeName?: string;
    wasStopped?: boolean;
    destination?: string | null;
  } = {}) => {
    publishText({
      nodeName: params.nodeName ?? "ui_voice",
      importance: Importance.INFO,
      msg:
        `VOICE_CMD RESUME: User resumed ride.` +
        (typeof params.wasStopped === "boolean" ? ` was_stopped=${params.wasStopped}.` : "") +
        (params.destination ? ` destination="${params.destination}".` : ""),
    });
  },

  logHelp: (params: {
    nodeName?: string;
    destination?: string | null;
    isNavigating?: boolean;
  } = {}) => {
    publishText({
      nodeName: params.nodeName ?? "ui_voice",
      importance: Importance.WARNING,
      msg:
        `VOICE_CMD HELP: User requested help.` +
        (typeof params.isNavigating === "boolean" ? ` is_navigating=${params.isNavigating}.` : "") +
        (params.destination ? ` destination="${params.destination}".` : ""),
    });
  },

  logTripStart: (params: {
    nodeName?: string;
    destination: string;
    startMethod: "VOICE_CONFIRM" | "UI_CONFIRM" | "UNKNOWN";
  }) => {
    publishText({
      nodeName: params.nodeName ?? "ui_voice",
      importance: Importance.INFO,
      msg: `TRIP_START: Navigation started to "${params.destination}" via ${params.startMethod}.`,
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

function nowRosStamp(): { secs: number; nsecs: number } {
  const ms = Date.now();
  return {
    secs: Math.floor(ms / 1000),
    nsecs: (ms % 1000) * 1_000_000,
  };
}

function publishText(params: {
  nodeName: string;
  importance: number;
  msg: string;
}) {
  const message = new ROSLIB.Message({
    header: {
      seq: 0,
      stamp: nowRosStamp(),
      frame_id: "ui",
    },
    node_name: params.nodeName,
    importance: params.importance,
    type: AnomalyType.TEXT,
    msg: params.msg,
    image: null,
    data_type: "",
    data: [],
  } as Partial<AnomalyMsg>);

  try {
    console.log("Topic advertised:", ai_anomaly_logging.isAdvertised);
    ai_anomaly_logging.publish(message);
    console.log("[ai_anomaly_logging]", params.msg);
  } catch (err) {
    console.warn("[ai_anomaly_logging] failed to publish", err);
  }
}
