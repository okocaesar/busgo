import React, {
  useEffect,
  useState
} from "react";

import "./InstallApp.css";

function InstallApp() {

  const [installPrompt, setInstallPrompt] =
    useState(null);

  // =====================================
  // LISTEN FOR PWA INSTALL PROMPT
  // =====================================

  useEffect(() => {

    const handleBeforeInstallPrompt =
      (event) => {

        event.preventDefault();

        setInstallPrompt(event);

      };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

    };

  }, []);

  // =====================================
  // INSTALL BUSGO
  // =====================================

  const installApp = async () => {

    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();

    const result =
      await installPrompt.userChoice;

    console.log(
      "BusGo installation result:",
      result.outcome
    );

    setInstallPrompt(null);

  };

  // =====================================
  // DO NOT DISPLAY ANYTHING IF:
  //
  // - Browser does not support installation
  // - App is already installed
  // - Installation prompt is unavailable
  // =====================================

  if (!installPrompt) {
    return null;
  }

  // =====================================
  // INSTALL UI
  // =====================================

  return (

    <div className="install-app">

      <div className="install-app-content">

        <div className="install-icon">
          🚍
        </div>

        <div className="install-text">

          <strong>
            Install BusGo App
          </strong>

          <p>
            Get quick access to BusGo
            directly from your home screen.
          </p>

        </div>

      </div>

      <button
        type="button"
        onClick={installApp}
        className="install-button"
      >
        Install App
      </button>

    </div>

  );

}

export default InstallApp;