import fs from 'fs';
import util from 'util';

export interface Prompt {
  version: number;
  prompt_text: string;
  parameters_dict: Object;
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

export function save(promptId: string, prompt: Prompt, editKey: string) {
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

export class PermissionDeniedError extends Error {};