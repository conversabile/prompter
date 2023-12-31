<script lang="ts">
import { parameterNameList, type PromptChain } from "$lib/prompts";
import { faPlay } from "@fortawesome/free-solid-svg-icons";

// Display parameters and Prediction UI, will be used in PromptChainEditor
export let promptChain: PromptChain;
export let renderedPromptText: string;

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
import { env } from '$env/dynamic/public';

import Fa from "svelte-fa";
import { Clock } from "svelte-loading-spinners";

let userRequestedPrediction: boolean = false;
let openaiApiKey: string = "";
let openaiApiModel: string;
let isPredicting: boolean = false;
let predictionError: string = "";

async function handlePredict() {
  userRequestedPrediction = true;

  if (! openaiApiKey) {
    isPredicting = false;
    predictionError = "";
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

  console.debug("predicting prompt: ", renderedPromptText);

  try {
  
    const openai = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true, // We don't store the user's API key
    });
    const response = await openai.chat.completions.create({
      model: openaiApiModel,
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
    console.log("openai error: ", err);
    if (err.response) {
      predictionError = "OpenAI prediction request failed with status code " + err.response.status + " (" + err.response.statusText + ")";
    } else {
      predictionError = "OpenAI prediction request failed (" + err + ")";
    }
  }
  
  isPredicting = false;

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
                        <td> <input type="text" bind:value={prompt.parameters_dict[paramName]}> </td>
                    </tr>
                {/each}
            {/each}
        </table>
    </div>

    <!-- Predict Button -->
    <div class="predictButtonCell">
        {#if ! isPredicting}
            <button id="predictButton" class="button" title="Predict prompt on OpenAI" on:click={handlePredict}>
                <Fa icon={faPlay} /> Predict
            </button>
        {:else}
            <div style="display:inline-block;"><Clock size="30" color="#DDD" unit="px" duration="10s" /></div>
        {/if}
    </div>
</div>



{#if userRequestedPrediction || promptChain.prompts[0].predictions}

    {#if userRequestedPrediction}
      <div style="margin-bottom:1em;">
        <form class="openaiParamsContainer" on:submit|preventDefault={handlePredict}>
          <label for="openaiModel">OpenAI Model</label>
          <select name="openaiModel" id="openaiModel" bind:value={openaiApiModel}>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            <option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k</option>
            <option value="gpt-4">gpt-4</option>
          </select>
          <label for="openaiApiKey">OpenAI API Key</label> <input type="text" name="openaiApiKey" bind:value={openaiApiKey}>
        </form>
      </div> 
        {#if predictionError}
          <div class="predictionResult predictionError">{predictionError}</div>
        {:else if ! openaiApiKey}
          <div class="predictionWarningMessage">
            <p>An OpenAI key must be provided for predictions</p>
            <p><small style="font-style: oblique;">Prediction requests are sent directly from your browser. Your key won't be sent to {env.PUBLIC_SITE_NAME} server</small></p>
          </div>
        {:else if ! promptChain.prompts[0].predictions || userRequestedPrediction}
          <div class="predictionPlaceholderMessage">Click "Predict" or press Enter to send the prediction request</div>  
        {/if}
      {/if}

      {#if promptChain && promptChain.prompts[0].predictions}
        <div class="predictionResult">{promptChain.prompts[0].predictions[0].predictionRaw}</div>
        
        <!-- TODO: renderedPromptText is empty when page is loading, this way earning is hidden for empty prompts -->
        {#if renderedPromptText && promptChain.prompts[0].predictions[0].renderedPrompt != renderedPromptText}
          <div class="predictionWarningMessage">This prediction was made using a different version of the prompt</div>
        {/if}
      {/if}
  {/if}

<style>
.grid {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.grid .paramTableCell {
    flex: 0 0 80%;
}

.grid .predictButtonCell {
  flex: 0 0 20%;
  text-align: center;
}

.paramTable {
  width:100%;
  padding:1em;
  background: var(--color-theme-lightgray);
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

.openaiParamsContainer {
  display: flex;
  align-items: center;
  margin-top:1em;
}

.openaiParamsContainer label {
  margin-right: 1em;
}

.openaiParamsContainer input {
  width: auto;
  flex-grow: 1;
  vertical-align: middle;
  border: 1px solid;
  padding: 0.5em;
}

.openaiParamsContainer select {
  vertical-align: middle;
  border: 1px solid;
  padding: 0.5em;
  margin-right: 1em;
  font-size: 1em;
}

.predictionWarningMessage {
  text-align: center;
  color: var(--color-theme-orange);
  margin: 1em 0 0 0;
}

.predictionWarningMessage p {
  margin: 0;
}

.predictionPlaceholderMessage {
  padding: 1em;
  text-align: center;
  font-style: oblique;
  margin: 1em 0 0 0;
}

.predictionResult {
  white-space: pre-wrap;
  text-align: justify;
  font-weight: lighter;
  /* letter-spacing: 0.05em; */
  /* font-size: 1.1em; */
  /* border: 1px solid #888; */
  padding: 1em;
  background: var(--color-theme-lightgray);
  margin: 1em 0 0 0;
}

.predictionError {
  color: #f55;
  text-align: center;
}

</style>