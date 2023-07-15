import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import type { PromptChain } from '$lib/prompts';
import { saveChain } from '$lib/prompts';

export const GET = (({ url }) => {
    return new Response(`Error`);
}) satisfies RequestHandler;

/**
 * Create a new prompt record in database
 */
export const POST = (async ({ request }) => {
    const chain: PromptChain = await request.json();
    const chainId = crypto.randomUUID(); // TODO: polyfill
    const editKey = crypto.randomUUID(); // TODO: polyfill
    console.log(`POST /api/chain. Generated chainId: ${chainId}`);
    saveChain(chainId, chain, editKey);
    return new Response(JSON.stringify({
        chainId: chainId,
        editKey: editKey
    }));
}) satisfies RequestHandler;
