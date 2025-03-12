import React, { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { message } from "antd";
import Fuse from 'fuse.js';

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

    // Create a Fuse instance for fuzzy matching
    const fuse = new Fuse(locations, {
        keys: ['name'],
        threshold: 0.4, // Adjust the threshold for better matching
    });

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
            callback: (spokenLocation: string) => {
                // Use fuzzy matching to find the closest location
                const results = fuse.search(spokenLocation);
                if (results.length > 0) {
                    const matchedLocation = results[0].item.name;
                    onCommand(`GO TO ${matchedLocation}`);
                } else {
                    console.log(`Location "${spokenLocation}" not found.`);
                    message.warning(`Location "${spokenLocation}" not found.`);
                }
            },
        },
    ];

    // Start listening when the component mounts
    useEffect(() => {
        if (browserSupportsSpeechRecognition) {
            SpeechRecognition.startListening({ continuous: true }); // Enable continuous listening
        } else {
            console.log("Your browser does not support speech recognition.");
            message.warning("Your browser does not support speech recognition.");
        }
    }, [browserSupportsSpeechRecognition]);

    // Handle recognized commands with a delay
    useEffect(() => {
        if (transcript) {
            const delay = 500; // 500ms delay
            const timeoutId = setTimeout(() => {
                console.log("Recognized:", transcript);
                resetTranscript(); // Clear the transcript after processing
            }, delay);

            return () => clearTimeout(timeoutId); // Cleanup timeout
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