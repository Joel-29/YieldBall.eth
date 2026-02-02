import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import App from './App.jsx';
import { config } from './config/wagmi.js';
import './index.css';

const queryClient = new QueryClient();

// Custom RainbowKit theme to match our cyberpunk aesthetic
const customTheme = darkTheme({
  accentColor: '#8b5cf6',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

customTheme.colors.connectButtonBackground = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(255, 0, 110, 0.3))';
customTheme.colors.modalBackground = '#0f172a';
customTheme.colors.modalBorder = '#8b5cf6';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
