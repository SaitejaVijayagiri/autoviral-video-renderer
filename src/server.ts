import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fetchImages } from './services/unsplash';
import { generateSpeech } from './services/tts';
import { renderVideoWithFFmpeg } from './services/ffmpeg-renderer';
import { veo } from './services/veo';
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
        service: 'AutoViral Video Renderer (FFmpeg)',
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
        // 1. Generate Video with Veo3.1
        const prompt = `Cinematic shot of ${topic} related to ${niche}, high quality, 4k, inspiring, motivational`;
        console.log(`[Job ${jobId}] Starting Veo generation with prompt: ${prompt}`);

        const taskId = await veo.generateVideoTask(prompt);
        console.log(`[Job ${jobId}] Veo Task ID: ${taskId}`);

        // 2. Poll for completion
        let videoUrl = '';
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes (5s interval)

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
            attempts++;

            const status = await veo.checkStatus(taskId);
            console.log(`[Job ${jobId}] Veo Status: ${status.status} (Attempt ${attempts})`);

            if (status.status === 'success' && status.videoUrl) {
                videoUrl = status.videoUrl;
                break;
            } else if (status.status === 'failed') {
                throw new Error('Veo video generation failed');
            }
        }

        if (!videoUrl) {
            throw new Error('Veo video generation timed out');
        }

        // 3. Download Video
        const outputLocation = path.resolve(`out/${jobId}_${topic.replace(/\s+/g, '_')}.mp4`);
        if (!fs.existsSync('out')) {
            fs.mkdirSync('out');
        }

        console.log(`[Job ${jobId}] Downloading video from ${videoUrl}...`);
        await veo.downloadVideo(videoUrl, outputLocation);
        console.log(`[Job ${jobId}] Download complete:`, outputLocation);

        // 4. Return absolute URL
        const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
        const localUrl = `${baseUrl}/out/${path.basename(outputLocation)}`;

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
