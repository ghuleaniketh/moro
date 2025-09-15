import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import fetch from "node-fetch";

dotenv.config({ path: '.env.local' });

// Enhanced Ollama wrapper with error handling and timeout
async function ollamaLLM(prompt: string): Promise<string> {
  try {
    console.log('Sending prompt to Ollama:', prompt.substring(0, 100) + '...');
    
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3", // Make sure this model is available in your Ollama
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 150, // Limit response length for voice
        }
      }),
      // Add timeout to prevent hanging
      timeout: 30000 // 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    if (!data.response) {
      console.warn('Empty response from Ollama');
      return "I'm sorry, I couldn't generate a response right now.";
    }

    console.log('Ollama response:', data.response.substring(0, 100) + '...');
    return data.response;
    
  } catch (error) {
    console.error('Error calling Ollama:', error);
    // Fallback response
    return "I'm having trouble connecting to my language model right now. Please try again.";
  }
}

// Custom LLM implementation for LiveKit
class OllamaLLM {
  async generate(input: any) {
    let prompt: string;
    
    if (typeof input === "string") {
      prompt = input;
    } else if (input.messages && Array.isArray(input.messages)) {
      // Convert messages to a single prompt
      prompt = input.messages
        .map((m: any) => `${m.role || 'user'}: ${m.content}`)
        .join('\n');
    } else {
      prompt = String(input);
    }

    const reply = await ollamaLLM(prompt);
    
    return {
      content: reply,
      // Add any other required fields based on LiveKit's expectations
    };
  }
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    try {
      console.log('Prewarming agent...');
      proc.userData.vad = await silero.VAD.load();
      console.log('VAD loaded successfully');
    } catch (error) {
      console.error('Error during prewarm:', error);
      throw error;
    }
  },
  
  entry: async (ctx: JobContext) => {
    try {
      console.log('Agent entry started');
      const vad = ctx.proc.userData.vad! as silero.VAD;

      const assistant = new voice.Agent({
        instructions: 'You are a helpful voice AI assistant. Keep your responses concise and conversational since this is a voice interaction.',
      });

      const session = new voice.AgentSession({
        vad,
        stt: new deepgram.STT({ 
          model: 'nova-2', // Consider using nova-2 if nova-3 is having issues
          language: 'en-US',
          smart_format: true,
          punctuate: true,
        }),
        
        // Use our custom Ollama LLM
        llm: new OllamaLLM(),
        
        tts: new cartesia.TTS({
          model: 'sonic-2',
          voice: 'f786b574-daa5-4673-aa0c-cbe3e8534c02', // Make sure this voice ID is valid
          language: 'en',
          speed: 1.0,
        }),
        
        turnDetection: new livekit.turnDetector.MultilingualModel(),
      });

      // Connect to room
      await ctx.connect();
      console.log('Connected to room:', ctx.room.name);

      // Start the session
      await session.start({
        agent: assistant,
        room: ctx.room,
        inputOptions: {
          noiseCancellation: BackgroundVoiceCancellation(),
        },
      });

      console.log('Agent session started');

      // Generate initial greeting
      await session.generateReply({
        instructions: 'Greet the user warmly and briefly introduce yourself as their AI voice assistant. Ask how you can help them today.',
      });

      // Handle session events
      session.on('user_speech_committed', (event) => {
        console.log('User said:', event.user_transcript);
      });

      session.on('agent_speech_committed', (event) => {
        console.log('Agent said:', event.agent_transcript);
      });

      session.on('error', (error) => {
        console.error('Session error:', error);
      });

    } catch (error) {
      console.error('Error in agent entry:', error);
      throw error;
    }
  },
});

// Run the agent
cli.runApp(new WorkerOptions({ 
  agent: fileURLToPath(import.meta.url),
  // Add any additional worker options here
}));