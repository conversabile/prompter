import fs from 'fs';
import util from 'util';

import { convert } from 'html-to-text';
import nunjucks from 'nunjucks';
nunjucks.configure({autoescape: false, trimBlocks: true});
nunjucks.installJinjaCompat();

export const promptSchemaVersion: number = 3; /* 2: plain text promptText */
                                              /* 1: HTML promptText with Jinja2 template */

function assert(value: unknown) {
  if (! value) {
    throw Error("Assertion Error (todo: find out how assertions work in typescript...");
  }
}

export interface Prompt {
  version: number;
  prompt_text: string;
  parameters_dict: Record<string, string>;
  title: string;
}

export interface PromptChain {
  version: number;
  title: string;
  prompts: Prompt[];
}

function chainBasePath(promptId: string) {
  return `./data/${promptId[0]}/${promptId}`
}

function chainDataPath(promptId: string) {
  return chainBasePath(promptId) + '/prompt.json'
}

function chainEditKeyPath(promptId: string) {
  return chainBasePath(promptId) + '/editKey'
}

export function saveChain(chainId: string, chain: PromptChain, editKey: string) {
  // export function save({promptId: string, prompt: Prompt}) {
  console.debug(`Saving chain "${chainId}": ` + util.inspect(chain, {showHidden: false, depth: null, colors: true}));

  const basePath: string = chainBasePath(chainId);
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
    fs.writeFileSync(
      chainEditKeyPath(chainId),
      editKey,
      'utf8'
    );
  } else {
    // TODO: implement editKey check
    throw new PermissionDeniedError(`Cannot overwrite existing data in folder: ${basePath}`)
  }

  fs.writeFileSync(
    chainDataPath(chainId),
    JSON.stringify(chain),
    'utf8'
  );
}

export function loadChain(chainId: string): PromptChain {
  let rawdata: Buffer = fs.readFileSync(chainDataPath(chainId));
  let chainOrPrompt: PromptChain | Prompt = JSON.parse(rawdata.toString());

  // Upgrade if legacy record
  let chain = upgradeChainOrPrompt(chainOrPrompt)

  return chain;
}

export function renderPrompt(promptText: string, paramDict: Record<string, string>): string {
  let result = promptText;
  result = nunjucks.renderString(promptText, paramDict);
  return result.trim();
}

export class PermissionDeniedError extends Error {};

// Record compatibility

function upgradeChainOrPrompt(chainOrPrompt: PromptChain | Prompt): PromptChain {
  if (chainOrPrompt.version <= 2) {
    return upgradePrompt(chainOrPrompt as Prompt)
  }

  return upgradeChain(chainOrPrompt as PromptChain);
}

function upgradePrompt(prompt: Prompt): PromptChain {
  assert(prompt.version <= 2); // From v3 records have PromptChain type

  if (prompt.version == 1) {
    prompt.prompt_text = convert(prompt.prompt_text);
    prompt.version = 2;
  }

  let result = {
    version: promptSchemaVersion,
    title: prompt.title,
    prompts: [prompt]
  }

  return upgradeChain(result);
}

function upgradeChain(chain: PromptChain): PromptChain {
  return chain;
}