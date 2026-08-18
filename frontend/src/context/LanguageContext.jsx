import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

const LanguageContext = createContext(null);

const translations = {
  en: {
    dashboard: "Dashboard",
    routes: "Routes",
    offers: "Offers",
    aboutUs: "About Us",
    profile: "Profile",

    notifications: "Notifications",
    notification: "Notification",
    report: "Report",
    language: "Language",
    appVersion: "App Version",
    logout: "Logout",

    english: "English",
    french: "Français",

    login: "Login",
    register: "Register",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    editProfile: "Edit Profile",

    welcomeBack: "Welcome Back",
    loginContinue:
      "Login to continue your journey with BusGo",

    email: "Email",
    password: "Password",
    enterEmail: "Enter your email",
    enterPassword: "Enter your password",

    dontHaveAccount:
      "Don't have an account?",

    verifyEmail: "Verify Your Email",
    verificationCode: "Verification Code",
    enterVerificationCode:
      "Enter 6-digit code",

    fullName: "Full Name",
    phoneNumber: "Phone Number",
    emailAddress: "Email Address",

    profileSettings: "Profile & Settings",
    personalInformation:
      "Personal Information",

    account: "ACCOUNT",
    appearance: "APPEARANCE",
    support: "SUPPORT",
    application: "APPLICATION",

    lightDarkMode: "Light & Dark Mode",
    chooseAppearance:
      "Choose how BusGo looks on your device.",

    lightMode: "Light Mode",
    darkMode: "Dark Mode",

    brightAppearance:
      "Bright BusGo appearance",

    easierAtNight:
      "Easier on the eyes at night",

    reportToAdmin: "Report to Admin",

    reportDescription:
      "Have a problem or something you want the BusGo team to know about?",

    writeReport:
      "Write your message to the BusGo administrator...",

    sendReport: "Send Report",

    appInformation: "App Information",
    currentVersion: "Current Version",
    checkForUpdates: "Check for Updates",

    signOut: "Sign out of BusGo",

    signOutDescription:
      "You can sign back in anytime using your BusGo account.",

    pageNotFound: "Page Not Found",

    loadingProfile: "Loading profile...",
    unableLoadProfile:
      "Unable to load your profile.",

    profileUpdated:
      "Profile updated successfully.",

    saving: "Saving..."
  },

  fr: {
    dashboard: "Tableau de bord",
    routes: "Itinéraires",
    offers: "Offres",
    aboutUs: "À propos de nous",
    profile: "Profil",

    notifications: "Notifications",
    notification: "Notification",
    report: "Signaler",
    language: "Langue",
    appVersion: "Version de l'application",
    logout: "Déconnexion",

    english: "English",
    french: "Français",

    login: "Connexion",
    register: "S'inscrire",
    saveChanges: "Enregistrer les modifications",
    cancel: "Annuler",
    editProfile: "Modifier le profil",

    welcomeBack: "Bon retour",
    loginContinue:
      "Connectez-vous pour continuer votre voyage avec BusGo",

    email: "E-mail",
    password: "Mot de passe",
    enterEmail: "Entrez votre e-mail",
    enterPassword: "Entrez votre mot de passe",

    dontHaveAccount:
      "Vous n'avez pas de compte ?",

    verifyEmail:
      "Vérifiez votre e-mail",

    verificationCode:
      "Code de vérification",

    enterVerificationCode:
      "Entrez le code à 6 chiffres",

    fullName: "Nom complet",
    phoneNumber: "Numéro de téléphone",
    emailAddress: "Adresse e-mail",

    profileSettings:
      "Profil et paramètres",

    personalInformation:
      "Informations personnelles",

    account: "COMPTE",
    appearance: "APPARENCE",
    support: "ASSISTANCE",
    application: "APPLICATION",

    lightDarkMode:
      "Mode clair et sombre",

    chooseAppearance:
      "Choisissez l'apparence de BusGo sur votre appareil.",

    lightMode: "Mode clair",
    darkMode: "Mode sombre",

    brightAppearance:
      "Apparence lumineuse de BusGo",

    easierAtNight:
      "Plus confortable pour les yeux la nuit",

    reportToAdmin:
      "Signaler à l'administrateur",

    reportDescription:
      "Vous avez un problème ou quelque chose à signaler à l'équipe BusGo ?",

    writeReport:
      "Écrivez votre message à l'administrateur BusGo...",

    sendReport:
      "Envoyer le signalement",

    appInformation:
      "Informations sur l'application",

    currentVersion:
      "Version actuelle",

    checkForUpdates:
      "Rechercher les mises à jour",

    signOut:
      "Se déconnecter de BusGo",

    signOutDescription:
      "Vous pouvez vous reconnecter à tout moment avec votre compte BusGo.",

    pageNotFound:
      "Page introuvable",

    loadingProfile:
      "Chargement du profil...",

    unableLoadProfile:
      "Impossible de charger votre profil.",

    profileUpdated:
      "Profil mis à jour avec succès.",

    saving: "Enregistrement..."
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("appLanguage") || "en";
  });

  useEffect(() => {
    localStorage.setItem(
      "appLanguage",
      language
    );

    document.documentElement.lang = language;

    window.dispatchEvent(
      new CustomEvent(
        "busgo-language-change",
        {
          detail: {
            language
          }
        }
      )
    );
  }, [language]);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      const newLanguage =
        event.detail?.language;

      if (
        newLanguage === "en" ||
        newLanguage === "fr"
      ) {
        setLanguage(newLanguage);
      }
    };

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

  const changeLanguage = (newLanguage) => {
    if (
      newLanguage !== "en" &&
      newLanguage !== "fr"
    ) {
      return;
    }

    setLanguage(newLanguage);
  };

  const t = (key) => {
    return (
      translations[language]?.[key] ||
      translations.en[key] ||
      key
    );
  };

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      t
    }),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider."
    );
  }

  return context;
}

export default LanguageContext;