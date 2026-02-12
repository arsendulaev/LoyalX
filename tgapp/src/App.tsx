import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletScreen } from './screens/WalletScreen';
import { CreateBrandScreen } from './screens/CreateBrandScreen';
import { SwapScreen } from './screens/SwapScreen';
import { MintScreen } from './screens/MintScreen';
import { ExchangeRatesScreen } from './screens/ExchangeRatesScreen';
import { Navigation } from './components/Navigation';

const manifestUrl = new URL('/LoyalX/tonconnect-manifest.json', window.location.origin).toString();

function App() {
  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{ twaReturnUrl: 'https://t.me/LoyalXBot' }}
      enableAndroidBackHandler={false}
      walletsListConfiguration={{
        includeWallets: [
          {
            appName: 'tonkeeper',
            name: 'Tonkeeper',
            imageUrl: 'https://tonkeeper.com/assets/tonconnect-icon.png',
            aboutUrl: 'https://tonkeeper.com',
            universalLink: 'https://app.tonkeeper.com/ton-connect',
            bridgeUrl: 'https://bridge.tonapi.io/bridge',
            platforms: ['ios', 'android', 'chrome', 'firefox'],
          },
          {
            appName: 'mytonwallet',
            name: 'MyTonWallet',
            imageUrl: 'https://static.mytonwallet.io/icon-256.png',
            aboutUrl: 'https://mytonwallet.io',
            universalLink: 'https://connect.mytonwallet.org',
            bridgeUrl: 'https://tonconnectbridge.mytonwallet.org/bridge',
            platforms: ['ios', 'android', 'chrome', 'firefox', 'safari'],
          },
        ],
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
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </TonConnectUIProvider>
  );
}

export default App;
