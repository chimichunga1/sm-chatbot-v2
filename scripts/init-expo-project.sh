#!/bin/bash

# PriceBetter.ai Expo Migration Script
# This script initializes a new Expo project with the necessary dependencies
# to begin migrating PriceBetter.ai to a mobile application.
# Configured for React 19 compatibility.

echo "=== PriceBetter.ai Expo Migration Initializer ==="
echo "This script will create a new Expo project configured for PriceBetter.ai."
echo "Using the latest Expo SDK with React 19 compatibility."
echo ""

# Create directory for the mobile project
MOBILE_DIR="pricebetter-mobile"

# Check if the directory already exists
if [ -d "$MOBILE_DIR" ]; then
  echo "Error: Directory '$MOBILE_DIR' already exists."
  echo "Please remove or rename the existing directory before proceeding."
  exit 1
fi

echo "Creating a new Expo project in './$MOBILE_DIR'..."

# Create a new Expo project with TypeScript template (latest version with React 19)
npx create-expo-app@latest $MOBILE_DIR --template expo-template-blank-typescript

# Navigate to the project directory
cd $MOBILE_DIR || exit 1

echo "Installing core dependencies..."
echo "Note: Using React 19 compatible versions of all packages"

# Install React Navigation (for navigation)
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs @react-navigation/drawer
npm install react-native-screens react-native-safe-area-context @react-native-masked-view/masked-view react-native-gesture-handler

# Install Firebase for authentication
npm install firebase @react-native-firebase/app @react-native-firebase/auth

# Install state management libraries
npm install @tanstack/react-query@latest zustand@latest

# Install UI libraries
npm install nativewind@latest tailwindcss@latest
npm install react-native-reanimated@latest

# Install utilities and API client
npm install axios@latest date-fns@latest

# Install styling and theme dependencies
npm install react-native-svg@latest

# Setup NativeWind (Tailwind for React Native)
npx tailwindcss init

# Create basic folder structure
mkdir -p src/api
mkdir -p src/assets
mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/screens
mkdir -p src/navigation
mkdir -p src/utils
mkdir -p src/types
mkdir -p src/context
mkdir -p src/features/auth
mkdir -p src/features/quotes
mkdir -p src/features/training
mkdir -p src/features/settings

# Create sample App.tsx file
cat > App.tsx << 'EOL'
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client for React Query
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          {/* Navigation structure will go here */}
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
EOL

# Create tailwind.config.js file
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1DB954',
          50: '#B8F7D3',
          100: '#A3F4C4',
          200: '#7BEFA7',
          300: '#52EA8A',
          400: '#29E46D',
          500: '#1DB954',
          600: '#168A3F',
          700: '#105C2A',
          800: '#092E15',
          900: '#021100',
        },
        success: '#1DB954',
        error: '#E53935',
        warning: '#FFA000',
        info: '#2196F3',
        background: {
          light: '#FFFFFF',
          dark: '#121212',
        },
        text: {
          light: '#000000',
          dark: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}
EOL

# Create babel.config.js file
cat > babel.config.js << 'EOL'
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin'
    ],
  };
};
EOL

# Create tsconfig.json file
cat > tsconfig.json << 'EOL'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
EOL

# Create a sample authentication screen
cat > src/screens/AuthScreen.tsx << 'EOL'
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (isLogin) {
      console.log('Login with:', email, password);
      // Implement login logic
    } else {
      console.log('Register with:', email, password, name);
      // Implement registration logic
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>PriceBetter.ai</Text>
      <Text style={styles.subtitle}>
        {isLogin ? 'Sign in to your account' : 'Create your account'}
      </Text>

      <View style={styles.form}>
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchModeButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchModeText}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1DB954',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1DB954',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#1DB954',
    fontSize: 16,
  },
});
EOL

# Create a basic README for the mobile project
cat > README.md << 'EOL'
# PriceBetter.ai Mobile App

This is the mobile app version of PriceBetter.ai, built with Expo and React Native.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo CLI
- iOS Simulator (for macOS) or Android Emulator

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Start the development server:

```bash
npm start
# or
yarn start
```

3. Follow the instructions in the terminal to open the app on your device or emulator.

## Project Structure

- `/src/api` - API client and network requests
- `/src/assets` - Static assets like images
- `/src/components` - Reusable UI components
- `/src/hooks` - Custom React hooks
- `/src/screens` - App screens
- `/src/navigation` - Navigation configuration
- `/src/utils` - Utility functions
- `/src/types` - TypeScript type definitions
- `/src/context` - React context providers
- `/src/features` - Feature-specific components and logic

## Features

- User authentication (login, registration)
- Quotes management
- AI-powered quote generation
- Training module
- Settings and user profile

## Contributing

Please follow the established coding standards and commit message format.

## License

Proprietary - All rights reserved
EOL

echo ""
echo "=== Expo project setup complete! ==="
echo ""
echo "Your new Expo project has been created in './$MOBILE_DIR'"
echo ""
echo "To start the development server:"
echo "  cd $MOBILE_DIR"
echo "  npm start"
echo ""
echo "This will launch the Expo development server and allow you to run the app"
echo "on your physical device (using the Expo Go app) or on an emulator/simulator."
echo ""
echo "Refer to the migration plan document for next steps and implementation details."