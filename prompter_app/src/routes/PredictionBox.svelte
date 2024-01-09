<script lang="ts">
import { parameterNameList, type PromptChain } from "$lib/prompts";
import { faGear, faPlay } from "@fortawesome/free-solid-svg-icons";
// import { faOpenai } from "@fortawesome/free-brands-svg-icons";

// Display parameters and Prediction UI, will be used in PromptChainEditor
export let promptChain: PromptChain;
export let renderedPromptText: string;
export let serviceSettingsPanelOpen: boolean;

/* 
* TODO:
*  - DONE persist predictions in saved prompts
*  - persist api key in local storage
*  - syntax highlighting
*  - DONE prediction box is hidden initially
*  - DONE handle openapi errors
*  - DONE sanitize uuid params in /p/<UUID>
*/
import { OpenAI } from "openai";

import Fa from "svelte-fa";
import { Clock } from "svelte-loading-spinners";
import { PredictionService, type ServiceSettings } from "$lib/services";
import { userSettings } from "$lib/userSettings";

let userRequestedPrediction: boolean = false;
let isPredicting: boolean = false;
let predictionError: string = "";

async function handlePredict() {
  if (isPredicting) return;
  userRequestedPrediction = true;

  if (promptChain.prompts[0].predictionService == PredictionService.openai && ! $userSettings.predictionService.openai.apiKey) {
    isPredicting = false;
    predictionError = "An OpenAI API key is needed to run the prediction request";
    return;
  }

  if (promptChain.prompts[0].predictionService == PredictionService.ollama && ! $userSettings.predictionService.ollama.server) {
    isPredicting = false;
    predictionError = "An Ollama server needs to be configured to run the prediction request";
    return;
  }

  if (! renderedPromptText) {
    isPredicting = false;
    predictionError = "No prompt to predict";
    return;
  }

  isPredicting = true;
  promptChain.prompts[0].predictions = null;
  predictionError = "";

  if (promptChain.prompts[0].predictionService == PredictionService.openai) {
    await handleOpenaiPredict();
  }

  if (promptChain.prompts[0].predictionService == PredictionService.ollama) {
    await handleOllamaPredict();
  }

  isPredicting = false;

}

async function handleOpenaiPredict() {
  // console.debug("predicting prompt with OpenAI: ", renderedPromptText);
  try {
    const openai = new OpenAI({
      apiKey: $userSettings.predictionService.openai.apiKey,
      dangerouslyAllowBrowser: true, // We don't store the user's API key
    });
    const response = await openai.chat.completions.create({
      model: promptChain.prompts[0].predictionSettings.openai.modelName,
      messages: [
        {"role": "user", "content": renderedPromptText}
      ],
      stream: true,
    });
    
    // Init prediction object
    if (! promptChain.prompts[0].predictions) {
      promptChain.prompts[0].predictions = [{
        "datetime": new Date(),
        "renderedPrompt":  renderedPromptText,
        "predictionRaw": "",
        "model": "openai-gpt-3.5-turbo"
      }]
    }

    // Append chunks to prediction objects
    for await (const chunk of response) {
      let chunkStr = chunk.choices[0].delta.content ?? "";
      promptChain.prompts[0].predictions[0].predictionRaw = promptChain.prompts[0].predictions[0].predictionRaw.concat(chunkStr);
    }

  } catch (err: any) {
      predictionError = err;
  }
}

async function handleOllamaPredict() {
  try {
    $userSettings.predictionService.ollama.server = $userSettings.predictionService.ollama.server.replace(/\/+$/, '');
    const response = await fetch(`${$userSettings.predictionService.ollama.server.replace(/\/+$/, '')}/api/generate`, {
			method: 'POST',
			body: JSON.stringify({
        "model": promptChain.prompts[0].predictionSettings.ollama.modelName,
        "prompt": renderedPromptText
      })
		})

    if (response.body) {
      // Init prediction object
      if (! promptChain.prompts[0].predictions) {
        promptChain.prompts[0].predictions = [{
          "datetime": new Date(),
          "renderedPrompt":  renderedPromptText,
          "predictionRaw": "",
          "model": "ollama-" + promptChain.prompts[0].predictionSettings.ollama.modelName
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
          if (token.trim() || promptChain.prompts[0].predictions[0].predictionRaw) { // First token is \n...
            promptChain.prompts[0].predictions[0].predictionRaw = promptChain.prompts[0].predictions[0].predictionRaw.concat(token);
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
    <div class="paramTableCell">
        <table class="paramTable">
            <tr>
                <th class="min">Param Name</th> <th>Param Value</th>
            </tr>
            {#each promptChain.prompts as prompt}
                {#each parameterNameList(prompt) as paramName}
                    <tr>
                        <td class="min"><span class="paramName">{paramName}</span></td>
                        <td> <input type="text" bind:value={prompt.parametersDict[paramName]}> </td>
                    </tr>
                {/each}
            {/each}
        </table>
    </div>

    <!-- Predict Button -->
    <div class="predictButtonCell">
        {#if ! isPredicting}
            <button
              class="button runButton"
              class:selected={promptChain.prompts[0].predictionService == PredictionService.openai}
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
{:else if promptChain && promptChain.prompts[0].predictions && promptChain.prompts[0].predictions[0].predictionRaw}
  <div class="predictionResult">{promptChain.prompts[0].predictions[0].predictionRaw}</div>
  
  <!-- TODO: renderedPromptText is empty when page is loading, this way earning is hidden for empty prompts -->
  {#if renderedPromptText && promptChain.prompts[0].predictions[0].renderedPrompt != renderedPromptText}
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
  margin: 1em 0 1em 1em;
}

.grid .paramTableCell {
  flex: 1 0 80%;
}

.grid .predictButtonCell {
  flex: 0 0 10em;
  text-align: center;
}

.paramTable {
  width:100%;
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