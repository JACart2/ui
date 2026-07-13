import * as ROSLIB from "roslib";

import { ai_anomaly_logging } from "../topics";
import { dashboardSocket } from "./dashboardSocket";

interface AiAnomalyLogMessage extends ROSLIB.Message {
  header?: {
    stamp?: {
      sec?: number;
      nanosec?: number;
    };
    frame_id?: string;
  };
  node_name?: string;
  importance?: number;
  type?: number;
  msg?: string;
}

let subscriptionCallback:
  | ((message: ROSLIB.Message) => void)
  | null = null;

function getTimestamp(message: AiAnomalyLogMessage): string {
  const seconds = message.header?.stamp?.sec;
  const nanoseconds = message.header?.stamp?.nanosec ?? 0;

  if (typeof seconds !== "number" || seconds <= 0) {
    return new Date().toISOString();
  }

  return new Date(
    seconds * 1000 + nanoseconds / 1_000_000,
  ).toISOString();
}

function getSeverity(importance?: number): string {
  switch (importance) {
    case 0:
      return "DEBUG";
    case 2:
      return "WARNING";
    case 3:
    case 4:
      return "ERROR";
    case 1:
    default:
      return "INFO";
  }
}

export const aiLogForwarder = {
  start(cartName: string): void {
    if (subscriptionCallback !== null) {
      console.log("[AI Log Forwarder] already subscribed");
      return;
    }

    subscriptionCallback = (rosMessage: ROSLIB.Message) => {
      const message = rosMessage as AiAnomalyLogMessage;
      const logMessage = message.msg?.trim();

      if (!logMessage) {
        console.warn(
          "[AI Log Forwarder] received message without msg:",
          message,
        );
        return;
      }

      dashboardSocket.publishDecisionLog({
        cartName,
        timestamp: getTimestamp(message),
        severity: getSeverity(message.importance),
        source:
          message.node_name?.trim() ||
          "ai_anomaly_logging",
        message: logMessage,
        raw: rosMessage,
      });

      console.log("[AI Log Forwarder] forwarded log:", {
        cartName,
        source: message.node_name,
        importance: message.importance,
        message: logMessage,
      });
    };

    ai_anomaly_logging.subscribe(subscriptionCallback);

    console.log(
      "[AI Log Forwarder] subscribed to /ai_anomaly_logging",
    );
  },

  stop(): void {
    if (subscriptionCallback) {
      ai_anomaly_logging.unsubscribe(
        subscriptionCallback,
      );
    }

    subscriptionCallback = null;

    console.log("[AI Log Forwarder] unsubscribed");
  },
};