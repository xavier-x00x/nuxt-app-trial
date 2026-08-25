export interface JournalEntryList {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  source_document_type?: string;
  source_document_id?: string;
  total_debit: number;
  total_credit: number;
  status: "DRAFT" | "POSTED" | "REVERSED";
  created_at: string;
}

export interface JournalEntryLine {
  id?: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  name?: string;
  account?: {
    name?: string;
    account_code?: string;
  };
  debit_amount: number;
  credit_amount: number;
  description?: string;
}

export interface JournalEntryDetail {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  source_document_type?: string;
  source_document_id?: string;
  total_debit: number;
  total_credit: number;
  status: "DRAFT" | "POSTED" | "REVERSED";
  reversed_at?: string;
  notes?: string;
  created_at: string;
  lines: JournalEntryLine[];
}
