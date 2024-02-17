import { StepType, type RestStep, RestStepMethods, type PromptChain } from "./chains";

export const METHODS_WITHOUT_BODY = new Set([RestStepMethods.HEAD, RestStepMethods.GET]);

export function getDefaultRestStep(resultKey: string) : RestStep {
    return {
      stepType: StepType.rest,
      title:  "Untitled Step",
      resultKey: resultKey,
      results: null,
      minimized: false,

      method: RestStepMethods.GET,
      url: "https://date.nager.at/api/v3/publicholidays/{{ year }}/{{ countryCode | upper }}",
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

export async function runRestStep(restStep: RestStep) {
    let req: Record<string, any> = {
        method: restStep.method,
        headers: headersDict(restStep)
    }
    if (restStep.body) req["body"] = restStep.body;
    const res = await fetch(restStep.url, req);
    const responseText = await res.text();
    restStep.results = [{
        datetime: new Date(),
        resultRaw: responseText,
    }];
    console.log(restStep);
}
