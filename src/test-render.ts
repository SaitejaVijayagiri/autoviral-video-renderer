import axios from 'axios';

const RENDERER_URL = 'http://localhost:3000/render';

async function testRender() {
    try {
        console.log('Triggering test render...');
        const response = await axios.post(RENDERER_URL, {
            script: 'This is a test script for video generation.',
            niche: 'Test Niche',
            topic: 'Test Topic'
        });

        console.log('Render successful:', response.data);
    } catch (error: any) {
        console.error('Render failed:', error.response?.data || error.message);
    }
}

testRender();
