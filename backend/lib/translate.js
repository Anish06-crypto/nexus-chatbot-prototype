const deepl = require('deepl-node');

console.log('[translate] DEEPL_API_KEY present:', !!process.env.DEEPL_API_KEY);
const translator = new deepl.Translator(process.env.DEEPL_API_KEY);

async function detectAndTranslateToEnglish(text) {
    console.log('[translate] detectAndTranslateToEnglish — calling DeepL API');
    const result = await translator.translateText(text, null, 'EN-GB');
    console.log(`[translate] DeepL response — detected: ${result.detectedSourceLang}, text: "${result.text.slice(0, 80)}"`);
    return {
        englishText: result.text,
        detectedLanguage: result.detectedSourceLang.toUpperCase()
    };
}

async function translateToLanguage(text, targetLang) {
    if (targetLang === 'EN' || targetLang === 'EN-GB' || targetLang === 'EN-US') return text;

    console.log(`[translate] translateToLanguage — calling DeepL API (target: ${targetLang})`);
    const result = await translator.translateText(text, 'EN', targetLang);
    console.log(`[translate] DeepL translated back — "${result.text.slice(0, 80)}"`);
    return result.text;
}

async function safeTranslateBack(text, detectedLang) {
    const targetCode = LANGUAGE_MAP[detectedLang];

    if (!targetCode) {
        console.log(`[translate] safeTranslateBack — lang "${detectedLang}" not in LANGUAGE_MAP or unsupported, returning English`);
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