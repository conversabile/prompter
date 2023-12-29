import type { PromptChain } from '$lib/prompts';
import { ChainNotFoundError, loadChain } from '$lib/prompts';
import { error, type ServerLoadEvent } from '@sveltejs/kit';

export function load({ url, params }: ServerLoadEvent) {
	if (params.chainId && ! /^[A-Za-z0-9\-]*$/.test(params.chainId)) {
		throw error(400, "Invalid Chain ID")
	}

	let promptChain: PromptChain | null;
	try {
		promptChain = params.chainId ? loadChain(params.chainId) : null;
		// console.debug("[server] loaded chain: ", promptChain);
	} catch (err) {
		if (err instanceof ChainNotFoundError) {
			throw error(404, 'Couldn\'t find any prompt in database with ID "' + params.chainId + '"');
		}
		throw err;
	}
	

	return {
		chainId: params.chainId,
		editKey: url.searchParams.get('editKey'),
		isShared: Boolean(url.searchParams.get('isShared')),
        promptChain: promptChain
	};
}