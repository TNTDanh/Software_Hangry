import React, { useEffect } from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";

const Footer = () => {
  useEffect(() => {
    // Ensure the footer logo stays the same for both light and dark modes
    document.querySelector(".tomatologofooter").style.filter = "none";
  }, []);

  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img className="tomatologofooter" src={assets.logo} alt="" />
          <p>This website is just for my portfolio. It's not a real website.</p>
          <div className="footer-social-icons">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/tnt.danh.2004"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>

            {/* Twitter / X */}
            <a
              href="https://twitter.com/your_twitter_handle"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.twitter_icon} alt="Twitter" />
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/your-linkedin-profile"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.linkedin_icon} alt="LinkedIn" />
            </a>
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>CEO: Danh & Phuoc</li>
            <li>Year of Establishment: 2025</li>
            <li>Thank You So Much</li>
            <li>See You Again</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li><a href="tel:+84862853345">+84-862-853-345</a></li>
            <li><a href="mailto:contact@danhpuoc.com">contact@danhpuoc.com</a></li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright 2025 © TNTD ENTERTAINMENT - All rights reserved.
      </p>
    </div>
  );
};

export default Footer;
