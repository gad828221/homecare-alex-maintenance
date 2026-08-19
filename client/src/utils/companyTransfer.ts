export type CompanyTransferStatus = 'pending' | 'confirmed';

export type CompanyTransferState = {
  status: CompanyTransferStatus;
  amount?: number;
  technician?: string;
  at?: string;
};

const START_MARKER = '[COMPANY_TRANSFER:';
const END_MARKER = '[/COMPANY_TRANSFER]';

export const createCompanyTransferMarker = (state: CompanyTransferState): string =>
  `${START_MARKER}${JSON.stringify(state)}${END_MARKER}`;

export const parseCompanyTransfer = (note: unknown): CompanyTransferState | null => {
  const text = String(note || '');
  const start = text.indexOf(START_MARKER);
  if (start < 0) return null;
  const payloadStart = start + START_MARKER.length;
  const end = text.indexOf(END_MARKER, payloadStart);
  if (end < 0) return null;
  try {
    const parsed = JSON.parse(text.slice(payloadStart, end));
    if (parsed?.status !== 'pending' && parsed?.status !== 'confirmed') return null;
    return parsed as CompanyTransferState;
  } catch {
    return null;
  }
};

export const mergeCompanyTransferMarker = (note: unknown, state: CompanyTransferState): string => {
  const text = String(note || '');
  const start = text.indexOf(START_MARKER);
  if (start < 0) return `${text}${text ? '\n' : ''}${createCompanyTransferMarker(state)}`;
  const payloadStart = start + START_MARKER.length;
  const end = text.indexOf(END_MARKER, payloadStart);
  if (end < 0) return `${text}\n${createCompanyTransferMarker(state)}`;
  return `${text.slice(0, start)}${createCompanyTransferMarker(state)}${text.slice(end + END_MARKER.length)}`;
};

export const isCompanyTransferPending = (note: unknown): boolean =>
  parseCompanyTransfer(note)?.status === 'pending';

export const isCompanyTransferConfirmed = (note: unknown): boolean =>
  parseCompanyTransfer(note)?.status === 'confirmed';
