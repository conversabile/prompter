import type { PromptChain } from '$lib/prompts';
import { loadChain } from '$lib/prompts';

export function load({ params }) {
	let promptChain: PromptChain | null = params.promptId ? loadChain(params.promptId) : null;

	return {
        promptChain: promptChain
	};
}