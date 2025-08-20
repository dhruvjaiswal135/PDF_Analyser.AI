from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio
from config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class YouTubeRecommendationRequest(BaseModel):
    selected_text: str
    context: Optional[str] = ""

class YouTubeVideo(BaseModel):
    video_id: str
    title: str
    description: str
    thumbnail_url: str
    channel_title: str
    duration: Optional[str] = None
    view_count: Optional[str] = None
    published_at: str

class YouTubeRecommendationResponse(BaseModel):
    videos: List[YouTubeVideo]
    search_query: str
    processing_time: float

def generate_search_query(selected_text: str, context: str = "") -> str:
    """Generate search query from selected text (simple fallback without LLM)"""
    try:
        # Simple approach: take the first few meaningful words
        words = selected_text.split()
        # Filter out very short words and common words
        meaningful_words = [w for w in words if len(w) > 2 and w.lower() not in ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']]
        
        # Take first 4-6 meaningful words
        search_words = meaningful_words[:5]
        search_query = " ".join(search_words)
        
        return search_query if search_query else selected_text.split()[:4]
        
    except Exception as e:
        logger.error(f"Error generating search query: {e}")
        # Fallback: use first few words of selected text
        words = selected_text.split()[:4]
        return " ".join(words)

async def search_youtube_videos(query: str, max_results: int = 10) -> List[YouTubeVideo]:
    """Search YouTube API for videos"""
    if not settings.youtube_api_key:
        raise HTTPException(status_code=500, detail="YouTube API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Search for videos
            search_url = "https://www.googleapis.com/youtube/v3/search"
            search_params = {
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "order": "relevance",
                "key": settings.youtube_api_key,
                "videoDuration": "medium",  # Prefer medium-length videos
                "videoDefinition": "any"
            }
            
            search_response = await client.get(search_url, params=search_params)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            if "items" not in search_data:
                return []
            
            # Get video IDs for detailed info
            video_ids = [item["id"]["videoId"] for item in search_data["items"]]
            
            # Get video details (duration, view count, etc.)
            details_url = "https://www.googleapis.com/youtube/v3/videos"
            details_params = {
                "part": "statistics,contentDetails",
                "id": ",".join(video_ids),
                "key": settings.youtube_api_key
            }
            
            details_response = await client.get(details_url, params=details_params)
            details_response.raise_for_status()
            details_data = details_response.json()
            
            # Create video objects
            videos = []
            details_map = {item["id"]: item for item in details_data.get("items", [])}
            
            for item in search_data["items"]:
                video_id = item["id"]["videoId"]
                snippet = item["snippet"]
                details = details_map.get(video_id, {})
                
                video = YouTubeVideo(
                    video_id=video_id,
                    title=snippet["title"],
                    description=snippet["description"][:200] + "..." if len(snippet["description"]) > 200 else snippet["description"],
                    thumbnail_url=snippet["thumbnails"]["medium"]["url"],
                    channel_title=snippet["channelTitle"],
                    duration=details.get("contentDetails", {}).get("duration", ""),
                    view_count=details.get("statistics", {}).get("viewCount", ""),
                    published_at=snippet["publishedAt"]
                )
                videos.append(video)
            
            return videos
            
    except httpx.HTTPStatusError as e:
        logger.error(f"YouTube API error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=500, detail=f"YouTube API error: {e.response.status_code}")
    except Exception as e:
        logger.error(f"Error searching YouTube: {e}")
        raise HTTPException(status_code=500, detail="Failed to search YouTube videos")

@router.post("/youtube-recommendations", response_model=YouTubeRecommendationResponse)
async def get_youtube_recommendations(request: YouTubeRecommendationRequest):
    """Get YouTube video recommendations based on selected text"""
    import time
    start_time = time.time()
    
    try:
        # Generate search query from selected text
        search_query = generate_search_query(request.selected_text, request.context)
        logger.info(f"Generated search query: '{search_query}' for text: '{request.selected_text[:50]}...'")
        
        # Search YouTube for videos
        videos = await search_youtube_videos(search_query)
        
        processing_time = time.time() - start_time
        
        return YouTubeRecommendationResponse(
            videos=videos,
            search_query=search_query,
            processing_time=processing_time
        )
        
    except Exception as e:
        logger.error(f"Error in YouTube recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))
