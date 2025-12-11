import type { IncomingMessage, ServerResponse } from 'http';

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve) => {
		let data = '';
		req.on('data', (chunk) => { data += chunk; });
		req.on('end', () => resolve(data));
	});
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', ['POST']);
		res.statusCode = 405;
		return res.end('Method Not Allowed');
	}

	try {
		const raw = await readBody(req);
		const parsed = raw ? JSON.parse(raw) : {};
		const message = (parsed?.message || '').toString();
		const user_id = parsed?.user_id || undefined;
		const context = parsed?.context || undefined;
		if (!message || !message.trim()) {
			res.statusCode = 400;
			res.setHeader('Content-Type', 'application/json');
			return res.end(JSON.stringify({ success: false, error: 'Missing message in request body' }));
		}

		const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8081';
		const controller = new AbortController();
		const timeoutMs = Number(process.env.AI_CHAT_TIMEOUT_MS || 30000);
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		let aiResp: Response | null = null;
		try {
			aiResp = await fetch(`${aiUrl}/v1/agent/chat/stream`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message, user_id, context }),
				signal: controller.signal,
			});
		} catch (err: any) {
			clearTimeout(timeout);
			res.statusCode = 502;
			res.setHeader('Content-Type', 'application/json');
			return res.end(JSON.stringify({ success: false, error: 'Không thể kết nối AI service. Vui lòng thử lại sau.' }));
		}

		clearTimeout(timeout);
		if (!aiResp || !aiResp.ok || !aiResp.body) {
			res.statusCode = aiResp?.status || 502;
			res.setHeader('Content-Type', 'application/json');
			const txt = aiResp ? await aiResp.text() : '';
			return res.end(JSON.stringify({ success: false, error: txt || 'AI service error' }));
		}

		// Stream passthrough
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain; charset=utf-8');
		const reader = (aiResp.body as any).getReader();
		const encoder = new TextEncoder();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) {
					res.write(Buffer.from(value));
				}
			}
		} catch (_) {
			// If client disconnects or other stream error, just end
		} finally {
			res.end();
		}
	} catch (err: any) {
		res.statusCode = 500;
		res.setHeader('Content-Type', 'application/json');
		return res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
	}
}

export const config = {
	runtime: 'nodejs',
};



