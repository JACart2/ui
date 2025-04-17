import { useEffect, useState } from 'react';

export const useTTS = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

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