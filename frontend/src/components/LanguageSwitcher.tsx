import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { FiGlobe, FiSearch, FiCheck } from "react-icons/fi";
import "./LanguageSwitcher.css";

const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "bn", label: "বাংলা", flag: "🇧🇩" },
    { code: "pt", label: "Português", flag: "🇧🇷" },
    { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "pl", label: "Polski", flag: "🇵🇱" },
    { code: "uk", label: "Українська", flag: "🇺🇦" },
    { code: "nl", label: "Nederlands", flag: "🇳🇱" },
    { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
    { code: "hu", label: "Magyar", flag: "🇭🇺" },
    { code: "sv", label: "Svenska", flag: "🇸🇪" },
    { code: "cs", label: "Čeština", flag: "🇨🇿" },
] as const;

export function LanguageSwitcher({ className = "" }: { className?: string }) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const currentLang = i18n.resolvedLanguage || i18n.language || "en";
    const currentLangData = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

    const filtered = LANGUAGES.filter(
        (lang) =>
            lang.label.toLowerCase().includes(search.toLowerCase()) ||
            lang.code.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        function handleEscape(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setIsOpen(false);
                setSearch("");
            }
        }
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const handleSelect = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Hidden native select for e2e test compatibility */}
            <select
                value={currentLang}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                aria-label="Select Language"
                className="sr-only"
                tabIndex={-1}
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label}
                    </option>
                ))}
            </select>

            {/* Globe trigger button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="language-switcher-trigger"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                title="Change language"
            >
                <FiGlobe className="language-switcher-globe-icon" />
                <span className="language-switcher-code">{currentLang.toUpperCase()}</span>
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="language-switcher-dropdown"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        role="listbox"
                        aria-label="Language list"
                    >
                        {/* Search */}
                        <div className="language-switcher-search-wrapper">
                            <FiSearch className="language-switcher-search-icon" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search…"
                                className="language-switcher-search-input"
                                aria-label="Search languages"
                            />
                        </div>

                        {/* Language list */}
                        <ul className="language-switcher-list">
                            {filtered.map((lang) => {
                                const isActive = lang.code === currentLang;
                                return (
                                    <motion.li
                                        key={lang.code}
                                        role="option"
                                        aria-selected={isActive}
                                        onClick={() => handleSelect(lang.code)}
                                        className={`language-switcher-item ${isActive ? "language-switcher-item--active" : ""}`}
                                        whileHover={{ x: 2 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <span className="language-switcher-item-flag">{lang.flag}</span>
                                        <span className="language-switcher-item-label">{lang.label}</span>
                                        <span className="language-switcher-item-code">{lang.code.toUpperCase()}</span>
                                        {isActive && (
                                            <FiCheck className="language-switcher-item-check" />
                                        )}
                                    </motion.li>
                                );
                            })}
                            {filtered.length === 0 && (
                                <li className="language-switcher-no-results">
                                    No languages found
                                </li>
                            )}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
