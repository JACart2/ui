import { useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { message } from "antd";
import Fuse from 'fuse.js';

interface VoiceCommandsProps {
    onCommand: (command: string) => void;
    locations: { name: string; displayName: string }[];
}
/**
 * A component that handles voice commands for the JACart.
 * Listens for commands prefixed with "James" and processes them using fuzzy matching.
 * 
 * Features:
 * - Continuous listening with noise suppression
 * - Wake word ("James") required before commands
 * - Fuzzy matching for command recognition
 * - Automatic transcript reset for invalid inputs
 * - "go to" command with location fuzzy matching
 * 
 * Supported Commands:
 * - stop: Triggers emergency stop
 * - help: Requests assistance
 * - resume: Resumes navigation after stop
 * - go to [location]: Navigates to specified location
 * - confirm: Confirms current action
 * - cancel: Cancels current action
 * 
 * @param {VoiceCommandsProps} props - Component properties
 * @returns {JSX.Element} Voice command interface component
 */
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
                    console.log("Raw command received:", spokenCommand);

                    // Process the command (already trimmed by the recognizer)
                    const processedCommand = spokenCommand.toLowerCase();
                    const words = processedCommand.split(/\s+/);
                    
                    // Ignore if more than 5 words (since "James" is already stripped)
                    if (words.length > 5) {
                        console.log("Command too long, ignoring");
                        resetTranscript();
                        return;
                    }

                    // Handle multi-word commands first
                    if (processedCommand.startsWith("go to ")) {
                        const locationName = processedCommand.substring(6); // Get text after "go to "
                        handleGoToCommand(locationName);
                        resetTranscript();
                        return;
                    }

                    // Handle other commands
                    const commandFuse = new Fuse(commandList, {
                        keys: ['name'],
                        threshold: 0.6,
                        includeScore: true,
                        minMatchCharLength: 2
                    });

                    const commandResults = commandFuse.search(processedCommand);

                    if (commandResults.length > 0) {
                        const matchedCommand = commandResults[0].item;
                        onCommand(matchedCommand.action);
                    } else {
                        console.log(`Command "${processedCommand}" not recognized.`);
                        message.warning(`Command "${processedCommand}" not recognized.`);
                    }

                    resetTranscript();
                },
            },
        ],
    });
    /**
     * Handles the "go to" command by fuzzy matching location names.
     * 
     * @param {string} locationName - The spoken location name to match
     */
    const handleGoToCommand = (locationName: string) => {
        const locationFuse = new Fuse(locations, {
            keys: ['name'],
            threshold: 0.6,
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
            onCommand(`GO TO ${matchedLocation}`);
        } else {
            console.log(`Location "${locationName}" not found.`);
            message.warning(`Location "${locationName}" not found.`);
        }
    };

    // Start listening when the component mounts
    useEffect(() => {
          /**
         * Configures microphone with noise suppression and starts listening.
         */
        const setupMicrophone = async () => {
            try {
            // Configure microphone with noise suppression
            await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                noiseSuppression: true,
                echoCancellation: true,
                autoGainControl: true 
                },
                video: false
            });
            console.log("Microphone configured with noise suppression");
            } catch (error) {
            console.error("Error configuring microphone:", error);
            }
        };

        const startListening = () => {
            if (browserSupportsSpeechRecognition) {
            console.log("Starting speech recognition...");
            SpeechRecognition.startListening({
                continuous: true,
                language: 'en-US'
            });
            } else {
            console.log("Your browser does not support speech recognition.");
            message.warning("Your browser does not support speech recognition.");
            }
        };

        // First configure microphone, then start listening
        setupMicrophone().then(startListening);

        return () => {
            SpeechRecognition.stopListening();
        };
    }, [browserSupportsSpeechRecognition]);

    // Aggressively reset transcript when it doesn't start with "James"
    useEffect(() => {
        if (transcript) {
            const trimmedTranscript = transcript.trim().toLowerCase();

            // If the transcript doesn't start with "james", reset it immediately
            if (!trimmedTranscript.startsWith('james')) {
                resetTranscript();
                return;
            }

            // If the transcript is too long, reset it
            const wordCount = trimmedTranscript.split(/\s+/).length;
            if (wordCount > 5) {
                resetTranscript();
                return;
            }

            // Regular timeout cleanup
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
                    🔴 Listening for Voice Commands...
                </div>
            )}
            {!browserSupportsSpeechRecognition && (
                <p>Your browser does not support speech recognition (use a Chromium-based browser).</p>
            )}
        </div>
    );
};

export default VoiceCommands;
