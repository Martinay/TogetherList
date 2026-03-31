import { useTranslation } from "react-i18next";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "ar", label: "العربية", dir: "rtl" },
    { code: "hi", label: "हिन्दी" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "bn", label: "বাংলা" },
    { code: "pt", label: "Português" },
    { code: "id", label: "Bahasa Indonesia" },
    { code: "ru", label: "Русский" },
    { code: "de", label: "Deutsch" },
    { code: "ja", label: "日本語" },
    { code: "tr", label: "Türkçe" },
    { code: "vi", label: "Tiếng Việt" },
    { code: "it", label: "Italiano" },
    { code: "pl", label: "Polski" },
    { code: "uk", label: "Українська" },
    { code: "nl", label: "Nederlands" },
    { code: "el", label: "Ελληνικά" },
    { code: "hu", label: "Magyar" },
    { code: "sv", label: "Svenska" },
    { code: "cs", label: "Čeština" }
] as const;

export function LanguageSwitcher({ className = "" }: { className?: string }) {
    const { i18n } = useTranslation();

    const currentLang = i18n.resolvedLanguage || i18n.language || "en";

    return (
        <select
            value={currentLang}
            onChange={(e) => {
                i18n.changeLanguage(e.target.value);
            }}
            className={`px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer ${className}`}
            aria-label="Select Language"
        >
            {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                    {lang.label}
                </option>
            ))}
        </select>
    );
}
