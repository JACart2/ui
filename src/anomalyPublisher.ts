import * as ROSLIB from "roslib";
import { ai_anomaly_logging } from "./topics";
import type { AnomalyMsg } from "./MessageTypes";

/**
* Gets anomaly_logging publisher from topics.ts, and AnomalyMsg type from MessageTypes.d.ts
* Converts JS Date.now() to ROS2 format
* Constructs an AnomalyMsg with all required fields
* Sends message to /ai_anomaly_logging topic (has error handling)
*
*/



/**
 * Publishes a speech transcription to the anomaly logging topic.
 * 
 * @param transcribedText - The speech text to publish
 */
export const publishSpeechToAnomalyTopic = (transcribedText: string): void => {
  // Get current timestamp
  const now = Date.now();
  const secs = Math.floor(now / 1000);
  const nsecs = (now % 1000) * 1000000;

  // Create the AnomalyMsg
  const anomalyMessage = new ROSLIB.Message({
    header: {
      seq: 0,
      stamp: {
        secs: secs,
        nsecs: nsecs,
      },
      frame_id: "microphone",
    },
    node_name: "ui_speech_recognition",
    importance: 0, // INFO level
    type: 0, // TEXT type
    msg: transcribedText,
  }) as Partial<AnomalyMsg>;
  console.log(transcribedText);
  
  // Publish to the topic
  try {
    const stringMessage = new ROSLIB.Message({
      data: JSON.stringify(anomalyMessage)
    });
    ai_anomaly_logging.publish(stringMessage);
    console.log("Published speech to anomaly topic:" ,stringMessage);
    console.log("Published speech to anomaly topic:" ,anomalyMessage);
  } catch (error) {
    console.error("Error publishing to anomaly topic:", error);
  }
};
