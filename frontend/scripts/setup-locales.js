import fs from "fs";
import path from "path";

const sourcePath = path.join(process.cwd(), "src/i18n/locales/en.json");
const targetDir = path.join(process.cwd(), "public/locales");

const languages = [
    "en", "ar", "hi", "es", "fr", "bn", "pt", "id", "ru", "de", 
    "ja", "tr", "vi", "it", "pl", "uk", "nl", "el", "hu", "sv", "cs"
];

// Read the original en.json
const enContent = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));

// Function to recursively prefix string values with locale
function prefixStrings(obj, locale) {
    if (locale === "en") return obj; // Don't prefix English
    
    const newObj = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
        if (typeof obj[key] === "string") {
            // Special right-to-left prefix for Arabic to test RTL
            if (locale === "ar") {
                 newObj[key] = `[${locale.toUpperCase()}] ` + obj[key];
            } else {
                 newObj[key] = `[${locale.toUpperCase()}] ` + obj[key];
            }
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
            newObj[key] = prefixStrings(obj[key], locale);
        } else {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

// Create directories and write files
languages.forEach(lng => {
    const dirPath = path.join(targetDir, lng);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // For English, use the original verbatim. For others, add a prefix to prove it works.
    const localeContent = prefixStrings(enContent, lng);
    
    // Provide a few real translations for the landing title to make it look nice
    if (lng === "es") localeContent.landing.title = "ListaCompartida";
    if (lng === "fr") localeContent.landing.title = "ListePartagée";
    if (lng === "de") localeContent.landing.title = "GemeinsameListe";
    if (lng === "ar") localeContent.landing.title = "قائمة مشتركة";
    if (lng === "ja") localeContent.landing.title = "共有リスト";
    if (lng === "hi") localeContent.landing.title = "साझा सूची";

    fs.writeFileSync(
        path.join(dirPath, "translation.json"),
        JSON.stringify(localeContent, null, 2)
    );
    console.log(`Created locale: ${lng}`);
});
