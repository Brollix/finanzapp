require('dotenv').config();

module.exports = {
  expo: {
    name: 'finanzapp-frontend',
    slug: 'finanzapp-frontend',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bluhllaqxvvflaguamwe.supabase.co',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsdWhsbGFxeHZ2ZmxhZ3VhbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5MDUzMTgsImV4cCI6MjA1NzQ4MTMxOH0.ms-6xCZRDm2BD1LvTCb9kt4-21CKpcolq07Crx3ggJw',
      eas: {
        projectId: 'your-eas-project-id'
      }
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.anonymous.finanzappfrontend'
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router'
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
