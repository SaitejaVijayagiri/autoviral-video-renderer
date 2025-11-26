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
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = (process.env.PORT || 3000) as number;

// Initialize Supabase client (optional - won't throw error if not configured)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

console.log('Supabase configured:', !!supabase);

// Job Store
interface Job {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    error?: string;
    createdAt: number;
}

const jobs = new Map<string, Job>();

// Cleanup old jobs every hour
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobs.entries()) {
        if (now - job.createdAt > 3600000) { // 1 hour
            jobs.delete(id);
        }
    }
}, 3600000);

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'AutoViral Video Renderer',
        endpoints: {
            render: 'POST /render',
            status: 'GET /status/:id'
        }
    });
});

app.get('/status/:id', (req, res) => {
    const { id } = req.params;
    const job = jobs.get(id);

    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
});

app.post('/render', async (req, res) => {
    const { script, niche, topic } = req.body;

    if (!script || !niche || !topic) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const jobId = randomUUID();
    jobs.set(jobId, {
        id: jobId,
        status: 'pending',
        createdAt: Date.now()
    });

    // Return immediately
    res.json({ success: true, jobId });

    // Start processing in background
    processVideo(jobId, script, niche, topic).catch(err => {
        console.error(`Background processing failed for job ${jobId}:`, err);
        const job = jobs.get(jobId);
        if (job) {
            job.status = 'failed';
            job.error = err.message;
            jobs.set(jobId, job);
        }
    });
});

async function processVideo(jobId: string, script: string, niche: string, topic: string) {
    console.log(`Starting background render for job ${jobId}, topic: ${topic}`);

    const job = jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    jobs.set(jobId, job);

    try {
        // 1. Fetch assets
        const images = await fetchImages(niche);

        // 2. Generate Voiceover
        const voiceoverText = script.replace(/\[.*?\]/g, '').replace(/#\w+/g, '');
        const voiceoverUrl = await generateSpeech(voiceoverText);

        // 3. Bundle the video
        const compositionId = 'MotivationalVideo';
        const entry = './src/index.ts';

        console.log(`[Job ${jobId}] Bundling video...`);
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
        const outputLocation = path.resolve(`out/${jobId}_${topic.replace(/\s+/g, '_')}.mp4`);
        if (!fs.existsSync('out')) {
            fs.mkdirSync('out');
        }

        console.log(`[Job ${jobId}] Rendering video...`);
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

        console.log(`[Job ${jobId}] Render complete:`, outputLocation);

        // 6. Return local URL
        const localUrl = `/out/${path.basename(outputLocation)}`;

        job.status = 'completed';
        job.videoUrl = localUrl;
        jobs.set(jobId, job);

    } catch (error: any) {
        console.error(`[Job ${jobId}] Render error:`, error);
        job.status = 'failed';
        job.error = error.message;
        jobs.set(jobId, job);
    }
}

// Serve output directory statically
app.use('/out', express.static('out'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Video renderer service listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
});
