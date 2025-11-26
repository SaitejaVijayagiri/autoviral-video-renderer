import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fetchImages } from './services/unsplash';
import { generateSpeech } from './services/tts';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = (process.env.PORT || 3000) as number;

// Initialize Supabase client (optional)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

app.post('/render', async (req, res) => {
    try {
        const { script, niche, topic } = req.body;

        if (!script || !niche || !topic) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`Starting render for topic: ${topic}`);

        // 1. Fetch assets
        const images = await fetchImages(niche);

        // 2. Generate Voiceover
        // We combine the script lines into one text for the TTS
        const voiceoverText = script.replace(/\[.*?\]/g, '').replace(/#\w+/g, ''); // Remove brackets and hashtags
        const voiceoverUrl = await generateSpeech(voiceoverText);

        // 3. Bundle the video
        const compositionId = 'MotivationalVideo';
        const entry = './src/index.ts';

        console.log('Bundling video...');
        const bundleLocation = await bundle({
            entryPoint: path.resolve(entry),
            webpackOverride: (config) => config,
        });

        // 4. Select composition
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: compositionId,
            inputProps: {
                script,
                niche,
                topic,
                images,
                voiceoverUrl,
            },
        });

        // 5. Render video
        const outputLocation = path.resolve(`out/${Date.now()}_${topic.replace(/\s+/g, '_')}.mp4`);
        // Ensure out directory exists
        if (!fs.existsSync('out')) {
            fs.mkdirSync('out');
        }

        console.log('Rendering video...');
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation,
            inputProps: {
                script,
                niche,
                topic,
                images,
                voiceoverUrl,
            },
        });

        console.log('Render complete:', outputLocation);

        // 6. Upload to Supabase Storage (if configured)
        const fileContent = fs.readFileSync(outputLocation);
        const fileName = `renders/${Date.now()}_${topic.replace(/\s+/g, '_')}.mp4`;

        if (supabase) {
            try {
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('videos')
                    .upload(fileName, fileContent, {
                        contentType: 'video/mp4',
                    });

                if (uploadError) throw uploadError;

                // 7. Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('videos')
            });

// Serve output directory statically
app.use('/out', express.static('out'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Video renderer service listening on port ${PORT}`);
    console.log(`Accessible from Android emulator at: http://10.0.2.2:${PORT}`);
    console.log(`Accessible from local network at: http://10.113.95.240:${PORT}`);
});
