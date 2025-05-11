export interface Quote {
  id: number;
  quoteNumber: string;
  title: string;
  clientName: string;
  description?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced';
  totalAmount?: number | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
  companyId: number;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: number;
  quoteId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  totalAmount: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteFormValues {
  title: string;
  clientName: string;
  description?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced';
  items: QuoteItemFormValues[];
}

export interface QuoteItemFormValues {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
  totalAmount?: number;
  position?: number;
}