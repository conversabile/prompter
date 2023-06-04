import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import type { Prompt } from '$lib/prompts';
import { save } from '$lib/prompts';

export const GET = (({ url }) => {
    const id = Number(url.searchParams.get('id') ?? '0');
    console.log(`GET /api/prompt. id: ${id}`);
    return new Response(`I'm a prompt with id ${id}`);
}) satisfies RequestHandler;

export const POST = (async ({ url, request, params }) => {
    const prompt: Prompt = await request.json();
    const editKey = url.searchParams.get('id') ?? undefined;
    if (editKey === undefined) {
        throw error(400, "Missing URL parameter: editKey");
    }
    console.log(`POST /api/prompt/${params.promptId}`);
    save(params.promptId!, prompt, editKey);
    return new Response();
}) satisfies RequestHandler;
