
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
    const { message, userId } = await req.json()
    
    if (!message || !userId) {
      throw new Error('Message and User ID are required')
    }

    // Get OpenAI API key from secrets
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Processing AI chat request for user:', userId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch user's video library for context
    const { data: videos, error: videosError } = await supabase
      .from('youtube_videos')
      .select('title, description, channel_title, tags, view_count, published_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (videosError) {
      console.error('Error fetching videos:', videosError)
    }

    // Create context from user's video library
    let videoContext = ''
    if (videos && videos.length > 0) {
      videoContext = `\n\nUser's YouTube Video Library Context:\n${videos.map(video => 
        `- "${video.title}" by ${video.channel_title} (${video.view_count} views)${video.tags ? ` | Tags: ${video.tags.slice(0, 3).join(', ')}` : ''}`
      ).join('\n')}`
    }

    // Prepare the system prompt
    const systemPrompt = `You are a helpful YouTube AI assistant. You help users analyze their YouTube video library, discover content trends, suggest related topics, and provide insights about video performance and content strategy.

When users ask questions, consider their video library context if available. You can:
- Analyze content patterns and themes
- Suggest new video topics based on their interests
- Provide insights about popular content in their collection
- Help with content strategy and planning
- Answer general YouTube and content creation questions

Be conversational, helpful, and insightful. If the user's video library is empty or you don't have context, still provide helpful general advice about YouTube and content creation.${videoContext}`

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0].message.content

    console.log('AI response generated successfully')

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        success: true
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
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
