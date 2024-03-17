import { derived, writable, type Readable, get } from "svelte/store";
import { StepType, type PromptChain, parameterNameList, type Step } from "./chains/chains";
import { getDefaultPrompt, getExamplePrompt, type PromptStep, type PromptStepResult, type RenderedPrompt } from "./chains/prompts";
import { getExampleRestStep, type RenderedRestStep, type RestStep, type RestStepResult } from "./chains/rest";
import type { StepRunStatus } from "./prediction/chain";
import { renderTemplate, type RenderedTemplate } from "./jinja";
import { getDefaultDocumentIndexStep, type DocumentIndexStep, type RenderedDocumentIndex, getExportedDocIndexResults } from "./chains/documentIndex";

// Session

export interface ChainEditorSession {
    promptChain: PromptChain,
    predictionStatus: Record<string, StepRunStatus>
}

export const editorSession = writable<ChainEditorSession>({promptChain: getDefaultChain(), predictionStatus: {}});
export const renderedSteps: Readable<Record<string,RenderedPrompt | RenderedRestStep | RenderedDocumentIndex>> = derived(
    editorSession,
    ($editorSession) => {
        return Object.fromEntries($editorSession.promptChain.steps.map(step => {
            return [step.resultKey, renderStep(step)];
        }));
    }
)

export const exportedStepResults: Readable<Record<string, Record<string, any>>> = derived(
    editorSession,
    ($editorSession) => {
        let result: Record<string, Record<string, any>> = {};
        $editorSession.promptChain.steps.forEach(step => {
            let exportedResults: Record<string, any> = {};
            if (!step.results) return exportedResults;
            if (step.stepType == StepType.prompt) {
                exportedResults[step.resultKey] = (step.results[0] as PromptStepResult).resultRaw;
            } else if (step.stepType == StepType.rest) {
                exportedResults[step.resultKey] = (step.results[0] as RestStepResult).resultJson;
            } else if (step.stepType == StepType.documentIndex) {
                exportedResults = getExportedDocIndexResults((step as DocumentIndexStep))
            }
            result[step.resultKey] = exportedResults;
        })
        return result;
    }
)

// Render prompts

function allExportedResults() : Record<string, any> {
    let result: Record<string, any> = {};
    Object.values(get(exportedStepResults)).forEach(v => {
        for (const exportedKey in v) {
            result[exportedKey] = v[exportedKey];
        }
    })
    return result;
}

function renderSessionTemplate(text: string) {
    return renderTemplate(
        text,
        get(editorSession).promptChain.parametersDict,
        allExportedResults(),
        get(editorSession).predictionStatus
    )
}

function renderStep(step: Step) : RenderedPrompt | RenderedRestStep | RenderedDocumentIndex {
    if (step.stepType == StepType.prompt) {
        return {
            prompt: renderSessionTemplate((step as PromptStep).promptText)
        };
    } else if (step.stepType == StepType.rest) {
        return {
            url: renderSessionTemplate((step as RestStep).url),
            body: renderSessionTemplate((step as RestStep).body ?? ""),
        };
    } else if (step.stepType == StepType.documentIndex) {
        let renderedQueries: Record<string, RenderedTemplate> = {};
        (step as DocumentIndexStep).queries.forEach((q) => {
            renderedQueries[q.key] = renderSessionTemplate(q.text)
        });
        return {
            renderedQueries: renderedQueries
        };
    }

    throw Error("Unsupported prompt type");
}

// Util

export function getDefaultChain(): PromptChain {
    return {
        version: 5,
        title: "Untitled Chain",
        parametersDict: {storyTopic: "time travelling", maxWords: "50"},
        steps: [
            getDefaultPrompt("result_0"),
        ]
    }
}

export function getNewResultKey(promptChain: PromptChain) : string {
    let i = 0;
    let result = null;
    const existingParamNames = new Set(parameterNameList(promptChain, true));
    while (! result) {
        let candidateKey = "result_" + i;
        if (! existingParamNames.has(candidateKey)) result = candidateKey;
        i++;
    }
    return result;
}

export function addChainStep(position: number, stepType: StepType) : void {
    editorSession.update((updater) => {
        let newStep: Step;
        let newStepResultKey = getNewResultKey(updater.promptChain);
        if (stepType == StepType.prompt) {
            newStep = getExamplePrompt(newStepResultKey, updater.promptChain, position);
        } else if (stepType == StepType.rest) {
            newStep = getExampleRestStep(newStepResultKey, updater.promptChain, position);
        } else if (stepType == StepType.documentIndex) {
            newStep = getDefaultDocumentIndexStep(newStepResultKey);
        } else {
            throw Error("Unsupported step type: " + stepType);
        }
        updater.promptChain.steps.splice(position, 0, newStep);
        return updater;
    });
    
}

export function deleteChainStep(position: number) : void {
    editorSession.update((updater) => {
        updater.promptChain.steps.splice(position, 1);
        return updater;
    });
    
}

export function moveChainStep(sourcePosition: number, targetPosition: number) : void {
    editorSession.update((updater) => {
        let step = updater.promptChain.steps[sourcePosition];
        updater.promptChain.steps.splice(sourcePosition, 1);
        updater.promptChain.steps.splice(targetPosition, 0, step);
        return updater;
    });
    
}
