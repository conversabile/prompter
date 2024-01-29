<script lang="ts">
import { parameterNameList, StepType, type PromptChain, type PromptStep, type StepResult, type Step, type PromptStepResult } from "$lib/prompts";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
// import { faOpenai } from "@fortawesome/free-brands-svg-icons";

// Display parameters and Prediction UI, will be used in PromptChainEditor
export let promptChain: PromptChain;
export let renderedPrompts: Record<string, string>; // -> PromptChainEditor
export let predictionStatus: Record<string, StepRunStatus>;

/* 
* TODO:
*  - DONE persist predictions in saved prompts
*  - DONE persist api key in local storage
*  - syntax highlighting
*  - DONE prediction box is hidden initially
*  - DONE handle openapi errors
*  - DONE sanitize uuid params in /p/<UUID>
*/
import { OpenAI } from "openai";

import Fa from "svelte-fa";
import { Clock } from "svelte-loading-spinners";
import { PredictionService } from "$lib/services";
import { userSettings } from "$lib/userSettings";
import { RunStatus, errorStatus, type StepRunStatus } from "$lib/prediction";

let chainParameters: string[];
$: chainParameters = parameterNameList(promptChain);

let isPredicting: boolean = false;

async function handlePredict() {
  if (isPredicting) return;
  isPredicting = true;

  for (let step of promptChain.steps) {
    step.results = null;
    predictionStatus[step.resultKey] = {
      status: RunStatus.onHold,
      error: null
    }
  }

  let stepRunError = null;
  for (let step of promptChain.steps) {
    if (stepRunError) {
      predictionStatus[step.resultKey] = {status: RunStatus.skipped, error: null};
    } else if (step.stepType == StepType.prompt) {
      console.log("Predicting ", step.resultKey);
      predictionStatus[step.resultKey] = {status: RunStatus.inProgress, error: null};
      stepRunError = await predictPrompt(step);
      if (stepRunError) {
        predictionStatus[step.resultKey] = errorStatus(stepRunError);
      } else {
        predictionStatus[step.resultKey] = {status: RunStatus.success, error: null};
      }
    } else {
      throw Error("Not implemented");
    }
  }

  isPredicting = false;
}

async function predictPrompt(prompt: PromptStep) {
  if (prompt.predictionService == PredictionService.openai && ! $userSettings.predictionService.openai.apiKey) {
    return "An OpenAI API key is needed to run the prediction request";
  }

  if (prompt.predictionService == PredictionService.ollama && ! $userSettings.predictionService.ollama.server) {
    return "An Ollama server needs to be configured to run the prediction request";
  }

  if (! renderedPrompts[prompt.resultKey]) {
    return "No prompt to predict";
  }

  prompt.results = null;
  promptChain = promptChain; /* Triggers re-render (TODO: refactor) */


  if (prompt.predictionService == PredictionService.openai) {
    return await predictPromptOpenai(prompt);
  }

  if (prompt.predictionService == PredictionService.ollama) {
    return await predictPromptOllama(prompt);
  }
}

async function predictPromptOpenai(prompt: PromptStep) {
  // console.debug("predicting prompt with OpenAI: ", renderedPrompts[prompt.resultKey]);
  try {
    const openai = new OpenAI({
      apiKey: $userSettings.predictionService.openai.apiKey,
      dangerouslyAllowBrowser: true, // We don't store the user's API key
    });
    const response = await openai.chat.completions.create({
      model: prompt.predictionSettings.openai.modelName,
      messages: [
        {"role": "user", "content": renderedPrompts[prompt.resultKey]}
      ],
      stream: true,
    });
    
    // Init prediction object
    if (! prompt.results) {
      prompt.results = [{
        "datetime": new Date(),
        "renderedPrompt":  renderedPrompts[prompt.resultKey],
        "resultRaw": "",
        "model": "openai-gpt-3.5-turbo"
      }]
    }

    // Append chunks to prediction objects
    for await (const chunk of response) {
      let chunkStr = chunk.choices[0].delta.content ?? "";
      prompt.results[0].resultRaw = prompt.results[0].resultRaw.concat(chunkStr);
      promptChain = promptChain; /* Triggers re-render (TODO: refactor) */
    }

  } catch (err: any) {
      return err;
  }
}

async function predictPromptOllama(prompt: PromptStep) {
  try {
    $userSettings.predictionService.ollama.server = $userSettings.predictionService.ollama.server.replace(/\/+$/, '');
    const response = await fetch(`${$userSettings.predictionService.ollama.server.replace(/\/+$/, '')}/api/generate`, {
			method: 'POST',
			body: JSON.stringify({
        "model": prompt.predictionSettings.ollama.modelName,
        "prompt": renderedPrompts[prompt.resultKey]
      })
		})

    if (response.body) {
      // Init prediction object
      if (! prompt.results) {
        prompt.results = [{
          "datetime": new Date(),
          "renderedPrompt":  renderedPrompts[prompt.resultKey],
          "resultRaw": "",
          "model": "ollama-" + prompt.predictionSettings.ollama.modelName
        }]
      }
      if (response.status != 200) {
        throw new Error("Ollama prediction request failed with status code " + response.status + " (" + await response.text() + ")");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done, value;
      while (!done) {
        ({ value, done } = await reader.read());
        const chunk = decoder.decode(value);
        if (chunk) {
          const token = JSON.parse(chunk)["response"] ?? "";
          if (token.trim() || prompt.results[0].resultRaw) { // First token is \n...
            prompt.results[0].resultRaw = prompt.results[0].resultRaw.concat(token);
            promptChain = promptChain; /* Triggers re-render (TODO: refactor) */
          }
        }
      }
    }

  } catch (err: any) {
    console.log("ollama error: ", err);
    if (err.response) {
      return "Ollama prediction request failed with status code " + err.response.status + " (" + err.response.statusText + ")";
    } else {
      return err;
    }
  }
}
</script>

<div class="grid">

    <!-- Parameter value table -->
    {#if chainParameters.length > 0}
      <div class="paramTableCell">
          <table class="paramTable">
            <tr>
                <th class="min">Param Name</th> <th>Param Value</th>
            </tr>
            {#each chainParameters as paramName}
                    <tr>
                        <td class="min"><span class="paramName">{paramName}</span></td>
                        <td> <input type="text" bind:value={promptChain.parametersDict[paramName]}> </td>
                    </tr>
            {/each}
        </table>
      </div>
    {/if}

    <!-- Predict Button -->
    <div class="predictButtonCell">
        {#if ! isPredicting}
            <button
              class="button runButton"
              title="Run prediction"
              on:click={handlePredict}
            ><Fa icon={faPlay}/> Run</button>
        {:else}
            <div style="display:inline-block; margin: 1em 0 0 0;"><Clock size="30" color="var(--color-B-text-standard)" unit="px" duration="10s" /></div>
        {/if}
    </div>
</div>

<style>
.grid {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin: 1em 0;
}

.grid .paramTableCell {
  flex: 1 0 75%;
  padding: 0 1em;
}

.grid .predictButtonCell {
  flex: 1 0 15%;
  text-align: center;
  padding-right: 1em;
}

.paramTable {
  width: 100%;
  padding:1em;
  background: var(--color-B-lightbg);
}

.paramTable th {
  text-align:left;
  padding-bottom: 1em;
}

.paramTable input {
  width: calc(100% - 1em);
  padding:0.5em;
}

.paramTable .min {
  width: 15%;
  white-space: nowrap;
}

.paramName {
  font-family: monospace;
  font-weight: bold;
}

.runButton {
  border: 1px solid var(--color-A-bg);
  background-color: var(--color-A-bg);
  color: black;
  margin: 1em 0 0 0;
}

</style>