export interface Registration {
  walletAddress: string;
  chatId: string;
  brandAddresses: string[];
}

export interface NotifyPayload {
  chatId: string;
  event: 'mint' | 'swap' | 'brand_created' | 'rate_proposed' | 'rate_accepted_incoming' | 'rate_accepted_outgoing';
  data?: Record<string, string>;
}
