import type { IncomingMessage, ServerResponse } from 'http';

function send(res: ServerResponse, status: number, body: unknown) {
	res.statusCode = status;
	res.setHeader('Content-Type', 'application/json');
	res.end(JSON.stringify(body));
}

// Reads entire request body as string
async function readBody(req: IncomingMessage): Promise<string> {
	return await new Promise((resolve, reject) => {
		let data = '';
		req.on('data', (chunk) => { data += chunk; });
		req.on('end', () => resolve(data));
		req.on('error', reject);
	});
}

type IncomingMessageItem = { role: 'user' | 'ai'; content: string };

type AiServiceResponse = {
	response: string;
	cards?: any[];
	intent?: string;
	trace_id?: string;
	errors?: string[];
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', ['POST']);
		return send(res, 405, { success: false, error: `Method ${req.method} Not Allowed` });
	}

	try {
		const raw = await readBody(req);
		const parsed = raw ? JSON.parse(raw) : {};
		const messages: IncomingMessageItem[] = Array.isArray(parsed?.messages) ? parsed.messages : [];

		// Extract latest user message as the main prompt
		const lastUser = [...messages].reverse().find((m) => m.role === 'user');
		const message = lastUser?.content || (messages[messages.length - 1]?.content ?? '').toString();
		if (!message || !message.trim()) {
			return send(res, 400, { success: false, error: 'Missing message in request body' });
		}

		// Build payload for AI service per ai-service/README.md
		const aiPayload = {
			message,
			user_id: undefined,
			context: { history: messages },
		};

		const aiUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8081';
		const controller = new AbortController();
		const timeoutMs = Number(process.env.AI_CHAT_TIMEOUT_MS || 20000);
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

		let aiJson: AiServiceResponse | null = null;
		try {
			const resp = await fetch(`${aiUrl}/v1/agent/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify(aiPayload),
				signal: controller.signal,
			});
			clearTimeout(timeout);
			if (!resp.ok) {
				const txt = await resp.text();
				throw new Error(`AI service error ${resp.status}: ${txt || resp.statusText}`);
			}
			aiJson = await resp.json();
		} catch (err: any) {
			clearTimeout(timeout);
			console.error('[API /api/chat] Error calling AI service:', err?.message || err);
			return send(res, 502, { success: false, error: 'Không thể kết nối AI service. Vui lòng thử lại sau.' });
		}

		const responseText = (aiJson?.response || '').toString();
		const cards = Array.isArray(aiJson?.cards) ? aiJson?.cards : undefined;

		return send(res, 200, { success: true, data: { response: responseText, cards } });
	} catch (err: any) {
		console.error('[API /api/chat] Unexpected error:', err);
		return send(res, 500, { success: false, error: err?.message || 'Server error' });
	}
}


