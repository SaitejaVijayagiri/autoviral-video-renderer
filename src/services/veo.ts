import axios from 'axios';
import fs from 'fs';
import path from 'path';

const VEO_API_KEY = process.env.VEO_API_KEY || '0d4c345f450e381b23658448b0198d43';
const BASE_URL = 'https://api.kie.ai/api/v1/veo';

export class VeoService {
    private headers = {
        'Authorization': `Bearer ${VEO_API_KEY}`,
        'Content-Type': 'application/json'
    };

    async generateVideoTask(prompt: string): Promise<string> {
        try {
            console.log('[Veo] Submitting task for prompt:', prompt);
            const response = await axios.post(`${BASE_URL}/generate`, {
                prompt,
                model: 'veo3_fast', // Use fast model for speed
                aspectRatio: '16:9'
            }, { headers: this.headers });

            if (response.data.code === 200) {
                return response.data.data.taskId;
            } else {
                throw new Error(`Veo API Error: ${response.data.msg}`);
            }
        } catch (error: any) {
            console.error('[Veo] Generation request failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async checkStatus(taskId: string): Promise<{ status: 'generating' | 'success' | 'failed', videoUrl?: string }> {
        try {
        } catch (error: any) {
            console.error('[Veo] Status check failed:', error.message);
            throw error;
        }
    }

    async downloadVideo(url: string, outputPath: string): Promise<void> {
        const writer = fs.createWriteStream(outputPath);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }
}

export const veo = new VeoService();
