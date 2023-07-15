import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import type { PromptChain } from '$lib/prompts';
import { saveChain } from '$lib/prompts';

export const GET = (({ url }) => {
    const id = Number(url.searchParams.get('id') ?? '0');
    console.log(`GET /api/chain. id: ${id}`);
    return new Response(`I'm a chain with id ${id}`);
}) satisfies RequestHandler;

export const POST = (async ({ url, request, params }) => {
    const chain: PromptChain = await request.json();
    const editKey = url.searchParams.get('id') ?? undefined;
    if (editKey === undefined) {
        throw error(400, "Missing URL parameter: editKey");
    }
    console.log(`POST /api/chain/${params.chainId}`);
    saveChain(params.chainId!, chain, editKey);
    return new Response();
}) satisfies RequestHandler;
