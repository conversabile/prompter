import fs from 'fs';
import util from 'util';

import { convert } from 'html-to-text';
import { defaultPredictionSettings, PredictionService, type PredictionSettings } from '../services';
import { isEqual } from '../util';
import { faBook, faPlug, faRobot, type IconDefinition } from '@fortawesome/free-solid-svg-icons';

export const promptSchemaVersion: number = 5; /* 5: prompts -> steps */
                                              /* 4: camelCase; add predictionService, predictionSettings */
                                              /* 3: records are prompt chains */
                                              /* 2: plain text promptText */
                                              /* 1: HTML promptText with Jinja2 template */

function assert(value: unknown) {
  if (! value) {
    throw Error("Assertion Error (todo: find out how assertions work in typescript...");
  }
}

/*
 * Interfaces
 */

export enum StepType {
  prompt = "prompt",
  documentIndex = "documentIndex",
  rest = "rest"
}

export interface PromptChain {
  version: number;
  title: string;
  steps: Step[];
  parametersDict: Record<string, string>;
}

export interface Step {
  title: string;
  stepType: StepType,
  resultKey: string;
  results?: StepResult[] | null;
  minimized: boolean;
}

export interface StepResult {
  datetime: Date,
  resultRaw: string,
  resultJson: object | null
}

export interface PromptStep extends Step {
  promptText: string;
  results?: PromptStepResult[] | null;
  predictionService: PredictionService,
  predictionSettings: PredictionSettings;
}

export interface PromptStepResult extends StepResult {
  renderedPrompt: string,
  model: string
}

export enum RestStepMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

export interface RestStepHeader {
  key: string,
  value: string,
  disabled: boolean
}

export interface RestStep extends Step {
  method: RestStepMethods,
  url: string,
  header: RestStepHeader[],
  body: string | null,
  results?: RestStepResult[] | null;
}

interface StepTypeData {
  label: string,
  icon: IconDefinition
}

export interface RestStepResult extends StepResult {
  status: number
}

export const STEP_TYPE_DATA: Record<StepType, StepTypeData> = {
  [StepType.prompt]: {
      label: "Prompt",
      icon: faRobot,
  },
  [StepType.rest]: {
      label: "API Call (beta)",
      icon: faPlug,
  },
  [StepType.documentIndex]: {
      label: "Document Index",
      icon: faBook,
  }
};


/*
 * Input/Output
 */

function chainBasePath(promptId: string) {
  return `./data/${promptId[0]}/${promptId}`
}

function chainDataPath(promptId: string) {
  return chainBasePath(promptId) + '/prompt.json'
}

function chainEditKeyPath(promptId: string) {
  return chainBasePath(promptId) + '/editKey'
}

export function chainExists(chainId: string) {
  return fs.existsSync(chainBasePath(chainId));
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
  } else if (! isValidEditKey(chainId, editKey)) {
    throw new PermissionDeniedError(`Incorrect editKey for prompt record at: ${basePath}`)
  }

  fs.writeFileSync(
    chainDataPath(chainId),
    JSON.stringify(chain),
    'utf8'
  );
}

function isValidEditKey(chainId: string, editKey: string): boolean {
  let expected: string = fs.readFileSync(chainEditKeyPath(chainId)).toString();
  return expected == editKey;
}

export function loadChain(chainId: string): PromptChain {
  let rawdata: Buffer;

  try {
    rawdata = fs.readFileSync(chainDataPath(chainId));
  } catch (error: any) {
    const nodeError: NodeJS.ErrnoException = error;
    if (nodeError.code == "ENOENT") {
      throw new ChainNotFoundError("Chain not found");
    } 
    throw error;
  }

  let chainOrPrompt: object = JSON.parse(rawdata.toString());

  // Upgrade if legacy record
  let chain = upgradeChainOrPrompt(chainOrPrompt)

  return chain;
}

export class ChainNotFoundError extends Error {};
export class PermissionDeniedError extends Error {};



/*
 * Record Compatibility
 */

function upgradeChainOrPrompt(chainOrPrompt: any): PromptChain {
  if (chainOrPrompt.version <= 2) {
    return upgradePrompt(chainOrPrompt as PromptStep)
  }

  return upgradeChain(chainOrPrompt as PromptChain);
}

function upgradePrompt(prompt: any): PromptChain {
  assert(prompt.version <= 2); // From v3 records have PromptChain type

  if (prompt.version == 1) {
    prompt.prompt_text = convert(prompt.prompt_text);
    prompt.version = 2;
  }

  let result = {
    version: 3,
    title: prompt.title,
    prompts: [prompt]
  }

  return upgradeChain(result);
}

function upgradeChain(chain: any): PromptChain {
  if (chain.version < 4) {
    chain = {
      version: 4,
      title: chain.title,
      prompts: [{
        version: 4,
        promptText: chain.prompts[0].prompt_text,
        parametersDict: chain.prompts[0].parameters_dict,
        title: chain.prompts[0].title,
        predictions: chain.prompts[0].predictions ?? null,
        predictionService: "openai",
        predictionSettings: defaultPredictionSettings(),
      }]
    }
  }

  if (chain.version < 5) {
    chain = {
      version: 5,
      title: chain.title,
      parametersDict: chain.prompts[0].parametersDict,
      steps: chain.prompts.map((prompt: any) => ({
        stepType: "prompt",
        title: prompt.title,
        resultKey: "result_0",
        results: prompt.predictions?.map((prediction: any) : PromptStepResult => {
          return {
            model: prediction.model,
            datetime: prediction.datetime,
            renderedPrompt: prediction.renderedPrompt,
            resultRaw: prediction.predictionRaw,
            resultJson: null
          }
        }),
        minimized: false,
        promptText: prompt.promptText,
        predictionService: prompt.predictionService,
        predictionSettings: prompt.predictionSettings
      }))
    }
  }
  // console.log("Loading chain", chain as PromptChain);
  return chain;
}


/*
 * Util
 */

const paramParseRegex = /\{\{\s*(\w+)\s*(?:\||\}\})/gi // Jinja variables

export function isValidChain(promptChain: PromptChain) : boolean {
  for (let step of promptChain.steps) {
    if (! isValidParamName(step.resultKey)) return false;
  }
  return true;
}

export function isValidParamName(s: string) : boolean {
  return (s.match(/^\w+$/gi) && s.search("__") == -1 && true) || false;
}

/**
 * Matches and return parameter names in a prompt template
 * @param prompt A Prompt step in a Chain
 * @returns The list of parameter names that are matched in the prompt template message
 */
export function stepParameterNameList(step: Step) : Array<string> {
  let result: string[] = [];

  let fieldsToMatch: string[] = [];
  if (step.stepType == StepType.prompt) {
    fieldsToMatch = [(step as PromptStep).promptText]
  } else if (step.stepType == StepType.rest) {
    const restStep = (step as RestStep);
    fieldsToMatch = [
      restStep.url,
    ];
    if (restStep.body) fieldsToMatch.push(restStep.body);
    restStep.header.forEach((h) => {fieldsToMatch.push(h.value)});
  } else {
    throw Error("Unsupported step type");
  }

  let newParamList: string[] = [];
  fieldsToMatch.forEach((s: string) => {
    let matchedParams = s.matchAll(paramParseRegex);
    if (matchedParams) {
      for (let param of matchedParams) {
        let paramName = param[1];
        // if (paramDict[paramName] == undefined) { paramDict[paramName] = ""; }
        newParamList.push(paramName);
      }
    }
  });
  
  result = Array.from(new Set(newParamList));

  return result;
}

/**
 * Extracts the list of parameters from the prompt chain. This is the list of Jinja
 * variables that are matched in the chain prompts. Those which name is a prompt's
 * result key are excluded by default.
 * NOTE: prompt order is not taken into account yet
 * @param promptChain Any prompt chain
 * @param includeResultKeys Also include parameter names which name is a result key in the chain
 * @returns The list of parameters that should be used to solve the template
 */
export function parameterNameList(promptChain: PromptChain, includeResultKeys = false) : Array<string> {
  let result: string[] = [];
  const resultKeys: Set<string> = new Set(promptChain.steps.map(step => {return step.resultKey}));
  promptChain.steps.forEach(step => {
    stepParameterNameList(step).forEach(paramName => {
      if (includeResultKeys || ! resultKeys.has(paramName)) result.push(paramName);
    })
  });
  if (includeResultKeys) result = [...result, ...resultKeys];
  return [...new Set(result)];
}

export function parameterDict(promptChain: PromptChain) : Record<string, string> {
  let result: Record<string, string> = {};

  promptChain.steps.forEach(step => {
    const paramList = stepParameterNameList(step);
    paramList.forEach((paramName) => {
      result[paramName] = promptChain.parametersDict[paramName] ?? '';
    });
  });

  return result;
}

export function piledParameterDict(promptChain: PromptChain) : Record<string, string> {
  let result: Record<string, string> = promptChain.parametersDict;

  promptChain.steps.forEach(step => {
    const paramList = stepParameterNameList(step);
    paramList.forEach((paramName) => {
      result[paramName] = promptChain.parametersDict[paramName] ?? '';
    });
  });
  
  return result;
}

export function areChainsEquivalent(aChain: PromptChain, anotherChain: PromptChain): boolean {
  // console.log(aChain, anotherChain);
  if (aChain.title != anotherChain.title) return false;
  if (aChain.steps.length != anotherChain.steps.length) return false;
  if (! isEqual(parameterDict(aChain), parameterDict(anotherChain))) return false;

  for (let i = 0; i < aChain.steps.length; i++) {
    const aStep: Step = aChain.steps[i];
    const anotherStep: Step = anotherChain.steps[i];
    if (aStep.stepType != anotherStep.stepType) return false;
    if (aStep.title != anotherStep.title) return false;
    if (aStep.resultKey != anotherStep.resultKey) return false;
    if (aStep.minimized != anotherStep.minimized) return false;
    if (! isEqual(aStep.results, anotherStep.results)) return false;

    if (aStep.stepType == StepType.prompt) {
      if (! arePromptsEquivalent(aStep as PromptStep, anotherStep as PromptStep)) return false;
    } else if (aStep.stepType == StepType.rest) {
      if (! areRestStepsEquivalent(aStep as RestStep, anotherStep as RestStep)) return false;
    } else {
      throw Error("Unsupported step type");
    }
  }
  

  return true;
}

function arePromptsEquivalent(aPrompt: PromptStep, anotherPrompt: PromptStep) : boolean {
  if (aPrompt.promptText != anotherPrompt.promptText) return false;
  if (aPrompt.predictionService != anotherPrompt.predictionService) return false;
  if (! isEqual(aPrompt.predictionSettings, anotherPrompt.predictionSettings)) return false;
  return true;
}

function areRestStepsEquivalent(aRestStep: RestStep, anotherRestStep: RestStep) : boolean {
  if (aRestStep.method != anotherRestStep.method) return false;
  if (aRestStep.url != anotherRestStep.url) return false;
  if (! isEqual(aRestStep.header, anotherRestStep.header)) return false;
  if (aRestStep.body != anotherRestStep.body) return false;
  return true;
}