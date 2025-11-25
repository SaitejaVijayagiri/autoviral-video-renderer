import React from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
    Img,
    Audio,
} from 'remotion';

interface MotivationalVideoProps {
    script: string;
    niche: string;
    topic: string;
    images: string[];
    voiceoverUrl?: string;
}

export const MotivationalVideo: React.FC<MotivationalVideoProps> = ({
    script,
    niche,
    topic,
    images,
    voiceoverUrl,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    // Parse script into sections
    const lines = script.split('\n').filter(line => line.trim());

    // Animation values
    const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
        extrapolateRight: 'clamp',
    });

    const titleScale = spring({
        frame,
        fps,
        config: {
            damping: 100,
        },
    });

    return (
        <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }}>
            {/* Background gradient */}
            <AbsoluteFill
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.8,
                }}
            />

            {/* Background Music */}
            <Audio
                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                volume={0.1}
                loop
            />

            {/* Voiceover (if provided) */}
            {voiceoverUrl && (
                <Audio
                    src={voiceoverUrl}
                    volume={1}
                />
            )}

            {/* Title sequence (0-90 frames = 3 seconds) */}
            <Sequence from={0} durationInFrames={90}>
                <AbsoluteFill
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 60,
                    }}
                >
                    <div
                        style={{
                            fontSize: 80,
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            opacity: titleOpacity,
                            transform: `scale(${titleScale})`,
                            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            fontFamily: 'Arial, sans-serif',
                        }}
                    >
                        {topic}
                    </div>
                    <div
                        style={{
                            fontSize: 40,
                            color: 'rgba(255,255,255,0.8)',
                            marginTop: 20,
                            opacity: titleOpacity,
                        }}
                    >
                        {niche}
                    </div>
                </AbsoluteFill>
            </Sequence>

            {/* Main content with images */}
            {images.map((imageUrl, index) => {
                const startFrame = 90 + index * 180; // Start after title, 6 seconds per image
                const imageOpacity = interpolate(
                    frame,
                    [startFrame, startFrame + 30, startFrame + 150, startFrame + 180],
                    [0, 1, 1, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                return (
                    <Sequence
                        key={index}
                        from={startFrame}
                        durationInFrames={180}
                    >
                        <AbsoluteFill>
                            <Img
                                src={imageUrl}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    opacity: imageOpacity,
                                }}
                            />
                            {/* Dark overlay for text readability */}
                            <AbsoluteFill
                                style={{
                                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
                                }}
                            />
                        </AbsoluteFill>
                    </Sequence>
                );
            })}

            {/* Text overlays for script lines */}
            {lines.slice(0, 5).map((line, index) => {
                const startFrame = 90 + index * 150;
                const textOpacity = interpolate(
                    frame,
                    [startFrame, startFrame + 20, startFrame + 130, startFrame + 150],
                    [0, 1, 1, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                return (
                    <Sequence key={index} from={startFrame} durationInFrames={150}>
                        <AbsoluteFill
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 80,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 60,
                                    fontWeight: 'bold',
                                    color: 'white',
                                    textAlign: 'center',
                                    opacity: textOpacity,
                                    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                                    lineHeight: 1.4,
                                    maxWidth: '90%',
                                }}
                            >
                                {line}
                            </div>
                        </AbsoluteFill>
                    </Sequence>
                );
            })}

            {/* Call to action at the end */}
            <Sequence from={durationInFrames - 90} durationInFrames={90}>
                <AbsoluteFill
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 70,
                            fontWeight: 'bold',
                            color: 'white',
                            textAlign: 'center',
                            padding: 60,
                        }}
                    >
                        Follow for More!
                    </div>
                </AbsoluteFill>
            </Sequence>
        </AbsoluteFill>
    );
};
