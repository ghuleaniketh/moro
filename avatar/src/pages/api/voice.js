    const express = require("express");
    const { SarvamAIClient } = require("sarvamai");


    const app = express();

    const port = 8080;

    app.listen(port ,()=>{
        console.log(`Server is running on port ${port}`);
    })
    // export default async function handler(req, res) {
    // const client = new SarvamAIClient({
    //     apiSubscriptionKey: process.env.SARVAM_API_KEY,
    // });

    // const response = await client.textToSpeech.convert({
    //     text: "नमस्ते! मेरा नाम मोरो है और मैं एक AI टॉकिंग अवतार हूँ। मुझे Next Tech के छात्रों ने बड़े प्यार और मेहनत से बनाया है। मेरा काम है आपसे बातचीत करना, आपको जानकारी देना और आपके अनुभव को मज़ेदार और स्मार्ट बनाना। मैं हर दिन नई चीज़ें सीखता हूँ ताकि अगली बार जब हम मिलें, मैं और भी बेहतर हो सकूँ।",
    //     target_language_code: "hi-IN",
    //     speaker: "karun",
    //     pitch: 0,
    //     pace: 1,
    //     loudness: 1,
    //     speech_sample_rate: 22050,
    //     enable_preprocessing: true,
    //     model: "bulbul:v2"
    // });

    // res.setHeader("Content-Type", "audio/wav");
    // res.send(response);
    // }
