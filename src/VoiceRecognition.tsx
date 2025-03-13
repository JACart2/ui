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
    } = useSpeechRecognition({
        commands: [
            {
                command: "stop",
                callback: () => {
                    console.log("STOP command recognized"); // Log when the command is recognized
                    onCommand("STOP");
                },
            },
            {
                command: "help",
                callback: () => {
                    console.log("HELP command recognized"); // Log when the command is recognized
                    onCommand("HELP");
                },
            },
            {
                command: "go to *",
                callback: (spokenLocation: string) => {
                    console.log("GO TO command recognized:", spokenLocation); // Log when the command is recognized
                    const locationName = spokenLocation.trim().toLowerCase();
                    const results = fuse.search(locationName);
                    if (results.length > 0) {
                        const matchedLocation = results[0].item.name;
                        onCommand(`GO TO ${matchedLocation}`);
                    } else {
                        console.log(`Location "${spokenLocation}" not found.`);
                        message.warning(`Location "${spokenLocation}" not found.`);
                    }
                },
            },
        ],
    });

    // Create a Fuse instance for fuzzy matching
    const fuse = new Fuse(locations, {
        keys: ['name'],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
        shouldSort: true,
        findAllMatches: true,
        minMatchCharLength: 3,
        // Normalize location names for matching
        getFn: (obj, path) => {
            const value = Fuse.config.getFn(obj, path);
            return typeof value === 'string' ? value.toLowerCase() : value;
        },
    });

    // Start listening when the component mounts
    useEffect(() => {
        if (browserSupportsSpeechRecognition) {
            console.log("Starting speech recognition..."); // Log when starting speech recognition
            SpeechRecognition.startListening({ continuous: true });
        } else {
            console.log("Your browser does not support speech recognition.");
            message.warning("Your browser does not support speech recognition.");
        }
    }, [browserSupportsSpeechRecognition]);

    // Handle recognized commands with a delay
    useEffect(() => {
        if (transcript) {
            console.log("Raw transcript:", transcript); // Log the raw transcript
            const delay = 700; // 600ms delay
            const timeoutId = setTimeout(() => {
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