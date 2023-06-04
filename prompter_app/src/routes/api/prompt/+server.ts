import util from 'util';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import type { Prompt } from '$lib/prompts';
import { save } from '$lib/prompts';

export const GET = (({ url }) => {
    return new Response(`Error`);
}) satisfies RequestHandler;

/**
 * Create a new prompt record in database
 */
export const POST = (async ({ request }) => {
    const prompt: Prompt = await request.json();
    const promptId = crypto.randomUUID(); // TODO: polyfill
    const editKey = crypto.randomUUID(); // TODO: polyfill
    console.log(`POST /api/prompt. Generated promptId: ${promptId}`);
    save(promptId, prompt, editKey);
    return new Response(JSON.stringify({
        promptId: promptId,
        editKey: editKey
    }));
}) satisfies RequestHandler;
