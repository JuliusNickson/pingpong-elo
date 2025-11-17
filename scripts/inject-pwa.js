#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

// PWA meta tags to inject
const pwaTags = `
  <!-- PWA Meta Tags -->
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="PingPongElo" />
  <meta name="theme-color" content="#0066CC" />
  <meta name="msapplication-TileColor" content="#0066CC" />
  <meta name="msapplication-navbutton-color" content="#0066CC" />
  
  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />
  
  <!-- Apple Touch Icons -->
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
  
  <!-- Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
          .then(function(registration) {
            console.log('ServiceWorker registered');
          })
          .catch(function(err) {
            console.log('ServiceWorker registration failed: ', err);
          });
      });
    }
  </script>
`;

function injectPWATags() {
  try {
    const files = fs.readdirSync(distDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));

    htmlFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      // Check if already injected
      if (content.includes('manifest.json')) {
        console.log(`✓ ${file} already has PWA tags`);
        return;
      }

      // Inject before </head>
      content = content.replace('</head>', pwaTags + '</head>');

      fs.writeFileSync(filePath, content);
      console.log(`✓ Injected PWA tags into ${file}`);
    });

    console.log('\n✅ PWA setup complete!');
  } catch (error) {
    console.error('❌ Error injecting PWA tags:', error);
    process.exit(1);
  }
}

injectPWATags();
