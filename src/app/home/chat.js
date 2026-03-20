'use client'
import React, { useEffect } from "react";
import createKnowledgeContext from "./knowledgeContext";
import { SarvamAIClient } from "sarvamai";




export default async function Voice(voiceData){
       
        const API_KEY = process.env.NEXT_PUBLIC_SARVAMAI_API_KEY;
        const LLM_API_KEY = process.env.NEXT_PUBLIC_SARVAMAI_LLM_API_KEY;
        const TTS_API_KEY = process.env.NEXT_PUBLIC_SARVAMAI_TTS_API_KEY;
        
        if(API_KEY)
                console.log("bro we have the api keys")
        else 
                console.log("bro we don't have the api key");
        try {
                console.log("Audio data:", voiceData.get('audio'));
                
                let audioFile = voiceData.get('audio');
                console.log("finnaly sending to make it a respose" + `: ${audioFile}`);
                if (req.file) {
                        console.log("Processing audio file:", req.file.path);

                //stage 1. to convert the audio to text
                        try {   
                                const client = new SarvamAIClient({ apiSubscriptionKey: API_KEY });
                                const audioFile = fs.createReadStream(req.file.path);
                                const sttResponse = await client.speechToText.transcribe({
                                file: audioFile,
                                language_code: "en-IN",
                                model: "saarika:v2.5"
                                });
                                
                                console.log("_____________________SET ONE PASSED _______________________________")
                                console.log(`Transcription: ${sttResponse.transcript}`);
                                // Clean up uploaded file
                                fs.unlinkSync(req.file.path);
                        } catch (err) {
                                console.error('STT error:', err);
                                fs.unlinkSync(req.file.path);
                                return res.status(500).json({ error: "Failed to transcribe audio", details: err.message });
                        }

                //stage 2. give ing the test to the llm and getting the response
                        try {
                                const client = new SarvamAIClient({apiSubscriptionKey: LLM_API_KEY});
                                const llmResponse = await client.chat.completions({
                                messages: [
                                {
                                        role: "system",
                                        content: createKnowledgeContext()
                                },
                                { "role": "user", "content": userMessage }
                                ],
                                temperature: 0.5,
                                top_p: 1,
                                max_tokens: 1000,
                        });
                        
                                llmOutput = llmResponse.choices[0].message.content;
                                console.log("_____________________SET TWO PASSED _______________________________")
                                console.log(`LLM Output: ${llmOutput}`);
                        } catch(err) {
                                console.error('LLM error:', err);
                                return res.status(500).json({ error: "Failed to get LLM response", details: err.message });
                        }

                //stage 3. converting the tllm text in into audio.
                        try {
                                const client = new SarvamAIClient({apiSubscriptionKey: TTS_API_KEY});
                                const ttsResponse = await client.textToSpeech.convert({
                                        text: llmOutput,
                                        target_language_code: "hi-IN",
                                        speaker: "shubh",
                                        pace: 1.1,
                                        speech_sample_rate: 22050,
                                        enable_preprocessing: true,
                                        model: "bulbul:v3-beta",
                                        temperature: 0.6
                                });
                                console.log("_____________________SET THREE PASSED _______________________________")
                                console.log("TTS conversion complete and  been sent to the client");
                                res.json({ 
                                status: "success", 
                                transcript: userMessage,
                                response: llmOutput,
                                audioBase64: ttsResponse 
                        });
                        } catch(err) {
                                console.error('TTS error:', err);
                                // Return text response even if TTS fails
                                res.json({ 
                                status: "partial_success", 
                                transcript: userMessage,
                                response: llmOutput,
                                error: "TTS conversion failed" 
                        });
                        }

                }
                // const temres = { message: "this is voice Function" };
                return temres;
        } catch (err) {
                console.error('Voice() error:', err);
                throw err;
        }
}
