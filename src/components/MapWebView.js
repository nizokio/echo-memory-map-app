import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #0f1012;
    }
    .leaflet-control-zoom, .leaflet-control-attribution {
      display: none !important;
    }
    .custom-pin {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #ff7a4d;
      border: 2px solid #fff;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(255,122,77,0.5);
      cursor: pointer;
      opacity: 0;
      transform: scale(0.6);
      animation: fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .custom-pin:active {
      transform: scale(0.85);
      opacity: 0.85;
      transition: transform 0.1s ease, opacity 0.1s ease;
    }
    .custom-pin-inner {
      width: 6px;
      height: 6px;
      background-color: #fff;
      border-radius: 3px;
    }
    @keyframes fadeInScale {
      0% { opacity: 0; transform: scale(0.6); }
      100% { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([40.6928, -73.9903], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    const pins = [
      { id: 1, lat: 40.6912, lng: -73.9915, title: "The café with the orange cat", location: "Brooklyn Heights Cafe" },
      { id: 2, lat: 40.6970, lng: -73.9930, title: "Sunset near Brooklyn Bridge", location: "Brooklyn Bridge Park" },
      { id: 3, lat: 40.6890, lng: -73.9870, title: "Quiet library reading corner", location: "Court St Library" },
      { id: 4, lat: 40.6945, lng: -73.9850, title: "Secret garden path", location: "MetroTech Garden" }
    ];

    pins.forEach((pin, idx) => {
      const customIcon = L.divIcon({
        className: 'custom-pin-wrapper',
        html: '<div class="custom-pin" style="animation-delay: ' + (idx * 0.08) + 's"><div class="custom-pin-inner"></div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        const payload = JSON.stringify({ type: 'PIN_TAP', data: pin });
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(payload);
        } else {
          window.parent.postMessage(payload, '*');
        }
      });
    });

    // Listen to messages from React Native
    window.addEventListener('message', (event) => {
      try {
        const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg.type === 'RECENTER') {
          map.setView([40.6928, -73.9903], 14, { animate: true, duration: 0.8 });
        }
      } catch (err) {}
    });
  </script>
</body>
</html>
`;

export default function MapWebView({ onPinTap, recenterTrigger }) {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);

  // Recenter mapping on trigger change
  useEffect(() => {
    if (recenterTrigger > 0) {
      const msg = JSON.stringify({ type: 'RECENTER' });
      if (Platform.OS === 'web') {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(msg, '*');
        }
      } else {
        webViewRef.current?.postMessage(msg);
      }
    }
  }, [recenterTrigger]);

  // Handle postMessage events on Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event) => {
        try {
          const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (msg.type === 'PIN_TAP') {
            onPinTap?.(msg.data);
          }
        } catch (err) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [onPinTap]);

  const handleMobileMessage = (event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'PIN_TAP') {
        onPinTap?.(msg.data);
      }
    } catch (err) {}
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={styles.iframe}
          title="Echo Muted Map View"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        onMessage={handleMobileMessage}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webview}
        backgroundColor="#0f1012"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1012',
  },
  webview: {
    flex: 1,
  },
  iframe: {
    border: 'none',
    width: '100%',
    height: '100%',
    backgroundColor: '#0f1012',
  },
});
