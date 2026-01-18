import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { 
    QWEN_OAUTH_BASE_URL, 
    QWEN_CLIENT_ID, 
    QWEN_SCOPE, 
    QWEN_CREDS_FILE 
} from './constants.js';

interface QwenCreds {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    resource_url?: string;
}

export class AuthManager {
    private credsPath: string;

    constructor() {
        this.credsPath = path.join(os.homedir(), QWEN_CREDS_FILE);
    }

    async getValidToken(): Promise<string> {
        // 1. Try to load existing token
        let creds = await this.loadCreds();

        if (creds && !this.isExpired(creds)) {
            return creds.access_token;
        }

        // 2. If expired but has refresh token, refresh it
        if (creds && creds.refresh_token) {
            console.error("[QwenAuth] Token expired, refreshing...");
            try {
                creds = await this.refreshToken(creds.refresh_token);
                await this.saveCreds(creds);
                return creds.access_token;
            } catch (e) {
                console.error("[QwenAuth] Refresh failed, falling back to login:", e);
            }
        }

        // 3. Start Device Flow Login
        console.error("[QwenAuth] Starting Device Login Flow...");
        creds = await this.startDeviceLogin();
        await this.saveCreds(creds);
        return creds.access_token;
    }

    private async loadCreds(): Promise<QwenCreds | null> {
        try {
            const content = await fs.readFile(this.credsPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    private async saveCreds(creds: QwenCreds) {
        await fs.mkdir(path.dirname(this.credsPath), { recursive: true });
        await fs.writeFile(this.credsPath, JSON.stringify(creds, null, 2));
    }

    private isExpired(creds: QwenCreds): boolean {
        // Buffer of 5 minutes
        return Date.now() > (creds.expiry_date - 300000);
    }

    private async refreshToken(refreshToken: string): Promise<QwenCreds> {
        const res = await fetch(`${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                client_id: QWEN_CLIENT_ID,
                refresh_token: refreshToken
            })
        });

        if (!res.ok) throw new Error(`Refresh failed: ${res.statusText}`);
        const data = await res.json() as any;
        
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshToken,
            expiry_date: Date.now() + (data.expires_in * 1000)
        };
    }

    private async startDeviceLogin(): Promise<QwenCreds> {
        // 1. Get Device Code
        const codeRes = await fetch(`${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/device/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: QWEN_CLIENT_ID,
                scope: QWEN_SCOPE
            })
        });

        if (!codeRes.ok) throw new Error("Failed to get device code");
        const codeData = await codeRes.json() as any;

        // 2. Show Instructions (This will show in OpenCode logs/output)
        // Since we are in a plugin, we can't easily print to the user's console interactively
        // unless we use specific hooks. For now, console.error shows in stderr.
        const msg = `
\n================================================================
🔒 QWEN AUTHENTICATION REQUIRED
================================================================
1. Open this URL: ${codeData.verification_uri}
2. Enter this Code: ${codeData.user_code}
================================================================\n
Waiting for authorization...`;
        
        console.error(msg); // This might appear in the CLI output

        // 3. Poll for Token
        return this.pollForToken(codeData.device_code, codeData.interval);
    }

    private async pollForToken(deviceCode: string, interval: number): Promise<QwenCreds> {
        while (true) {
            await new Promise(r => setTimeout(r, interval * 1000));
            
            const res = await fetch(`${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                    client_id: QWEN_CLIENT_ID,
                    device_code: deviceCode
                })
            });

            if (res.ok) {
                const data = await res.json() as any;
                console.error("\n✅ Successfully authenticated with Qwen!");
                return {
                    access_token: data.access_token,
                    refresh_token: data.refresh_token,
                    expiry_date: Date.now() + (data.expires_in * 1000)
                };
            }

            const error = await res.json() as any;
            if (error.error !== 'authorization_pending') {
                throw new Error(`Auth failed: ${error.error}`);
            }
        }
    }
}
