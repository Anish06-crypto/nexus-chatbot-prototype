const express = require('express');
const router = express.Router();
const { detectAndTranslateToEnglish, safeTranslateBack } = require('../lib/translate');
const { sendMessage } = require('../lib/groq');
const { parseIntent } = require('../lib/intentParser');

router.post('/', async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'message is required' });
    }

    try {
        const { englishText, detectedLanguage } =
            await detectAndTranslateToEnglish(message);

        const englishResponse = await sendMessage([
            ...history.map(m => ({
                ...m,
                content: m.role === 'user' ? m.englishContent || m.content : m.content
            })),
            { role: 'user', content: englishText }
        ]);

        const parsed = parseIntent(englishResponse);

        const localResponse = await safeTranslateBack(
            parsed?.text || englishResponse,
            detectedLanguage
        );

        res.json({
            text: localResponse,
            intent: parsed,
            detectedLanguage
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
