import React from 'react';
import { Composition } from 'remotion';
import { MotivationalVideo } from './compositions/MotivationalVideo';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="MotivationalVideo"
                component={MotivationalVideo}
                durationInFrames={900} // 30 seconds at 30fps
                fps={30}
                width={1080}
                height={1920} // 9:16 aspect ratio for mobile
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
