# YouTube Recommendations Feature

This feature provides YouTube video recommendations based on selected text from documents.

## Setup

1. **Get a YouTube API Key:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the YouTube Data API v3
   - Create credentials (API Key)
   - Copy the API key

2. **Configure the API Key:**
   - Add your YouTube API key to the `.env` file in the backend directory:
   ```
   YOUTUBE_API_KEY=your_actual_youtube_api_key_here
   ```

3. **Restart the Backend:**
   - Restart the backend server for the environment variable to take effect

## Usage

1. **Select Text:** Highlight any text in a PDF document
2. **Click YouTube Button:** A red YouTube button will appear in the header when text is selected
3. **View Recommendations:** A modal will open showing relevant YouTube videos
4. **Watch Videos:** Click on any video to open it in a new tab on YouTube

## Features

- **Smart Search:** Uses AI to generate optimized search queries based on selected text
- **Top 10 Results:** Shows the most relevant videos for the topic
- **Video Details:** Displays thumbnails, titles, duration, view counts, and publish dates
- **Direct Links:** Click to watch videos directly on YouTube
- **Channel Links:** Click channel names to view more videos from the same creator

## API Endpoints

The feature adds a new endpoint:
- `POST /api/youtube/youtube-recommendations`
  - Input: `{ "selected_text": "text", "context": "optional context" }`
  - Output: List of YouTube video recommendations

## Error Handling

- Shows appropriate error messages if API key is not configured
- Handles YouTube API rate limits and errors gracefully
- Provides fallback search queries if AI generation fails
