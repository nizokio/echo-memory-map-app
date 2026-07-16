import React, { useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const createMapHtml = (echoes) => `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><style>html,body,#map{height:100%;margin:0;background:#0f1012}.leaflet-control-zoom,.leaflet-control-attribution{display:none!important}.custom-pin{width:20px;height:20px;display:flex;align-items:center;justify-content:center;background:#ff7a4d;border:2px solid #fff;border-radius:10px;box-shadow:0 2px 8px rgba(255,122,77,.5);cursor:pointer;opacity:0;transform:scale(.6);animation:fade .2s forwards}.custom-pin-inner{width:6px;height:6px;background:#fff;border-radius:3px}@keyframes fade{to{opacity:1;transform:scale(1)}}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const map=L.map('map',{zoomControl:false,attributionControl:false}).setView([40.6928,-73.9903],14);L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:20}).addTo(map);const pins=${JSON.stringify(echoes.map((echo) => ({ id: echo.id, lat: echo.location.latitude, lng: echo.location.longitude, title: echo.aiMetadata?.title || echo.location.name, location: echo.location.name })))};pins.forEach((pin,index)=>{const icon=L.divIcon({className:'custom-pin-wrapper',html:'<div class="custom-pin" style="animation-delay:'+index*.08+'s"><div class="custom-pin-inner"></div></div>',iconSize:[20,20],iconAnchor:[10,10]});L.marker([pin.lat,pin.lng],{icon}).addTo(map).on('click',()=>{const message=JSON.stringify({type:'PIN_TAP',data:pin});window.ReactNativeWebView?window.ReactNativeWebView.postMessage(message):window.parent.postMessage(message,'*')})});window.addEventListener('message',event=>{try{const msg=typeof event.data==='string'?JSON.parse(event.data):event.data;if(msg.type==='RECENTER')map.setView([40.6928,-73.9903],14,{animate:true,duration:.8})}catch(err){}})</script></body></html>`;

export default function MapWebView({ echoes, onPinTap, recenterTrigger }) {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);
  const mapHtml = useMemo(() => createMapHtml(echoes), [echoes]);
  useEffect(() => {
    if (recenterTrigger > 0) {
      const message = JSON.stringify({ type: 'RECENTER' });
      if (Platform.OS === 'web') iframeRef.current?.contentWindow?.postMessage(message, '*');
      else webViewRef.current?.postMessage(message);
    }
  }, [recenterTrigger]);
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const handler = (event) => { try { const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; if (message.type === 'PIN_TAP') onPinTap?.(message.data); } catch (error) {} };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onPinTap]);
  const handleMobileMessage = (event) => { try { const message = JSON.parse(event.nativeEvent.data); if (message.type === 'PIN_TAP') onPinTap?.(message.data); } catch (error) {} };
  if (Platform.OS === 'web') return <View style={styles.container}><iframe ref={iframeRef} srcDoc={mapHtml} style={styles.iframe} title="Echo memory map" /></View>;
  return <View style={styles.container}><WebView ref={webViewRef} source={{ html: mapHtml }} onMessage={handleMobileMessage} javaScriptEnabled domStorageEnabled style={styles.webview} backgroundColor="#0f1012" /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#0f1012' }, webview: { flex: 1 }, iframe: { border: 'none', width: '100%', height: '100%', backgroundColor: '#0f1012' } });
