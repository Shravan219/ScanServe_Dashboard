<<<<<<< HEAD
=======
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
import path from 'path';
import fs from 'fs';

export interface WhatsAppBotState {
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_ready';
  qrCodeDataUrl: string | null;
  connectedNumber: string | null;
  lastError: string | null;
}

class WhatsAppBotService {
<<<<<<< HEAD
  private sock: any = null;
=======
  private sock: WASocket | null = null;
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
  private state: WhatsAppBotState = {
    status: 'disconnected',
    qrCodeDataUrl: null,
    connectedNumber: null,
    lastError: null
  };
  private authFolder = path.join(process.cwd(), '.whatsapp_auth');

  constructor() {
<<<<<<< HEAD
    try {
      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }
    } catch {
      // Auth folder creation fallback
=======
    if (!fs.existsSync(this.authFolder)) {
      fs.mkdirSync(this.authFolder, { recursive: true });
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
    }
  }

  public getState(): WhatsAppBotState {
    return { ...this.state };
  }

  public isConnected(): boolean {
    return this.state.status === 'connected' && !!this.sock;
  }

  public async init(): Promise<void> {
<<<<<<< HEAD
    let makeWASocket: any = null;
    let DisconnectReason: any = null;
    let useMultiFileAuthState: any = null;
    let QRCode: any = null;

    try {
      const baileysPkg = '@whiskeysockets/baileys';
      const baileys = await import(baileysPkg);
      makeWASocket = baileys.default || baileys.makeWASocket;
      DisconnectReason = baileys.DisconnectReason;
      useMultiFileAuthState = baileys.useMultiFileAuthState;
    } catch {
      // Optional Baileys module not installed
    }

    try {
      const qrPkg = 'qrcode';
      const qrModule = await import(qrPkg);
      QRCode = qrModule.default || qrModule;
    } catch {
      // Optional QRCode module not installed
    }

    if (!makeWASocket || !useMultiFileAuthState) {
      this.state.status = 'disconnected';
      this.state.lastError = 'Optional WhatsApp Baileys bot module is not installed. Direct WhatsApp links are used.';
      return;
    }

=======
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
    try {
      this.state.status = 'connecting';
      this.state.lastError = null;

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        browser: ['Vyoma POS', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

<<<<<<< HEAD
      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && QRCode) {
=======
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
          try {
            this.state.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
            this.state.status = 'qr_ready';
            console.log('[WhatsApp Bot] QR code generated. Scan from your WhatsApp -> Linked Devices');
          } catch (err: any) {
            console.error('[WhatsApp Bot] QR Code generation failed:', err);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
<<<<<<< HEAD
          const shouldReconnect = DisconnectReason ? statusCode !== DisconnectReason.loggedOut : false;
=======
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65

          this.state.status = 'disconnected';
          this.state.connectedNumber = null;
          this.state.qrCodeDataUrl = null;
          this.state.lastError = (lastDisconnect?.error as any)?.message || 'Connection closed';

          console.log(`[WhatsApp Bot] Connection closed. Reason: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            setTimeout(() => this.init(), 5000);
          } else {
            console.log('[WhatsApp Bot] Logged out. Clear .whatsapp_auth to rescan.');
          }
        } else if (connection === 'open') {
          this.state.status = 'connected';
          this.state.qrCodeDataUrl = null;
          this.state.lastError = null;
          const userJid = this.sock?.user?.id || '';
          this.state.connectedNumber = userJid.split(':')[0] || userJid.split('@')[0];
          console.log(`[WhatsApp Bot] Connected successfully as ${this.state.connectedNumber}!`);
        }
      });
    } catch (error: any) {
      console.error('[WhatsApp Bot] Initialization error:', error);
      this.state.status = 'disconnected';
      this.state.lastError = error?.message || 'Initialization failed';
    }
  }

  public async sendPDFDocument(
    rawPhone: string,
    pdfBuffer: Buffer,
    fileName: string,
    caption?: string
  ): Promise<{ success: boolean; message: string; jid?: string }> {
    if (!this.isConnected() || !this.sock) {
      return {
        success: false,
<<<<<<< HEAD
        message: 'WhatsApp bot is offline. Opened direct WhatsApp link.'
=======
        message: 'WhatsApp bot is not connected. Please scan QR code in settings.'
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
      };
    }

    // Format phone to WhatsApp JID
    let cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }

    const jid = `${cleaned}@s.whatsapp.net`;

    try {
      await this.sock.sendMessage(jid, {
        document: pdfBuffer,
        mimetype: 'application/pdf',
        fileName: fileName,
        caption: caption || '🧾 Official Tax Invoice Receipt'
      });

      console.log(`[WhatsApp Bot] Successfully sent PDF (${fileName}) directly to ${jid}`);
      return { success: true, message: 'PDF sent successfully', jid };
    } catch (err: any) {
      console.error(`[WhatsApp Bot] Failed to send PDF to ${jid}:`, err);
      return { success: false, message: err?.message || 'Failed to send message via WhatsApp bot' };
    }
  }
}

export const whatsAppBot = new WhatsAppBotService();
