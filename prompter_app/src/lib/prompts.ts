import fs from 'fs';
import util from 'util';

import { convert } from 'html-to-text';
import nunjucks from 'nunjucks';
nunjucks.configure({autoescape: false, trimBlocks: true});
nunjucks.installJinjaCompat();

export interface Prompt {
  version: number;
  prompt_text: string;
  parameters_dict: Record<string, string>;
  title: string;
}

function promptBasePath(promptId: string) {
  return `./data/${promptId[0]}/${promptId}`
}

function promptDataPath(promptId: string) {
  return promptBasePath(promptId) + '/prompt.json'
}

function promptEditKeyPath(promptId: string) {
  return promptBasePath(promptId) + '/editKey'
}

export function savePrompt(promptId: string, prompt: Prompt, editKey: string) {
  // export function save({promptId: string, prompt: Prompt}) {
  console.debug(`Saving prompt "${promptId}": ` + util.inspect(prompt, {showHidden: false, depth: null, colors: true}));

  const basePath: string = promptBasePath(promptId);
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
    fs.writeFileSync(
      promptEditKeyPath(promptId),
      editKey,
      'utf8'
    );
  } else {
    // TODO: implement editKey check
    throw new PermissionDeniedError(`Cannot overwrite existing data in folder: ${basePath}`)
  }

  fs.writeFileSync(
    promptDataPath(promptId),
    JSON.stringify(prompt),
    'utf8'
  );
}

export function loadPrompt(promptId: string) {
  let rawdata: Buffer = fs.readFileSync(promptDataPath(promptId));
  let prompt = JSON.parse(rawdata.toString());

  // v1: convert HTML to plain text
  if (prompt.version == 1) {
    prompt.prompt_text = convert(prompt.prompt_text);
    prompt.version = 2;
  }

  return prompt;
}

export function renderPrompt(promptText: string, paramDict: Record<string, string>): string {
  let result = promptText;
  result = nunjucks.renderString(promptText, paramDict);
  return result.trim();
}

export class PermissionDeniedError extends Error {};