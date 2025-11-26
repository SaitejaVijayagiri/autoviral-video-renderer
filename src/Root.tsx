import React from 'react';
import { Composition } from 'remotion';
import { MotivationalVideo } from './compositions/MotivationalVideo';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MotivationalVideo"
                component={MotivationalVideo as any}
                durationInFrames={900}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    script: 'Your motivational script here',
                    niche: 'Motivation',
                    topic: 'Never Give Up',
                    images: []
                }}
            />
        </>
    );
};
