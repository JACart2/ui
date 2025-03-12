import React, { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { message } from "antd";


interface VoiceCommandsProps {
    onCommand: (command: string) => void;
    locations: { name: string }[];
}

const VoiceCommands = ({ onCommand, locations }: VoiceCommandsProps) => {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition();

    // Define commands and their corresponding actions
    const commands = [
        {
            command: "STOP",
            callback: () => onCommand("STOP"),
        },
        {
            command: "HELP",
            callback: () => onCommand("HELP"),
        },
        {
            command: "GO TO *",
            callback: (location: string) => {
                const foundLocation = locations.find(loc => loc.name.toLowerCase() === location.toLowerCase());
                if (foundLocation) {
                    onCommand(`GO TO ${foundLocation.name}`);
                } else {
                    message.warning(`Location "${location}" not found.`);
                }
            },
        },
    ];

    // Start listening when the component mounts
    useEffect(() => {
        if (browserSupportsSpeechRecognition) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    SpeechRecognition.startListening({ continuous: true });
                })
                .catch((error) => {
                    console.error("Microphone access denied:", error);
                    message.warning("Microphone access denied. Please allow microphone access to use voice commands.");
                });
        } else {
            console.log("Your browser does not support speech recognition.");
            message.warning("Your browser does not support speech recognition.");
        }
    }, [browserSupportsSpeechRecognition]);

    // Handle recognized commands
    useEffect(() => {
        if (transcript) {
            console.log("Recognized:", transcript);
            resetTranscript(); // Clear the transcript after processing
        }
    }, [transcript, resetTranscript]);

    return (
        <div>
            {listening && (
                <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
                    🎤 Listening...
                </div>
            )}
            {!browserSupportsSpeechRecognition && (
                <p>Your browser does not support speech recognition.</p>
            )}
        </div>
    );
};

export default VoiceCommands;