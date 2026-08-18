import { useEffect, useState } from "react";
import translations from "./translations";

export function useTranslation() {
  const getSavedLanguage = () => {
    const savedLanguage =
      localStorage.getItem("appLanguage") || "en";

    return savedLanguage === "fr" ? "fr" : "en";
  };

  const [language, setLanguage] = useState(
    getSavedLanguage()
  );

  // =========================================
  // LISTEN FOR LANGUAGE CHANGES
  // =========================================

  useEffect(() => {
    const handleLanguageChange = (event) => {
      const newLanguage =
        event.detail?.language ||
        localStorage.getItem("appLanguage") ||
        "en";

      const validLanguage =
        newLanguage === "fr" ? "fr" : "en";

      setLanguage(validLanguage);

      document.documentElement.lang =
        validLanguage;
    };

    // Set initial document language
    document.documentElement.lang =
      getSavedLanguage();

    window.addEventListener(
      "busgo-language-change",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "busgo-language-change",
        handleLanguageChange
      );
    };
  }, []);

  // =========================================
  // GET TRANSLATION
  // =========================================

  const t = (key, fallback = "") => {
    if (!key) {
      return fallback;
    }

    const getNestedValue = (object, path) => {
      return path
        .split(".")
        .reduce(
          (current, part) =>
            current?.[part],
          object
        );
    };

    // Current language
    const currentTranslation =
      getNestedValue(
        translations[language],
        key
      );

    if (
      currentTranslation !== undefined &&
      currentTranslation !== null
    ) {
      return currentTranslation;
    }

    // English fallback
    const englishTranslation =
      getNestedValue(
        translations.en,
        key
      );

    if (
      englishTranslation !== undefined &&
      englishTranslation !== null
    ) {
      return englishTranslation;
    }

    // Developer-provided fallback
    if (fallback) {
      return fallback;
    }

    // Last resort: show the key
    return key;
  };

  // =========================================
  // CHANGE LANGUAGE
  // =========================================

  const changeLanguage = (newLanguage) => {
    const validLanguage =
      newLanguage === "fr" ? "fr" : "en";

    localStorage.setItem(
      "appLanguage",
      validLanguage
    );

    setLanguage(validLanguage);

    document.documentElement.lang =
      validLanguage;

    window.dispatchEvent(
      new CustomEvent(
        "busgo-language-change",
        {
          detail: {
            language: validLanguage
          }
        }
      )
    );
  };

  return {
    t,
    language,
    changeLanguage
  };
}