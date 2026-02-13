import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletScreen } from './screens/WalletScreen';
import { CreateBrandScreen } from './screens/CreateBrandScreen';
import { SwapScreen } from './screens/SwapScreen';
import { MintScreen } from './screens/MintScreen';
import { ExchangeRatesScreen } from './screens/ExchangeRatesScreen';
import { Navigation } from './components/Navigation';

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
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <Navigation />
          <main className="flex-1 overflow-y-auto pb-16">
            <div className="px-4 py-4 max-w-2xl mx-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/wallet" replace />} />
                <Route path="/wallet" element={<WalletScreen />} />
                <Route path="/create-brand" element={<CreateBrandScreen />} />
                <Route path="/swap" element={<SwapScreen />} />
                <Route path="/mint" element={<MintScreen />} />
                <Route path="/exchange-rates" element={<ExchangeRatesScreen />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', background: '#1e1b4b', color: '#fff', fontSize: '14px' },
        }}
      />
    </TonConnectUIProvider>
  );
}

export default App;