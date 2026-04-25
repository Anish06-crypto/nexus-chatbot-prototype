const express = require('express');
const router = express.Router();
const { detectAndTranslateToEnglish, safeTranslateBack } = require('../lib/translate');
const { sendMessage } = require('../lib/groq');
const { parseIntent } = require('../lib/intentParser');

router.post('/', async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }

    console.log(`[chat] received message: "${message.slice(0, 80)}"`);

    try {
        console.log('[chat] calling DeepL detectAndTranslateToEnglish...');
        const { englishText, detectedLanguage } =
            await detectAndTranslateToEnglish(message);
        console.log(`[chat] DeepL detected language: ${detectedLanguage}, englishText: "${englishText.slice(0, 80)}"`);

        console.log('[chat] calling Groq sendMessage...');
        const englishResponse = await sendMessage([
            ...history.map(m => ({
                ...m,
                content: m.role === 'user' ? m.englishContent || m.content : m.content
            })),
            { role: 'user', content: englishText }
        ]);
        console.log(`[chat] Groq responded (${englishResponse.length} chars)`);

        const parsed = parseIntent(englishResponse);
        console.log(`[chat] parsed intent: ${parsed?.intent ?? 'null'}`);

        console.log(`[chat] calling DeepL safeTranslateBack (lang: ${detectedLanguage})...`);
        const localResponse = await safeTranslateBack(
            parsed?.text || englishResponse,
            detectedLanguage
        );
        console.log('[chat] pipeline complete, sending response');

        res.json({
            text: localResponse,
            intent: parsed,
            detectedLanguage
        });
    } catch (err) {
        console.error('[chat] pipeline error:', err.message, err.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
