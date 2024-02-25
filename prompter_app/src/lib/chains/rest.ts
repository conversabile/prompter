import type { RenderedTemplate } from "$lib/jinja";
import { StepType, type RestStep, RestStepMethods, type PromptChain, type StepResult } from "./chains";

export const METHODS_WITHOUT_BODY = new Set([RestStepMethods.HEAD, RestStepMethods.GET]);

export interface RenderedRestStep {
    url: RenderedTemplate,
    body: RenderedTemplate
}

export function getDefaultRestStep(resultKey: string) : RestStep {
    return {
      stepType: StepType.rest,
      title:  "Untitled Step",
      resultKey: resultKey,
      results: null,
      minimized: false,

      method: RestStepMethods.GET,
      url: "https://openlibrary.org/search.json?q={{ storyTopic | urlencode }}&fields=title,person,place,author_name&limit=1",
      header: [],
      body: null
    }
}

export function getExampleRestStep(resultKey: string, promptChain: PromptChain, position: number) : RestStep {
    return getDefaultRestStep(resultKey);
}

function headersDict(restStep: RestStep) : Record<string, string> {
    let result: Record<string, string> = {};
    restStep.header.forEach((h) => {result[h.key] = h.value;});
    return result;
}

export function removeHeader(restStep: RestStep, key: string) {
    restStep.header = restStep.header.filter((h) => {return h.key != key});
}

export async function runRestStep(restStep: RestStep, renderedRestStep: RenderedRestStep) {
    let req: Record<string, any> = {
        method: restStep.method,
        headers: headersDict(restStep)
    }
    if (! METHODS_WITHOUT_BODY.has(restStep.method) && renderedRestStep.body.text) req["body"] = renderedRestStep.body.text;
    let res;
    try {
        res = await fetch(renderedRestStep.url.text, req);
    } catch (err: any) {
        throw new RestStepFetchError(err);
    }
    const responseText = await res.text();
    let responseJson = null;
    try {
        responseJson = JSON.parse(responseText);
    } catch {};
    restStep.results = [{
        datetime: new Date(),
        resultRaw: responseText,
        resultJson: responseJson,
        status: res.status,
    }];
}

export class RestStepFetchError extends Error {};

// export function renderRestStep (
//     restStep: RestStep,
//     paramDict: Record<string, string>,
//     previousResults: Record<string, StepResult | null>,
//     predictionStatus: Record<string, StepRunStatus>
//   ) : RenderedRestStep {
//     return {
//       url: renderTemplate(restStep.url, paramDict, previousResults, predictionStatus),
//       body: renderTemplate(restStep.body ?? "", paramDict, previousResults, predictionStatus)
//     }
//   }
