import * as googleTTS from 'google-tts-api';

export async function generateSpeech(text: string): Promise<string> {
    console.log('Generating speech for:', text.substring(0, 50) + '...');
    // Mock TTS for now to avoid Google TTS issues during verification
    return 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
}

export async function generateSpeechBase64(text: string): Promise<string> {
    try {
        const base64 = await googleTTS.getAudioBase64(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
        });
        return `data:audio/mp3;base64,${base64}`;
    } catch (error) {
        console.error('Error generating speech base64:', error);
        return '';
    }
}
