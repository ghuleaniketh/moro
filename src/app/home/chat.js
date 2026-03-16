// mark as client so logs and browser-only APIs run in the client bundle
'use client';

export default async function Voice(voiceData){
        try {
                console.log("Voice() called in browser with:", voiceData);
                // Keep the original quick return for now; convert to object so callers
                // can reference fields like `audioBase64` if needed later.
                const temres = { message: "this is voice Function" };
                return temres;
        } catch (err) {
                console.error('Voice() error:', err);
                throw err;
        }
}
