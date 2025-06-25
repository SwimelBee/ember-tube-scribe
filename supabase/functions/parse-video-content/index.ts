
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
    const { theory, userId } = await req.json()
    
    if (!theory || !userId) {
      throw new Error('Theory query and User ID are required')
    }

    // Get OpenAI API key from secrets
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    console.log('Processing theory query:', theory, 'for user:', userId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all videos with transcripts for this user
    const { data: videos, error: videosError } = await supabase
      .from('youtube_videos')
      .select('id, video_id, title, channel_title, transcript')
      .eq('user_id', userId)
      .not('transcript', 'is', null)

    if (videosError) {
      throw new Error('Failed to fetch videos')
    }

    if (!videos || videos.length === 0) {
      throw new Error('No videos with transcripts found')
    }

    console.log(`Found ${videos.length} videos with transcripts`)

    // First pass: Extract relevant information from each transcript
    const relevantData = []
    const batchSize = 5 // Process videos in batches to avoid token limits

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize)
      
      const batchContent = batch.map(video => 
        `Video: "${video.title}" by ${video.channel_title}\nTranscript: ${video.transcript}\n---`
      ).join('\n')

      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(videos.length/batchSize)}`)

      const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `You are an expert at extracting relevant information from video transcripts. Extract any information that relates to the user's query: "${theory}". 

              For each video, if there is relevant information, respond with:
              "VIDEO: [title] - [channel]
              RELEVANT INFO: [extracted information]
              ---"

              If a video has no relevant information, skip it entirely. Be thorough but concise.`
            },
            {
              role: 'user',
              content: `Please extract information related to "${theory}" from these video transcripts:\n\n${batchContent}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }),
      })

      if (!extractionResponse.ok) {
        console.error(`OpenAI API error in batch ${Math.floor(i/batchSize) + 1}:`, extractionResponse.statusText)
        continue
      }

      const extractionData = await extractionResponse.json()
      const extractedInfo = extractionData.choices[0].message.content

      if (extractedInfo && extractedInfo.trim() !== '') {
        relevantData.push(extractedInfo)
      }
    }

    if (relevantData.length === 0) {
      return new Response(
        JSON.stringify({ 
          summary: `No relevant information found about "${theory}" in your video library.`,
          rawData: '',
          success: true,
          message: 'Analysis complete - no relevant content found'
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Combine all relevant data
    const combinedData = relevantData.join('\n\n')
    console.log('Extracted relevant data, generating summary...')

    // Second pass: Summarize and organize the extracted information
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert at synthesizing information from multiple sources. Create a comprehensive, well-organized summary about "${theory}" based on the extracted information from video transcripts.

            Structure your response with:
            1. Overview/Introduction
            2. Key Points (organized by theme/topic)
            3. Different Perspectives (if any)
            4. Conclusion/Summary

            Make it informative, well-formatted, and easy to read. Include references to the source videos when relevant.`
          },
          {
            role: 'user',
            content: `Please create a comprehensive summary about "${theory}" based on this extracted information from video transcripts:\n\n${combinedData}`
          }
        ],
        temperature: 0.4,
        max_tokens: 3000
      }),
    })

    if (!summaryResponse.ok) {
      throw new Error(`OpenAI API error during summarization: ${summaryResponse.statusText}`)
    }

    const summaryData = await summaryResponse.json()
    const finalSummary = summaryData.choices[0].message.content

    console.log('Theory analysis complete')

    return new Response(
      JSON.stringify({ 
        summary: finalSummary,
        rawData: combinedData,
        videosAnalyzed: videos.length,
        success: true,
        message: 'Theory analysis completed successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in parse-video-content function:', error)
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
