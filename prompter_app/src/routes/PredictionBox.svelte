<script lang="ts">
import { parameterNameList, StepType, type PromptChain, type PromptStep, type StepResult, type Step, type PromptStepResult } from "$lib/prompts";
import { faGear, faPlay } from "@fortawesome/free-solid-svg-icons";
// import { faOpenai } from "@fortawesome/free-brands-svg-icons";

// Display parameters and Prediction UI, will be used in PromptChainEditor
export let promptChain: PromptChain;
export let renderedPrompts: Record<string, string>; // -> PromptChainEditor
export let serviceSettingsPanelOpen: boolean;

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

let chainParameters: string[];
$: chainParameters = parameterNameList(promptChain);

let userRequestedPrediction: boolean = false;
let isPredicting: boolean = false;
let predictionError: string = "";

async function handlePredict() {
  for (let step of promptChain.steps) {
    if (step.stepType == StepType.prompt) {
      console.log("Predicting ", step.resultKey);
      await predictPrompt(step);
      console.log(promptChain);
    } else {
      throw Error("Not implemented");
    }
  }
}

async function predictPrompt(prompt: PromptStep) {
  if (isPredicting) return;
  userRequestedPrediction = true;

  if (prompt.predictionService == PredictionService.openai && ! $userSettings.predictionService.openai.apiKey) {
    isPredicting = false;
    predictionError = "An OpenAI API key is needed to run the prediction request";
    return;
  }

  if (prompt.predictionService == PredictionService.ollama && ! $userSettings.predictionService.ollama.server) {
    isPredicting = false;
    predictionError = "An Ollama server needs to be configured to run the prediction request";
    return;
  }

  if (! renderedPrompts[prompt.resultKey]) {
    isPredicting = false;
    predictionError = "No prompt to predict";
    return;
  }

  isPredicting = true;
  prompt.results = null;
  predictionError = "";
  promptChain = promptChain; /* Triggers re-render (TODO: refactor) */


  if (prompt.predictionService == PredictionService.openai) {
    await predictPromptOpenai(prompt);
  }

  if (prompt.predictionService == PredictionService.ollama) {
    await predictPromptOllama(prompt);
  }

  isPredicting = false;

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
      predictionError = err;
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
      predictionError = "Ollama prediction request failed with status code " + err.response.status + " (" + err.response.statusText + ")";
    } else {
      predictionError = err;
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

{#if predictionError}
  <div class="predictionResult predictionError">
    <span class="message">{predictionError}</span>
    <button
      class="button configureButton"
      title="Open service configuration"
      on:click={() => {serviceSettingsPanelOpen = true}}
    ><Fa icon={faGear} /></button>
  </div>
  {:else if promptChain.steps[0].results}
  <div class="predictionResult">
  {#each promptChain.steps as step}
    {#if step.results}
      <p>{step.results[0].resultRaw}</p>
    {/if}
  {/each}
  </div>
  
  {#if ! promptChain.steps.every(step => {let result = (!step.results || step.results[0].renderedPrompt == renderedPrompts[step.resultKey]); return result;})}
    <div class="predictionWarningMessage">This prediction was made using a different version of the prompt</div>
  {/if}
{/if}

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

.configureButton {
  color: white;
  background: var(--color-B-lightbg);
  border: 1px solid;
  margin: 0;
}

.configureButton:hover {
  background: rgb(255,255,255,0.1)
}

.runButton {
  border: 1px solid var(--color-A-bg);
  background-color: var(--color-A-bg);
  color: black;
  margin: 1em 0 0 0;
}

.predictionWarningMessage {
  text-align: center;
  font-size: .8em;
  margin: .5em;
}

.predictionResult {
  white-space: pre-wrap;
  text-align: justify;
  font-weight: lighter;
  /* letter-spacing: 0.05em; */
  /* font-size: 1.1em; */
  /* border: 1px solid #888; */
  padding: 1em;
  background: var(--color-B-lightbg);
  margin: 0;
  border-top: 1px solid var(--color-bg-alphawhite25);
}

.predictionError {
  color: #f55;
  text-align: center;
  display: flex;
}

.predictionError .message {
  width: 100%;
  display: inline-block;
  margin: auto;
}

</style>