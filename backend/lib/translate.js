const deepl = require('deepl-node');

const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

async function detectAndTranslateToEnglish(text) {
    // If already English, skip the API call
    const result = await translator.translateText(text, null, 'EN-GB');
    return {
        englishText: result.text,
        detectedLanguage: result.detectedSourceLang.toUpperCase()
    };
}

async function translateToLanguage(text, targetLang) {
    if (targetLang === 'EN' || targetLang === 'EN-GB' || targetLang === 'EN-US') return text;

    const result = await translator.translateText(text, 'EN', targetLang);
    return result.text;
}

async function safeTranslateBack(text, detectedLang) {
    const targetCode = LANGUAGE_MAP[detectedLang];

    if (!targetCode) {
        // Language not supported by DeepL — return English with a note
        // The Groq prompt will have already generated a constrained response
        return text;
    }

    return await translateToLanguage(text, targetCode);
}

// Map DeepL language codes to DeepL target codes
// DeepL uses EN-GB/EN-US for English targets
const LANGUAGE_MAP = {
    'UR': 'UR',      // Urdu
    'SO': null,      // Somali — not supported by DeepL (see note)
    'CY': 'CY',      // Welsh
    'EN': 'EN-GB',   // English
    'AR': 'AR',      // Arabic
    'PA': null,      // Punjabi — not supported
};

module.exports = { detectAndTranslateToEnglish, translateToLanguage, safeTranslateBack, LANGUAGE_MAP };