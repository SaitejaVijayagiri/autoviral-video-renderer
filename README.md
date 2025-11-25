# AutoViral Video Renderer

Video rendering service for AutoViral AI Studio using Remotion.

## Features
- AI-powered video generation
- Text-to-speech integration
- Dynamic image fetching from Unsplash
- Remotion-based video composition

## Deployment

This service is designed to be deployed on Render.com.

### Environment Variables
Set these in your Render dashboard:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `UNSPLASH_ACCESS_KEY` - Your Unsplash API key (optional, will use placeholder images if not set)
- `PORT` - Port number (Render sets this automatically)

## Local Development

```bash
npm install
npm run start
```

The server will start on port 3000 (or the PORT environment variable).

## API

### POST /render
Generate a video from a script.

**Request Body:**
```json
{
  "script": "Your video script here",
  "niche": "Motivation",
  "topic": "Success"
}
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "https://..."
}
```
