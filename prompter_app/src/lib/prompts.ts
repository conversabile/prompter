import type { ComponentEvents, ComponentType, SvelteComponent } from "svelte";
import PromptBoxRenderedPromptSpinner from "../components/chainEditor/PromptBoxRenderedPromptSpinner.svelte";
import type { PromptStep, StepResult } from "./chains";
import { RunStatus, type StepRunStatus } from "./prediction/chain";
import { escapeHtml } from "./util";
import nunjucks from 'nunjucks';
nunjucks.configure({autoescape: false, trimBlocks: true});
nunjucks.installJinjaCompat();

export function renderTemplate(template: string, paramDict: Record<string, string>): string {
    let result = template;
    result = nunjucks.renderString(template, paramDict);
    return result.trim();
  }

// ["string", null]
// [AnySvelteComponent, {its: "props"}]
export type ComponentAndProps = [ComponentType | string, Record<string, any> | null];

export interface RenderedPromptResult {
    text: string,
    html: string,
    components: ComponentAndProps[]
}

export function renderPrompt(
    prompt: PromptStep,
    paramDict: Record<string, string>,
    previousResults: Record<string, StepResult | null>,
    predictionStatus: Record<string, StepRunStatus>
) : RenderedPromptResult {
    // console.log("render: ", prompt.promptText);
    let resultComponents: ComponentAndProps[] = [];
    let resultHtml: string;
    let resultText: string;

    // https://regex101.com/r/WhYBv9/2
    const jinjaRegex = /(\{\{\s*(\w+)\s*(?:\|\s*(?:[\w]+\(".*?"\)|[\w]+\('.*?'\)|.*?)\s?\}\}|\}\}))/gi;
    const spinnerTag = "<i class=\"prompter spinner\"></i>"; // Will be replaced with spinner component

    resultHtml = prompt.promptText.replace(jinjaRegex, (match, _, matchedParamName) => {
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
        resultValue = (previousResults[matchedParamName]) ? match : '-';
        }
        return '<span class="previousResult">' +
                '<span class="resultKey">🔑 '+matchedParamName+'</span>' +
                resultValue +
                '</span>' + resultSpinner;
    }
    return '<span class="param">' + match + '</span>'
    });

    // TODO: move sanitization at dict level
    let renderedParamDict: Record<string, string> = {};
    for (const paramName in paramDict) {
    renderedParamDict[paramName] = escapeHtml(paramDict[paramName] ?? '');
    }
    for (const resultKey in previousResults) {
    if (previousResults[resultKey] != null) {
        renderedParamDict[resultKey] = (previousResults[resultKey] as StepResult).resultRaw;
    }
    }
    resultText = renderTemplate(prompt.promptText, renderedParamDict);
    resultHtml = renderTemplate(resultHtml, renderedParamDict);

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
        components: resultComponents
    };
}