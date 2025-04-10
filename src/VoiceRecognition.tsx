import React, { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { message } from "antd";
import Fuse from 'fuse.js';

interface VoiceCommandsProps {
    onCommand: (command: string) => void;
    locations: { name: string; displayName: string }[];
}

const VoiceCommands = ({ onCommand, locations }: VoiceCommandsProps) => {
    const commandList = [
        { name: "stop", action: "STOP" },
        { name: "help", action: "HELP" },
        { name: "resume", action: "RESUME" },
        { name: "go to", action: "GO TO" },
        { name: "confirm", action: "CONFIRM" }, 
        { name: "cancel", action: "CANCEL" },
    ];

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
    } = useSpeechRecognition({
        commands: [
            {
                command: "James *",
                callback: (spokenCommand: string) => {
                    console.log("Cart command recognized:", spokenCommand);
                    const commandParts = spokenCommand.trim().toLowerCase().split(' ');
                    const mainCommand = commandParts[0];
                    const additionalText = commandParts.slice(1).join(' ');

                    // Fuzzy match the command
                    const commandFuse = new Fuse(commandList, {
                        keys: ['name'],
                        threshold: 0.4,
                        includeScore: true,
                        minMatchCharLength: 2
                    });

                    const commandResults = commandFuse.search(mainCommand);
                    
                    if (commandResults.length > 0) {
                        const matchedCommand = commandResults[0].item;
                        
                        if (matchedCommand.name === "go to") {
                            // Handle location navigation
                            const locationName = additionalText;
                            const locationFuse = new Fuse(locations, {
                                keys: ['name'],
                                threshold: 0.4,
                                includeScore: true,
                                ignoreLocation: true,
                                shouldSort: true,
                                findAllMatches: true,
                                minMatchCharLength: 3,
                                getFn: (obj, path) => {
                                    const value = Fuse.config.getFn(obj, path);
                                    return typeof value === 'string' ? value.toLowerCase() : value;
                                },
                            });

                            const locationResults = locationFuse.search(locationName);
                            if (locationResults.length > 0) {
                                const matchedLocation = locationResults[0].item.name;
                                onCommand(`${matchedCommand.action} ${matchedLocation}`);
                            } else {
                                console.log(`Location "${additionalText}" not found.`);
                                message.warning(`Location "${additionalText}" not found.`);
                            }
                        } else {
                            // Handle other commands
                            onCommand(matchedCommand.action);
                        }
                    } else {
                        console.log(`Command "${mainCommand}" not recognized.`);
                        message.warning(`Command "${mainCommand}" not recognized.`);
                    }
                },
            },
        ],
    });

    // Start listening when the component mounts
    useEffect(() => {
        if (browserSupportsSpeechRecognition) {
            console.log("Starting speech recognition...");
            SpeechRecognition.startListening({ continuous: true });
        } else {
            console.log("Your browser does not support speech recognition.");
            message.warning("Your browser does not support speech recognition.");
        }
    }, [browserSupportsSpeechRecognition]);

    // Handle recognized commands with a delay
    useEffect(() => {
        if (transcript) {
            console.log("Raw transcript:", transcript);
            const delay = 700;
            const timeoutId = setTimeout(() => {
                resetTranscript();
            }, delay);

            return () => clearTimeout(timeoutId);
        }
    }, [transcript, resetTranscript]);

    return (
        <div>
            {listening && (
                <div style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
                    🔴 Listening...
                </div>
            )}
            {!browserSupportsSpeechRecognition && (
                <p>Your browser does not support speech recognition.</p>
            )}
        </div>
    );
};

export default VoiceCommands;