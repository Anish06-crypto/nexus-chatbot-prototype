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
    // English variants — no translation needed
    if (!detectedLang ||
        detectedLang === 'EN' ||
        detectedLang.startsWith('EN-')) {
        return text;
    }

    const targetCode = LANGUAGE_MAP[detectedLang];

    // Language not in map or explicitly null — unsupported
    if (targetCode === undefined || targetCode === null) {
        console.log(`[translate] ${detectedLang} not supported — returning English`);
        return text;
    }

    return await translateToLanguage(text, targetCode);
}

// Map DeepL language codes to DeepL target codes
// DeepL uses EN-GB/EN-US for English targets
const LANGUAGE_MAP = {
    // Source detected code (uppercase) : DeepL target code

    // Arabic
    'AR': 'AR',

    // Bulgarian
    'BG': 'BG',

    // Chinese — DeepL detects both as ZH, targets are separate
    'ZH': 'ZH-HANS',       // defaults to Simplified
    'ZH-HANS': 'ZH-HANS',  // Chinese Simplified
    'ZH-HANT': 'ZH-HANT',  // Chinese Traditional

    // Czech
    'CS': 'CS',

    // Danish
    'DA': 'DA',

    // Dutch
    'NL': 'NL',

    // English — split into GB and US targets, default to GB
    'EN': null,             // no translation needed
    'EN-GB': null,
    'EN-US': null,

    // Estonian
    'ET': 'ET',

    // Finnish
    'FI': 'FI',

    // French
    'FR': 'FR',

    // German
    'DE': 'DE',

    // Greek
    'EL': 'EL',

    // Hebrew
    'HE': 'HE',

    // Hindi
    'HI': 'HI',

    // Hungarian
    'HU': 'HU',

    // Indonesian
    'ID': 'ID',

    // Italian
    'IT': 'IT',

    // Japanese
    'JA': 'JA',

    // Korean
    'KO': 'KO',

    // Latvian
    'LV': 'LV',

    // Lithuanian
    'LT': 'LT',

    // Norwegian Bokmål
    'NB': 'NB',
    'NO': 'NB',            // DeepL may detect Norwegian as NO

    // Polish
    'PL': 'PL',

    // Portuguese — split into Brazilian and European
    'PT': 'PT-PT',         // default to European
    'PT-BR': 'PT-BR',      // Brazilian Portuguese
    'PT-PT': 'PT-PT',      // European Portuguese

    // Romanian
    'RO': 'RO',

    // Russian
    'RU': 'RU',

    // Slovak
    'SK': 'SK',

    // Slovenian
    'SL': 'SL',

    // Spanish
    'ES': 'ES',

    // Swedish
    'SV': 'SV',

    // Thai — API early access only, may not be on free tier
    'TH': 'TH',

    // Turkish
    'TR': 'TR',

    // Ukrainian
    'UK': 'UK',

    // Urdu
    'UR': 'UR',

    // Vietnamese
    'VI': 'VI',

    // Welsh
    'CY': 'CY',

    // ── NOT SUPPORTED — returns null, falls back to English response ──
    'SO': null,   // Somali
    'PA': null,   // Punjabi
    'SW': null,   // Swahili
    'MS': null,   // Malay
    'TA': null,   // Tamil
    'TE': null,   // Telugu
    'BN': null,   // Bengali
    'HR': null,   // Croatian — not supported by DeepL
    'GA': null,   // Irish — not supported by DeepL
    'LB': null,   // Luxembourgish — not supported
};

module.exports = { detectAndTranslateToEnglish, translateToLanguage, safeTranslateBack, LANGUAGE_MAP };