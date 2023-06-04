import type { Prompt } from '$lib/prompts';
import { loadPrompt } from '$lib/prompts';

export function load({ params }) {
	let promptRecord: Prompt = params.promptId ? loadPrompt(params.promptId) : null;

	return {
        promptRecord: promptRecord
	};
}