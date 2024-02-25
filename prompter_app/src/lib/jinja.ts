import type { ComponentType } from "svelte";
import { RunStatus, type StepRunStatus } from "./prediction/chain";
import { escapeHtml } from "./util";

import nunjucks from 'nunjucks';
import type { PromptStep, RestStepResult, StepResult } from "./chains/chains";
import PromptBoxRenderedPromptSpinner from "../components/chainEditor/PromptBoxRenderedPromptSpinner.svelte";
nunjucks.configure({autoescape: false, trimBlocks: true});
nunjucks.installJinjaCompat();

class RenderableObject extends Object {
    constructor(originalObject: any) {
        super();
        Object.keys(originalObject).forEach((k) => {
            (this as Record<any, any>)[k] = originalObject[k]
        })
    }

    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Objects by default are stringified as [Object object] in js. This makes it
 * inconvenient to use them in Jinja templates, as one would have to use the 
 * {{ thing | dump }} syntax. Instead, we define a custom .toString() method 
 * for objects that produces a meaningful representation.
 * 
 * Strings, numbers, booleans and returned as they are. Lists are returned as 
 * standard lists, but their items are processed recursively. Objects are 
 * returned as RenderableObject instances and processed recursively.
 * 
 * @param thing Anything that could be part of a JSON-serializable object
 * @returns The thing itself, or a copy of it with a readable .toString() implmentation
 */
function makeRenderableThing(thing: any) : any {
    if (
        thing === undefined ||
        thing === null ||
        ["string", "number", "boolean", "bigint"].includes(typeof(thing))
    ) return thing;

    if (Array.isArray(thing)) {
        let result: any[] = [];
        thing.forEach((item) => {result.push(makeRenderableThing(item))});
        return result;
    };

    if (typeof(thing) === "object") {
        let resultObject: Record<any, any> = {}
        Object.keys(thing).forEach((k) => {
            resultObject[k] = makeRenderableThing(thing[k]);
        })
        return new RenderableObject(resultObject);
    }; 
}

function renderString(template: string, paramDict: Record<string, string | object>): string {
    let result = template;
    result = nunjucks.renderString(template, paramDict);
    return result.trim();
  }

// ["string", null]
// [AnySvelteComponent, {its: "props"}]
export type ComponentAndProps = [ComponentType | string, Record<string, any> | null];

export interface RenderedTemplate {
    text: string,
    html: string,
    components: ComponentAndProps[]
    error: boolean
}

export function renderTemplate(
    text: string,
    paramDict: Record<string, string>,
    previousResults: Record<string, StepResult | null>,
    predictionStatus: Record<string, StepRunStatus>
) : RenderedTemplate {
    // console.log("render: ", text);
    let resultComponents: ComponentAndProps[] = [];
    let resultHtml: string;
    let resultText: string;

    // https://regex101.com/r/WhYBv9/3
    const jinjaRegex = /(\{\{\s*([\w]+)[^|\}]*\s*(?:\|\s*(?:[\w]+\(".*?"\)|[\w]+\('.*?'\)|.*?)\s?\}\}|\}\}))/gi;
    const spinnerTag = "<i class=\"prompter spinner\"></i>"; // Will be replaced with spinner component

    try {
        resultHtml = text.replace(jinjaRegex, (match, _, matchedParamName) => {
       
        // resultKey__variant -> resultKey
        let candidateResultKey = matchedParamName.replace(/(.+)__.*/ig, "$1");

        if (previousResults[candidateResultKey] !== undefined) {
            let resultValue;
            let resultSpinner = "";
            if (
                predictionStatus[candidateResultKey]?.status == RunStatus.onHold ||
                (predictionStatus[candidateResultKey]?.status == RunStatus.inProgress && ! previousResults[candidateResultKey])
            ) {
                resultValue = "";
                resultSpinner = spinnerTag;
            } else {
                resultValue = (previousResults[candidateResultKey]) ? match : ' - ';
            }
            return '<span class="previousResult">' +
                    '<span class="resultKey">🔑 '+matchedParamName+'</span>' +
                    resultValue +
                    '</span>' + resultSpinner;
        }
        return '<span class="param">' + match + '</span>'
        });

        // TODO: move sanitization at dict level
        let renderedParamDict: Record<string, string | object> = {};
        for (const paramName in paramDict) {
        renderedParamDict[paramName] = escapeHtml(paramDict[paramName] ?? '');
        }
        for (const resultKey in previousResults) {
            let previousResult = previousResults[resultKey];
            if (previousResult != null) {
                if (previousResult.resultJson) {
                    renderedParamDict[resultKey] = makeRenderableThing(previousResult.resultJson);
                    renderedParamDict[resultKey + "__raw"] = previousResult.resultRaw;
                } else {
                    renderedParamDict[resultKey] = previousResult.resultRaw
                }

                if ("status" in previousResult) {
                    renderedParamDict[resultKey + "__status"] = (previousResult as RestStepResult).status.toString();
                }
            }
        }
        resultText = renderString(text, renderedParamDict);
        resultHtml = renderString(resultHtml, renderedParamDict);

        // Replace spinner tag with spinner component
        const spinnerSplit = resultHtml.split(spinnerTag);
        if (spinnerSplit.length > 1) {
        for (let i=0; i < spinnerSplit.length-1; i++) {
            resultComponents.push([spinnerSplit[i], null]);
            resultComponents.push([PromptBoxRenderedPromptSpinner, {}]);
        }
        }
        resultComponents.push([spinnerSplit[spinnerSplit.length-1], null]);

        return {
            text: resultText,
            html: resultHtml,
            components: resultComponents,
            error: false
        };
    } catch(err: any) {
        const errorString = 'invalid syntax: ' + err.message;
        return {
            text: errorString,
            html: errorString,
            components: [[errorString, null]],
            error: true
        }
    }
}
