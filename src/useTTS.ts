import { useEffect, useState } from 'react';

/**
 * A custom React hook for text-to-speech (TTS) functionality.
 * Provides speech synthesis capabilities with voice selection and basic controls.
 * 
 * @returns {Object} An object containing:
 *   - speak: Function to speak the given text
 *   - isSupported: Boolean indicating if TTS is supported in the browser
 *   - voices: Array of available speech synthesis voices
 *   - selectedVoice: Currently selected voice
 *   - setSelectedVoice: Function to change the selected voice
 *   - testVoice: Function to test a voice with sample text
 * 
 * @example
 * const { speak } = useTTS();
 * speak("Hello, the cart is ready");
 */

export const useTTS = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

    /**
     * Effect hook to check for TTS support and load available voices.
     * Attempts to find a preferred English female voice by default.
     */
    useEffect(() => {
        const checkSupport = () => {
            const supported = 'speechSynthesis' in window;
            setIsSupported(supported);
            
            if (supported) {
                const loadVoices = () => {
                    const availableVoices = window.speechSynthesis.getVoices();
                    setVoices(availableVoices);
                    if (availableVoices.length > 0) {
                        const preferredVoice = availableVoices.find(voice => 
                            voice.lang.includes('en') && 
                            voice.name.toLowerCase().includes('female')
                        ) || availableVoices[0];
                        setSelectedVoice(preferredVoice);
                    }
                };

                loadVoices();
                
                // Some browsers need this event to load voices
                window.speechSynthesis.onvoiceschanged = loadVoices;
                
                return () => {
                    window.speechSynthesis.onvoiceschanged = null;
                };
            }
        };

        checkSupport();
    }, []);

    /**
     * Speaks the given text using the selected voice.
     * Cancels any ongoing speech before starting new one.
     * 
     * @param {string} text - The text to be spoken
     */
    const speak = (text: string) => {
        if (!isSupported || !selectedVoice) {
            console.warn('SpeechSynthesis not supported or no voice selected');
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    /**
     * Tests a specific voice by speaking sample text.
     * Useful for voice selection UI.
     * 
     * @param {SpeechSynthesisVoice} voice - The voice to test
     * @param {string} text - The text to speak (defaults to simple test message)
     */
    const testVoice = (voice: SpeechSynthesisVoice, text: string) => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    return { 
        speak, 
        isSupported, 
        voices, 
        selectedVoice, 
        setSelectedVoice, 
        testVoice 
    };
};