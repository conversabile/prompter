import type { PromptChain } from '$lib/prompts';
import { loadChain } from '$lib/prompts';

export function load({ url, params }) {
	let promptChain: PromptChain | null = params.chainId ? loadChain(params.chainId) : null;

	return {
		chainId: params.chainId,
		editKey: url.searchParams.get('editKey'),
		isShared: Boolean(url.searchParams.get('isShared')),
        promptChain: promptChain
	};
}