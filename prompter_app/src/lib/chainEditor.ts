import { StepType, type PromptChain, type PromptStep, parameterNameList, type Step } from "./chains/chains";
import { getDefaultPrompt, getExamplePrompt } from "./chains/prompts";
import { getExampleRestStep } from "./chains/rest";

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

export function addChainStep(promptChain: PromptChain, position: number, stepType: StepType) : void {
    let newStep: Step;
    let newStepResultKey = getNewResultKey(promptChain);
    if (stepType == StepType.prompt) {
        newStep = getExamplePrompt(newStepResultKey, promptChain, position);
    } else if (stepType == StepType.rest) {
        newStep = getExampleRestStep(newStepResultKey, promptChain, position);
    } else {
        throw Error("Unsupported step type: " + stepType);
    }
    promptChain.steps.splice(position, 0, newStep);
}

export function deleteChainStep(promptChain: PromptChain, position: number) : void {
    promptChain.steps.splice(position, 1);
}

export function moveChainStep(promptChain: PromptChain, sourcePosition: number, targetPosition: number) : void {
    let step = promptChain.steps[sourcePosition];
    promptChain.steps.splice(sourcePosition, 1);
    promptChain.steps.splice(targetPosition, 0, step);
}
