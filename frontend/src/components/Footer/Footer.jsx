import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <footer className="footer footer--dark" id="footer">
      <div className="footer-content">
        {/* Brand + socials */}
        <div className="footer-col">
          <img className="footer-logo" src={assets.logo} alt="Hangry" />
          <p className="footer-note">This website is just for my learning portfolio</p>
          <p className="footer-note-strong">THIS IS NOT A REAL WEBSITE...</p>

          <div className="footer-social">
            <a
              href="https://www.facebook.com/tnt.danh.2004"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
            >
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>
            <a
              href="https://twitter.com/your_twitter_handle"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter / X"
              title="Twitter / X"
            >
              <img src={assets.twitter_icon} alt="Twitter" />
            </a>
            <a
              href="https://www.linkedin.com/in/your-linkedin-profile"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <img src={assets.linkedin_icon} alt="LinkedIn" />
            </a>
          </div>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h3 className="footer-title">COMPANY</h3>
          <ul className="footer-list">
            <li>CEO: Danh & Phuoc</li>
            <li>Year of Establishment: 2025</li>
            <li>Thank You So Much</li>
            <li>See You Again</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h3 className="footer-title">GET IN TOUCH</h3>
          <ul className="footer-list">
            <li><a href="tel:+84862853345">+84-862-853-345</a></li>
            <li><a href="mailto:thainguyenthanhdanhmh@gmail.com">contact@danhpuoc.com</a></li>
          </ul>
        </div>
      </div>

      <hr className="footer-divider" />

      <p className="footer-copy">
        Copyright 2025 © DANHPHUOCxFOODFAST - All rights reserved.
      </p>
    </footer>
  )
}

export default Footer
