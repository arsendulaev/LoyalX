import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTonConnect } from '../hooks/useTonConnect';
import { useContract } from '../hooks/useContract';
import { useTonConnectUI } from '@tonconnect/ui-react';
import toast from 'react-hot-toast';
import { getUserJettons } from '../services/tonApiService';
import { notifyEvent } from '../services/notificationService';
import { handleTxError } from '../utils/toastError';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } },
  item: {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: "easeOut" as const } },
  },
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  letterSpacing: '0.15em',
  color: 'rgba(224,224,224,0.35)',
  marginBottom: 6,
};

export function CreateBrandScreen() {
  const { connected, address } = useTonConnect();
  const contractService = useContract();
  const [tonConnectUI] = useTonConnectUI();
  const [brandName, setBrandName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) { toast.error('Подключите кошелёк'); return; }
    if (!contractService) { toast.error('Инициализация... повторите'); return; }
    if (!brandName.trim() || !ticker.trim()) { toast.error('Заполните название и тикер'); return; }

    setLoading(true);
    try {
      const isActive = await contractService.checkFactoryActive();
      if (!isActive) { toast.error('Factory контракт не развёрнут'); return; }

      const msg = contractService.buildCreateBrandPayload({
        name: brandName.trim(),
        description: description.trim(),
        symbol: ticker.trim(),
        image: imageUrl.trim() || 'https://via.placeholder.com/150',
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [msg],
      });

      toast.success('Транзакция отправлена! Ждём подтверждения...');
      contractService.clearCache();

      let appeared = false;
      if (address) {
        const userAddrStr = address.toString({ urlSafe: true, bounceable: true });
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const jettons = await getUserJettons(userAddrStr);
            const tickerUpper = ticker.trim().toUpperCase();
            if (jettons.some(j => j.symbol?.toUpperCase() === tickerUpper)) { appeared = true; break; }
          } catch {}
        }
      }

      contractService.clearCache();
      setBrandName(''); setTicker(''); setDescription(''); setImageUrl('');
      toast.success(appeared ? 'Brand created!' : 'Бренд создан! Может появиться в кошельке через минуту.');
      notifyEvent('brand_created', { name: brandName.trim(), symbol: ticker.trim() });
    } catch (error) {
      handleTxError(error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(224,224,224,0.3)' }}>
          // Подключите кошелёк для создания бренда
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={stagger.item} className="flex items-end justify-between">
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '0.05em', color: '#E0E0E0' }}>
          NEW БРЕНД
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(46,91,255,0.7)', letterSpacing: '0.1em' }}>
          СОЗДАТЬ БРЕНД
        </span>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={stagger.item} className="brand-card rounded-sm p-4 space-y-4">
          <div>
            <label style={labelStyle}>НАЗВАНИЕ БРЕНДА</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="input-industrial w-full px-3 py-2.5 rounded-sm"
              placeholder="Coffee Shop"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>ТИКЕР <span style={{ color: 'rgba(224,224,224,0.2)' }}>// 3-4 символа</span></label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="input-industrial w-full px-3 py-2.5 rounded-sm"
              placeholder="COF"
              maxLength={4}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>ОПИСАНИЕ <span style={{ color: 'rgba(224,224,224,0.2)' }}>// необязательно</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-industrial w-full px-3 py-2.5 rounded-sm resize-none"
              placeholder="Loyalty program for coffee shop"
              rows={3}
            />
          </div>

          <div>
            <label style={labelStyle}>ССЫЛКА НА ЛОГОТИП <span style={{ color: 'rgba(224,224,224,0.2)' }}>// необязательно</span></label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input-industrial w-full px-3 py-2.5 rounded-sm"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(224,224,224,0.25)', letterSpacing: '0.1em' }}>
              ГАЗ ~1.1 TON · ВЫ СТАНОВИТЕСЬ ВЛАДЕЛЬЦЕМ БРЕНДА
            </span>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </motion.div>

        <motion.button
          variants={stagger.item}
          type="submit"
          disabled={loading}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full py-4 relative overflow-hidden"
          style={{
            background: loading ? 'rgba(255,255,255,0.04)' : '#2E5BFF',
            border: `0.5px solid ${loading ? 'rgba(255,255,255,0.08)' : 'rgba(46,91,255,0.5)'}`,
            borderRadius: 2,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.15em',
            color: loading ? 'rgba(224,224,224,0.3)' : '#fff',
            boxShadow: loading ? 'none' : '0 0 30px rgba(46,91,255,0.25)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              РАЗВЁРТЫВАНИЕ...
            </span>
          ) : 'СОЗДАТЬ БРЕНД'}
        </motion.button>
      </form>
    </motion.div>
  );
}
