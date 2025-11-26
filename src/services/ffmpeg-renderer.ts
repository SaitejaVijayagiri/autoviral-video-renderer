import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

export interface VideoOptions {
    images: string[];
    script: string;
    audioUrl: string;
    outputPath: string;
    topic: string;
}

export async function renderVideoWithFFmpeg(options: VideoOptions): Promise<string> {
    const { images, script, audioUrl, outputPath, topic } = options;

    console.log(`[FFmpeg] Starting video render for: ${topic}`);

    // Create temp directory for downloaded images
    const tempDir = path.join(process.cwd(), 'temp', Date.now().toString());
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
        // Download images to temp directory
        console.log(`[FFmpeg] Downloading ${images.length} images...`);
        const imagePaths: string[] = [];

        for (let i = 0; i < images.length; i++) {
            const imagePath = path.join(tempDir, `image_${i}.jpg`);
            const response = await axios.get(images[i], { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, response.data);
            imagePaths.push(imagePath);
            console.log(`[FFmpeg] Downloaded image ${i + 1}/${images.length}`);
        }

        // Download audio
        console.log(`[FFmpeg] Downloading audio...`);
        const audioPath = path.join(tempDir, 'audio.mp3');
        const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(audioPath, audioResponse.data);

        // Create video using FFmpeg
        console.log(`[FFmpeg] Rendering video...`);
        await createVideoFromImages(imagePaths, audioPath, outputPath, script, topic);

        // Cleanup temp directory
        console.log(`[FFmpeg] Cleaning up temp files...`);
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log(`[FFmpeg] Video render complete: ${outputPath}`);
        return outputPath;

    } catch (error) {
        // Cleanup on error
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        throw error;
    }
}

function createVideoFromImages(
    imagePaths: string[],
    audioPath: string,
    outputPath: string,
    script: string,
    topic: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        // Create a concat file for FFmpeg
        const concatFilePath = path.join(path.dirname(imagePaths[0]), 'concat.txt');
        const duration = 3; // seconds per image

        // Write concat file
        const concatContent = imagePaths
            .map(img => `file '${img}'\nduration ${duration}`)
            .join('\n') + `\nfile '${imagePaths[imagePaths.length - 1]}'`; // Last image needs to be repeated

        fs.writeFileSync(concatFilePath, concatContent);

        // Run FFmpeg command
        ffmpeg()
            .input(concatFilePath)
            .inputOptions(['-f concat', '-safe 0'])
            .input(audioPath)
            .outputOptions([
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-c:a aac',
                '-shortest', // End when shortest input ends
                '-vf', `scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,drawtext=text='${topic}':fontsize=60:fontcolor=white:x=(w-text_w)/2:y=100:box=1:boxcolor=black@0.5:boxborderw=10`
            ])
            .output(outputPath)
            .on('start', (cmd) => {
                console.log('[FFmpeg] Command:', cmd);
            })
            .on('progress', (progress) => {
                console.log(`[FFmpeg] Progress: ${progress.percent?.toFixed(1)}%`);
            })
            .on('end', () => {
                console.log('[FFmpeg] Rendering finished');
                resolve();
            })
            .on('error', (err) => {
                console.error('[FFmpeg] Error:', err);
                reject(err);
            })
            .run();
    });
}
