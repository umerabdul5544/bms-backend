import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mueed.bmssystem',
  appName: 'Bms Management System',
  webDir: 'dist', // ya 'build' jo bhi aapka frontend build folder hai
  
  // ⚠️ AGAR YAHAN SERVER KA BLOCK HAI, TO USE PRODUCTION K LIYE DELETE YA COMMENT KAR DEIN:
  /* 
  server: {
    url: "http://192.168.10.12:3000", <--- Isko production build mein NIKALNA hai!
    cleartext: true
  } 
  */
};

export default config;