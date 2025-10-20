import React from "react";
import "./AppDownload.css";
import { assets } from "../../assets/assets";

const AppDownload = () => {
  return (
    <div className="app-download" id="app-download">
      <p className="pforbetter">For Better Experience Download{" "}
        <h1 style={{ color: "#ff7a00" }}>Hangry App</h1>
      </p>
      <div className="app-download-platforms">
        {/* Google Play */}
        <a
          href="https://play.google.com/store/apps/details?id=com.yourappname"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={assets.play_store} alt="Google Play Store" />
        </a>

        {/* Apple App Store */}
        <a
          href="https://apps.apple.com/app/your-app-name/id1234567890"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={assets.app_store} alt="Apple App Store" />
        </a>
      </div>
    </div>
  );
};

export default AppDownload;
