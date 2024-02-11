import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

import type { PromptChain } from '$lib/chains';
import { chainExists, saveChain } from '$lib/chains';

export const GET = (({ url }) => {
    return new Response(`Error`);
}) satisfies RequestHandler;

/**
 * Create a new prompt record in database
 */
export const POST = (async ({ request }) => {
    const chain: PromptChain = await request.json();
    let chainId = nanoid(11);
    while (chainExists(chainId)) {
        console.warn("Chain id collision!", chainId);
        chainId = nanoid(11);
    }
    const editKey = crypto.randomUUID(); // TODO: polyfill
    console.log(`POST /api/chain. Generated chainId: ${chainId}`);
    saveChain(chainId, chain, editKey);
    return new Response(JSON.stringify({
        chainId: chainId,
        editKey: editKey
    }));
}) satisfies RequestHandler;
