import type { ComponentType } from "svelte";
import { RunStatus, type StepRunStatus } from "./prediction/chain";
import { escapeHtml } from "./util";

import nunjucks from 'nunjucks';
import type { PromptStep, RestStepResult, StepResult } from "./chains/chains";
import PromptBoxRenderedPromptSpinner from "../components/chainEditor/PromptBoxRenderedPromptSpinner.svelte";
nunjucks.configure({autoescape: false, trimBlocks: true});
nunjucks.installJinjaCompat();

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
        if (previousResults[matchedParamName] !== undefined) {
            let resultValue;
            let resultSpinner = "";
            if (
                predictionStatus[matchedParamName]?.status == RunStatus.onHold ||
                (predictionStatus[matchedParamName]?.status == RunStatus.inProgress && ! previousResults[matchedParamName])
            ) {
                resultValue = "";
                resultSpinner = spinnerTag;
            } else {
                resultValue = (previousResults[matchedParamName]) ? match : ' - ';
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
                let resultValue: string | object;
                if ("resultResponse" in previousResult) {
                    resultValue = (previousResult as RestStepResult).resultResponse
                } else {
                    resultValue = (previousResult as StepResult).resultRaw;
                }
                renderedParamDict[resultKey] = resultValue;
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
