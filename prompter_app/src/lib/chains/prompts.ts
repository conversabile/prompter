import { StepType, type PromptStep, type StepResult, type PromptChain } from "./chains";
import { PredictionService, defaultPredictionSettings } from "../services";
import { renderTemplate, type RenderedTemplate } from "$lib/jinja";
import type { StepRunStatus } from "$lib/prediction/chain";

export interface RenderedPrompt {
  prompt: RenderedTemplate
}

export function getDefaultPrompt(resultKey: string): PromptStep {
  return {
      stepType: StepType.prompt,
      promptText: "{# This is an example prompt: replace it with your own! #}\n\nTell me a short (less than {{ maxWords }} words) story about {{ storyTopic }}.\n\n{% if anotherTopic %}\nAnd another one about {{ anotherTopic | upper }}!!!\n{% endif %}",
      title:  "Untitled Prompt",
      resultKey: resultKey,
      results: null,
      minimized: false,
      predictionService: PredictionService.openai,
      predictionSettings: defaultPredictionSettings()
  }
}

export function getExamplePrompt(resultKey: string, promptChain: PromptChain, position: number): PromptStep {
  let result = getDefaultPrompt(resultKey);

  // Customise example based on the new prompt position
  if (position == 0) result.promptText = "{# This is an example additional step: try using its result key as a variable in the next ones! #}\n\nProduce a JSON object describing the properties of a character in a story about {{ storyTopic }}"
  else {
      let previousResultKey = promptChain.steps[position-1].resultKey
      let previousContent = "text that was generated by an AI model";
      if (promptChain.steps[position-1].stepType == StepType.rest) {
        previousContent = "data that was retrieved from a REST endpoint";
      }
      result.promptText = "{# This is an example additional step: you can use previous result keys here! #}\n\nProduce a short poem about the following "+previousContent+":\n\n{{"+previousResultKey+"}}";
  }

  return result;
}

export function renderPromptStep (
  promptStep: PromptStep,
  paramDict: Record<string, string>,
  previousResults: Record<string, StepResult | null>,
  predictionStatus: Record<string, StepRunStatus>
) : RenderedPrompt {
  return {
    prompt: renderTemplate(promptStep.promptText, paramDict, previousResults, predictionStatus)
  }
}