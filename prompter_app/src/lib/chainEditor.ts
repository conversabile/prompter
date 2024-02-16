import { StepType, type PromptChain, type PromptStep, parameterNameList, type Step } from "./chains/chains";
import { getDefaultPrompt, getExamplePrompt } from "./chains/prompts";
import { getExampleRestStep } from "./chains/rest";

export function getDefaultChain(): PromptChain {
    return {
        version: 5,
        title: "Untitled Chain",
        parametersDict: {storyTopic: "time travelling", maxWords: "50"},
        steps: [
            getDefaultPrompt(),
        ]
    }
}

export function addChainStep(promptChain: PromptChain, position: number, stepType: StepType) : void {
    let newStep: Step;
    if (stepType == StepType.prompt) {
        newStep = getExamplePrompt(promptChain, position);
    } else if (stepType == StepType.rest) {
        newStep = getExampleRestStep(promptChain, position);
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
