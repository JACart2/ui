import * as ROSLIB from "roslib";

import { ros } from "../topics";
import { dashboardSocket } from "./dashboardSocket";

interface DecisionStringMessage extends ROSLIB.Message {
    data?: string;
}

interface ParsedDecision {
    timestamp?: unknown;
    severity?: unknown;
    level?: unknown;
    source?: unknown;
    node?: unknown;
    system?: unknown;
    component?: unknown;
    decision?: unknown;
    message?: unknown;
    summary?: unknown;
    reason?: unknown;
    description?: unknown;
}

const DECISION_TOPIC_NAME =
    import.meta.env.VITE_DECISION_TOPIC || "/add/decisions";

const DECISION_MESSAGE_TYPE =
    import.meta.env.VITE_DECISION_MESSAGE_TYPE ||
    "std_msgs/msg/String";

let decisionTopic: ROSLIB.Topic | null = null;
let decisionCallback:
    | ((message: ROSLIB.Message) => void)
    | null = null;

function firstString(...values: unknown[]): string | undefined {
    for (const value of values) {
        if (
            typeof value === "string" &&
            value.trim().length > 0
        ) {
            return value.trim();
        }
    }

    return undefined;
}

function parseDecision(
    message: DecisionStringMessage
): ParsedDecision {
    if (typeof message.data !== "string") {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(message.data);

        if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
        ) {
            return parsed as ParsedDecision;
        }
    } catch {
        // The ROS message is plain text rather than JSON.
    }

    return {
        message: message.data,
    };
}

export const decisionLogService = {
    start(cartName: string): void {
        if (decisionTopic !== null) {
            console.log(
                "[Decision Log] subscription already active"
            );
            return;
        }

        if (!ros.isConnected) {
            console.warn(
                "[Decision Log] cannot subscribe because ROS is disconnected"
            );
            return;
        }

        decisionTopic = new ROSLIB.Topic({
            ros,
            name: DECISION_TOPIC_NAME,
            messageType: DECISION_MESSAGE_TYPE,
            queue_length: 100,
            throttle_rate: 0,
        });

        decisionCallback = (rosMessage: ROSLIB.Message) => {
            try {
                const message =
                    rosMessage as DecisionStringMessage;

                const parsed = parseDecision(message);

                const decisionText =
                    firstString(
                        parsed.decision,
                        parsed.message,
                        parsed.summary,
                        parsed.reason,
                        parsed.description,
                        message.data
                    ) ?? "Decision received";

                const severity =
                    firstString(
                        parsed.severity,
                        parsed.level
                    )?.toUpperCase() ?? "INFO";

                const source =
                    firstString(
                        parsed.source,
                        parsed.node,
                        parsed.system,
                        parsed.component
                    ) ?? "add";

                const timestamp =
                    firstString(parsed.timestamp) ??
                    new Date().toISOString();

                console.log(
                    "[Decision Log] ROS decision received:",
                    {
                        cartName,
                        severity,
                        source,
                        message: decisionText,
                    }
                );

                dashboardSocket.publishDecisionLog({
                    cartName,
                    timestamp,
                    severity,
                    source,
                    message: decisionText,
                    raw: rosMessage,
                });
            } catch (error) {
                console.error(
                    "[Decision Log] failed to process message:",
                    error
                );
            }
        };

        decisionTopic.subscribe(decisionCallback);

        console.log(
            `[Decision Log] subscribed to ${DECISION_TOPIC_NAME}`
        );
    },

    stop(): void {
        if (decisionTopic && decisionCallback) {
            decisionTopic.unsubscribe(decisionCallback);
        }

        decisionTopic = null;
        decisionCallback = null;

        console.log("[Decision Log] subscription stopped");
    },
};