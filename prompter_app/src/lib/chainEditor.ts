import { StepType, type PromptChain, type PromptStep, parameterNameList } from "./prompts";
import { PredictionService, defaultPredictionSettings } from "./services";

export function getDefaultChain(): PromptChain {
    return {
        version: 5,
        title: "Untitled Chain",
        parametersDict: {storyTopic: "time travelling", maxWords: "50"},
        steps: [
            getDefaultStep()
        ]
    }
}

function getDefaultStep(): PromptStep {
    return {
        stepType: StepType.prompt,
        promptText: "Tell me a short (less than {{ maxWords }} words) story about {{ storyTopic }}.\n\n{% if anotherTopic %}\nAnd another one about {{ anotherTopic | upper }}!!!\n{% endif %}",
        title:  "Untitled Prompt",
        resultKey: "result_0",
        results: null,
        minimized: false,
        predictionService: PredictionService.openai,
        predictionSettings: defaultPredictionSettings()
    }
}

export function addChainStep(promptChain: PromptChain, position: number) : void {
    let newStep = getDefaultStep();
    let i = 0;
    let resultKey = null;
    const existingParamNames = new Set(parameterNameList(promptChain, true));
    while (! resultKey) {
        let candidateKey = "result_" + i;
        if (! existingParamNames.has(candidateKey)) resultKey = candidateKey;
        i++;
    }
    newStep.resultKey = resultKey;
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
