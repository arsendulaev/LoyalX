import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletScreen } from './screens/WalletScreen';
import { CreateBrandScreen } from './screens/CreateBrandScreen';
import { SwapScreen } from './screens/SwapScreen';
import { MintScreen } from './screens/MintScreen';
import { ExchangeRatesScreen } from './screens/ExchangeRatesScreen';
import { TransactionHistoryScreen } from './screens/TransactionHistoryScreen';
import { Navigation } from './components/Navigation';
import { ContractProvider } from './hooks/useContract';
import { BrandsProvider } from './hooks/useBrands';

const manifestUrl = 'https://arsendulaev.github.io/LoyalX/tonconnect-manifest.json';

function App() {
  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{ twaReturnUrl: 'https://t.me/LoyalXBot' }}
    >
      <ContractProvider>
        <BrandsProvider>
          <BrowserRouter basename="/LoyalX">
            <div className="h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
              <Navigation />
              <main className="flex-1 overflow-y-auto pb-16" style={{ scrollbarWidth: 'thin' }}>
                <div className="px-4 py-5 max-w-2xl mx-auto">
                  <Routes>
                    <Route path="/" element={<Navigate to="/wallet" replace />} />
                    <Route path="/wallet" element={<WalletScreen />} />
                    <Route path="/create-brand" element={<CreateBrandScreen />} />
                    <Route path="/swap" element={<SwapScreen />} />
                    <Route path="/mint" element={<MintScreen />} />
                    <Route path="/exchange-rates" element={<ExchangeRatesScreen />} />
                    <Route path="/history" element={<TransactionHistoryScreen />} />
                  </Routes>
                </div>
              </main>
            </div>
          </BrowserRouter>
        </BrandsProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '2px',
              background: '#111',
              color: '#E0E0E0',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              border: '0.5px solid rgba(46,91,255,0.3)',
              boxShadow: '0 0 20px rgba(46,91,255,0.1)',
            },
          }}
        />
      </ContractProvider>
    </TonConnectUIProvider>
  );
}

export default App;
