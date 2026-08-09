import React, {
  useEffect,
  useState
} from "react";

import "./InstallApp.css";


function InstallApp() {

  const [installPrompt, setInstallPrompt] =
    useState(null);

  const [installed, setInstalled] =
    useState(false);


  useEffect(() => {

    // =====================================
    // CHECK IF APP IS ALREADY INSTALLED
    // =====================================

    const checkInstalled = () => {

      if (
        window.matchMedia(
          "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true
      ) {

        setInstalled(true);

      }

    };


    checkInstalled();


    // =====================================
    // ANDROID / CHROME INSTALL PROMPT
    // =====================================

    const handleBeforeInstallPrompt =
      (event) => {

        event.preventDefault();

        setInstallPrompt(event);

      };


    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );


    // =====================================
    // APP INSTALLED
    // =====================================

    const handleAppInstalled = () => {

      setInstalled(true);

      setInstallPrompt(null);

      console.log(
        "BusGo has been installed."
      );

    };


    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );


    return () => {

      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
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
  // ALREADY INSTALLED
  // =====================================

  if (installed) {

    return (

      <div className="install-app installed">

        <span className="install-icon">
          ✓
        </span>

        <div>

          <strong>
            BusGo App Installed
          </strong>

          <p>
            BusGo is ready on your device.
          </p>

        </div>

      </div>

    );

  }


  // =====================================
  // BROWSER DOES NOT SUPPORT PROMPT
  // =====================================

  if (!installPrompt) {

    return null;

  }


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