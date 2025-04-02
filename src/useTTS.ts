// Create a new file called useTTS.ts
import { useEffect, useState } from 'react';

export const useTTS = () => {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported('speechSynthesis' in window);
    }, []);

    const speak = (text: string) => {
        if (!isSupported) {
            console.warn('SpeechSynthesis not supported');
            return;
        }

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; // Slightly slower than normal
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    return { speak, isSupported };
};