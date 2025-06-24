
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { videoId, userId } = await req.json()
    
    if (!videoId || !userId) {
      throw new Error('Video ID and User ID are required')
    }

    // Get YouTube API key from secrets
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured')
    }

    console.log('Fetching metadata for video:', videoId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch video details from YouTube API
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${youtubeApiKey}`
    )
    const videoData = await videoResponse.json()

    if (!videoResponse.ok) {
      throw new Error(`YouTube API error: ${videoData.error?.message || 'Unknown error'}`)
    }

    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('Video not found or is private')
    }

    const video = videoData.items[0]
    console.log('Video found:', video.snippet.title)

    // Prepare video data for database insertion
    const videoToInsert = {
      user_id: userId,
      video_id: videoId,
      title: video.snippet.title,
      description: video.snippet.description || '',
      thumbnail_url: video.snippet.thumbnails?.maxres?.url || 
                    video.snippet.thumbnails?.high?.url || 
                    video.snippet.thumbnails?.medium?.url || 
                    video.snippet.thumbnails?.default?.url,
      duration: video.contentDetails.duration,
      published_at: video.snippet.publishedAt,
      view_count: parseInt(video.statistics?.viewCount || '0'),
      like_count: parseInt(video.statistics?.likeCount || '0'),
      comment_count: parseInt(video.statistics?.commentCount || '0'),
      channel_id: video.snippet.channelId,
      channel_title: video.snippet.channelTitle,
      tags: video.snippet.tags || [],
      category_id: video.snippet.categoryId,
      default_language: video.snippet.defaultLanguage || video.snippet.defaultAudioLanguage,
    }

    // Insert video into database (using upsert to handle duplicates)
    const { error: insertError } = await supabase
      .from('youtube_videos')
      .upsert(videoToInsert, { onConflict: 'video_id' })

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error(`Failed to save video: ${insertError.message}`)
    }

    console.log('Successfully saved video:', video.snippet.title)

    return new Response(
      JSON.stringify({ 
        success: true, 
        title: video.snippet.title,
        videoId: videoId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-youtube-video function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
