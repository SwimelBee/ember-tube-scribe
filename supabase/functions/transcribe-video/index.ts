
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
    const { videoId, userId } = await req.json()
    
    if (!videoId || !userId) {
      throw new Error('Video ID and User ID are required')
    }

    // Get OpenAI API key from secrets
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Processing transcription request for video:', videoId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if video belongs to user
    const { data: video, error: videoError } = await supabase
      .from('youtube_videos')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single()

    if (videoError || !video) {
      throw new Error('Video not found or access denied')
    }

    // Check if transcript already exists
    if (video.transcript) {
      return new Response(
        JSON.stringify({ 
          transcript: video.transcript,
          success: true,
          message: 'Transcript already exists'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log('Generating fake transcript using OpenAI for:', video.title)

    // Generate fake transcript using OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are tasked with creating a realistic fake video transcript based on a video title. Generate a natural-sounding transcript that would plausibly match the content suggested by the title. The transcript should:
            - Be 2-3 paragraphs long (300-500 words)
            - Sound like natural speech with some filler words and pauses
            - Include realistic content that matches the video title
            - Have a conversational tone as if someone is speaking to camera
            - Include some "um", "uh", "you know", "so", etc. to make it sound natural
            - Not mention that it's fake or generated`
          },
          {
            role: 'user',
            content: `Generate a realistic transcript for a video titled: "${video.title}"`
          }
        ],
        temperature: 0.8,
        max_tokens: 600
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
    }

    const openAIData = await openAIResponse.json()
    const generatedTranscript = openAIData.choices[0].message.content

    // Update video with generated transcript
    const { error: updateError } = await supabase
      .from('youtube_videos')
      .update({ transcript: generatedTranscript })
      .eq('id', video.id)

    if (updateError) {
      throw new Error('Failed to save transcript')
    }

    console.log('AI-generated transcript saved successfully')

    return new Response(
      JSON.stringify({ 
        transcript: generatedTranscript,
        success: true,
        message: 'Transcript generated successfully using AI'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in transcribe-video function:', error)
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
