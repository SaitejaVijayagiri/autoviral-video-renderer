import axios from 'axios';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function fetchImages(query: string, count: number = 5): Promise<string[]> {
    if (!UNSPLASH_ACCESS_KEY) {
        console.warn('UNSPLASH_ACCESS_KEY not set, using placeholder images');
        return Array(count).fill('https://picsum.photos/1080/1920');
    }

    try {
        const response = await axios.get('https://api.unsplash.com/search/photos', {
            params: {
                query,
                per_page: count,
                orientation: 'portrait',
            },
            headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
        });

        return response.data.results.map((img: any) => img.urls.regular);
    } catch (error) {
        console.error('Error fetching images from Unsplash:', error);
        // Fallback to placeholders if API fails
        return Array(count).fill('https://picsum.photos/1080/1920');
    }
}
