import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WalletScreen } from './screens/WalletScreen';
import { CreateBrandScreen } from './screens/CreateBrandScreen';
import { SwapScreen } from './screens/SwapScreen';
import { Navigation } from './components/Navigation';

// Используем полный абсолютный URL для GitHub Pages
const manifestUrl = 'https://raijin57.github.io/LoyalX/tonconnect-manifest.json';

function App() {
  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/LoyalXBot'
      }}
    >
      <BrowserRouter basename="/LoyalX">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/wallet" replace />} />
              <Route path="/wallet" element={<WalletScreen />} />
              <Route path="/create-brand" element={<CreateBrandScreen />} />
              <Route path="/swap" element={<SwapScreen />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TonConnectUIProvider>
  );
}

export default App;
