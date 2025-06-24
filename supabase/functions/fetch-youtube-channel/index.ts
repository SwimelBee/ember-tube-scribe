
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
    const { channelId, userId } = await req.json()
    
    if (!channelId || !userId) {
      throw new Error('Channel ID and User ID are required')
    }

    // Get YouTube API key from secrets
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured')
    }

    console.log('Fetching videos for channel:', channelId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // First, get channel info to resolve channel handle to channel ID if needed
    let actualChannelId = channelId
    if (!channelId.startsWith('UC')) {
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${channelId}&key=${youtubeApiKey}`
      )
      const channelData = await channelResponse.json()
      
      if (channelData.items && channelData.items.length > 0) {
        actualChannelId = channelData.items[0].id
      } else {
        // Try with handle format
        const handleResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${channelId}&key=${youtubeApiKey}`
        )
        const handleData = await handleResponse.json()
        if (handleData.items && handleData.items.length > 0) {
          actualChannelId = handleData.items[0].id
        }
      }
    }

    // Fetch all videos from the channel
    let allVideos: any[] = []
    let nextPageToken = ''
    let totalResults = 0

    do {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${actualChannelId}&type=video&order=date&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}&key=${youtubeApiKey}`
      
      const response = await fetch(searchUrl)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`YouTube API error: ${data.error?.message || 'Unknown error'}`)
      }

      allVideos = allVideos.concat(data.items || [])
      nextPageToken = data.nextPageToken || ''
      totalResults = data.pageInfo?.totalResults || 0

      console.log(`Fetched ${data.items?.length || 0} videos, total so far: ${allVideos.length}`)
      
      // Limit to prevent timeout - can be adjusted
      if (allVideos.length >= 200) break
      
    } while (nextPageToken && allVideos.length < totalResults)

    console.log(`Total videos found: ${allVideos.length}`)

    // Get detailed info for all videos
    const videoIds = allVideos.map(video => video.id.videoId).join(',')
    
    if (videoIds) {
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
      )
      const detailsData = await detailsResponse.json()

      if (!detailsResponse.ok) {
        throw new Error(`YouTube API error: ${detailsData.error?.message || 'Unknown error'}`)
      }

      // Prepare video data for database insertion
      const videosToInsert = detailsData.items.map((video: any) => ({
        user_id: userId,
        video_id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail_url: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
        duration: video.contentDetails.duration,
        published_at: video.snippet.publishedAt,
        view_count: parseInt(video.statistics.viewCount || '0'),
        like_count: parseInt(video.statistics.likeCount || '0'),
        comment_count: parseInt(video.statistics.commentCount || '0'),
        channel_id: video.snippet.channelId,
        channel_title: video.snippet.channelTitle,
        tags: video.snippet.tags || [],
        category_id: video.snippet.categoryId,
        default_language: video.snippet.defaultLanguage || video.snippet.defaultAudioLanguage,
      }))

      // Insert videos into database (using upsert to handle duplicates)
      const { error: insertError } = await supabase
        .from('youtube_videos')
        .upsert(videosToInsert, { onConflict: 'video_id' })

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw new Error(`Failed to save videos: ${insertError.message}`)
      }

      console.log(`Successfully inserted ${videosToInsert.length} videos`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          videoCount: videosToInsert.length,
          channelTitle: videosToInsert[0]?.channel_title || 'Unknown Channel'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ success: true, videoCount: 0 }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

  } catch (error) {
    console.error('Error in fetch-youtube-channel function:', error)
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
