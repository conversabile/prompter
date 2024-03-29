import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { type PromptChain, PermissionDeniedError, isValidChain } from '$lib/chains/chains';
import { saveChain } from '$lib/chains/chains';

export const GET = (({ url }) => {
    const id = Number(url.searchParams.get('id') ?? '0');
    console.log(`GET /api/chain. id: ${id}`);
    return new Response(`I'm a chain with id ${id}`);
}) satisfies RequestHandler;

export const POST = (async ({ url, request, params }) => {
    const chain: PromptChain = await request.json();
    const editKey = url.searchParams.get('editKey') ?? undefined;
    if (editKey === undefined) {
        throw error(400, "Missing URL parameter: editKey");
    }
    console.log(`POST /api/chain/${params.chainId}`);
    if (! isValidChain(chain)) {
        throw error(400, "Invalid chain record");
    }
    try {
        saveChain(params.chainId!, chain, editKey);
    } catch (e) {
        if (e instanceof PermissionDeniedError) {
            throw error(403, "Invalid editKey");
        }
        throw(e);
    }
    
    return new Response();
}) satisfies RequestHandler;
