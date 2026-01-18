import { AuthManager } from './auth.js';
import { QWEN_API_BASE_URL } from './constants.js';

// Initialize AuthManager singleton
const authManager = new AuthManager();

export default async function(context: any) {
    return {
        auth: {
            provider: 'qwen', // Hooks into the 'qwen' provider defined in config.json
            loader: async () => {
                try {
                    // This handles load, refresh, or login flow automatically
                    const accessToken = await authManager.getValidToken();

                    return {
                        apiKey: 'qwen-oauth-token', // Dummy key to satisfy types
                        fetch: async (url: string, options: any = {}) => {
                            const headers = new Headers(options.headers);
                            headers.set('Authorization', `Bearer ${accessToken}`);
                            
                            return fetch(url, {
                                ...options,
                                headers
                            });
                        }
                    };
                } catch (error: any) {
                    console.error("Qwen Plugin Error:", error);
                    throw error;
                }
            }
        }
    };
}
