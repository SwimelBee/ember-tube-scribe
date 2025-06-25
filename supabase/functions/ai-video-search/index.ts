
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { searchQuery, userId } = await req.json()
    
    if (!searchQuery || !userId) {
      throw new Error('Search query and User ID are required')
    }

    // Get OpenAI API key from secrets
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Processing AI video search for user:', userId, 'query:', searchQuery)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all videos for this user
    const { data: videos, error: videosError } = await supabase
      .from('youtube_videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (videosError) {
      throw new Error('Failed to fetch videos')
    }

    if (!videos || videos.length === 0) {
      return new Response(
        JSON.stringify({ 
          results: [],
          message: 'No videos found in your library',
          success: true
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log(`Found ${videos.length} videos, analyzing with AI...`)

    // Prepare video metadata for AI analysis
    const videoMetadata = videos.map(video => ({
      id: video.id,
      video_id: video.video_id,
      title: video.title,
      description: video.description?.substring(0, 500) || '', // Limit description length
      channel_title: video.channel_title,
      tags: video.tags || [],
      view_count: video.view_count,
      published_at: video.published_at
    }))

    const metadataText = videoMetadata.map(video => 
      `Video ID: ${video.video_id}
Title: ${video.title}
Channel: ${video.channel_title}
Description: ${video.description}
Tags: ${video.tags.join(', ')}
Views: ${video.view_count}
Published: ${video.published_at}
---`
    ).join('\n')

    // Use OpenAI to analyze and rank videos based on relevance
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at analyzing YouTube video metadata to find videos that match user search queries. 

Analyze the provided video metadata and return the video IDs that are most relevant to the user's search query, ranked by relevance.

Return your response as a JSON array of video IDs in order of relevance (most relevant first). Only include videos that have some relevance to the search query. If no videos match, return an empty array.

Example response format:
["video_id_1", "video_id_2", "video_id_3"]`
          },
          {
            role: 'user',
            content: `Search query: "${searchQuery}"

Video metadata:
${metadataText}

Please return the video IDs that match this search query, ranked by relevance.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const relevantVideoIds = JSON.parse(data.choices[0].message.content)

    // Filter and sort videos based on AI results
    const relevantVideos = relevantVideoIds
      .map((videoId: string) => videos.find(v => v.video_id === videoId))
      .filter(Boolean)

    console.log(`AI found ${relevantVideos.length} relevant videos`)

    return new Response(
      JSON.stringify({ 
        results: relevantVideos,
        totalVideos: videos.length,
        relevantCount: relevantVideos.length,
        success: true,
        message: `Found ${relevantVideos.length} videos matching your search`
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in ai-video-search function:', error)
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
