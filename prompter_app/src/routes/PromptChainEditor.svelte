<script lang="ts">
	import { env } from '$env/dynamic/public';
  import { page } from '$app/stores';
  import { promptSchemaVersion, type PromptChain, type PromptPrediction } from '$lib/prompts';
  import PromptBox from './PromptBox.svelte';

  export let chainId: string | null = null;
  export let editKey: string | null = null;
  export let chainTitle: string = "Untitled Prompt";
  export let promptChain: PromptChain = {
    version: promptSchemaVersion,
    title: chainTitle,
    prompts: [{
      version: promptSchemaVersion,
      prompt_text: "Tell me a short (less than {{ maxWords }} words) story about {{ storyTopic }}.\n\n{% if anotherTopic %}\nAnd another one about {{ anotherTopic | upper }}!!!\n{% endif %}",
      parameters_dict: {storyTopic: "time travelling", maxWords: "50"},
      title:  chainTitle,
      predictions: null
    }]
  }
  export let isShared: boolean = false;   // Show box with permalink
  let isSharedEditable: boolean = false;  // Permalink is editable


  // Share
  let sharedUrlReadOnly: string = '';
  let sharedUrlEditable: string = '';
  let isSharing: boolean = false;
  let error: string = "";

  if (chainId) sharedUrlReadOnly = $page.url.protocol + '//' + $page.url.host + '/p/' + chainId;
  if (editKey) sharedUrlEditable = sharedUrlReadOnly + '?editKey=' + editKey;
  let sharedUrlUser = sharedUrlReadOnly;
  $: sharedUrlUser = isSharedEditable ? sharedUrlEditable : sharedUrlReadOnly;

  async function handleShare() {
    isSharing = true;
    error = "";
    const res = await fetch(`/api/chain`, {
			method: 'POST',
			body: JSON.stringify(promptChain)
		});

		const responseJson = await res.json()
    console.log("Saved prompt chain with id: " + responseJson.chainId);
    chainId = responseJson.chainId;
    editKey = responseJson.editKey;
    let newSharedUrlReadOnly = $page.url.protocol + '//' + $page.url.host + '/p/' + responseJson.chainId;
    let newSharedUrlEditable = newSharedUrlReadOnly + '?editKey=' + responseJson.editKey;

    // isSharing = false;
    // isShared = true;

    window.location.href = newSharedUrlEditable + '&isShared=true';
    // goto(newSharedUrlEditable + '&isShared=true');
    // ^ this messes up the state (+page.server.ts is skipped)
  }

  async function handleUpdate() {
    isSharing = true;
    error = "";
    const res = await fetch(`/api/chain/${chainId}?editKey=${editKey}`, {
			method: 'POST',
			body: JSON.stringify(promptChain)
		})
    .then(async function(response) {
      if (!response.ok){
        console.error("Failed updating prompt chain: ", response);
        let responseText = await response.text();
        error = response.status + " " + response.statusText + ": " + responseText;
      } else {
        console.log(`Updated prompt chain with id: ${chainId}`);
        // let responseJson = await response.json();
        isShared = true;
      }
      isSharing = false;
    });
  }

  function dismissError() {
    error = "";
  }

  // Predict
  /* 
  * TODO:
  *  - DONE persist predictions in saved prompts
  *  - persist api key in local storage
  *  - syntax highlighting
  *  - DONE prediction box is hidden initially
  *  - DONE handle openapi errors
  *  - DONE sanitize uuid params in /p/<UUID>
  */
  import Fa from 'svelte-fa'
  import { faPlay, faSave, faClone, faShare } from '@fortawesome/free-solid-svg-icons'
  import { Clock } from 'svelte-loading-spinners';

  import { OpenAI } from "openai";

  let userRequestedPrediction: boolean = false;
  let renderedPromptText: string;
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

<PromptBox
    bind:prompt = {promptChain.prompts[0]}
    bind:paramDict = {promptChain.prompts[0].parameters_dict}
    bind:renderedPromptText = {renderedPromptText}
/>

{#if userRequestedPrediction || promptChain.prompts[0].predictions}
  <div class="predictionResultBox">

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
        {#if isPredicting && ! promptChain.prompts[0].predictions}
          <div class="predictionPlaceholderMessage">
            <div style="display:inline-block;"><Clock size="30" color="#DDD" unit="px" duration="10s" /></div>
          </div>
        {:else if predictionError}
          <div class="predictionResult predictionError">{predictionError}</div>
        {:else if ! openaiApiKey}
          <div class="predictionWarningMessage">
            <p>An OpenAI key must be provided for predictions</p>
            <p><small style="font-style: oblique;">Prediction requests are sent directly from your browser. Your key won't be sent to {env.PUBLIC_SITE_NAME} server</small></p>
          </div>
        {:else}
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
  </div>
{/if}

<div>
  {#if isSharing}
    <p class="isSharing">saving...</p>
  {:else}

    <!-- Homepage: unsaved prompt with no id -->
    {#if (! chainId)}
      <button id="shareButton" class="button" title="Generate a permalink for this prompt" on:click={handleShare}><Fa icon={faShare} /> Share</button>
    {/if}

    <!-- Saved prompt with edit key -->
    {#if editKey}
      <button id="updateButton" class="button" title="Save all the edits you made to this prompt" on:click={handleUpdate}><Fa icon={faSave} /> Update</button>
    {/if}

    <!-- Saved prompt, either with or without edit key -->
    {#if chainId}
      <button id="shareCopyButton" class="button" title="Save all the edits you made to this prompt as a new permalink" on:click={handleShare}><Fa icon={faClone} /> Clone</button>
    {/if}

    <button id="predictButton" class="button" title="Predict prompt on OpenAI" on:click={handlePredict}>
      <Fa icon={faPlay} /> Predict
    </button>
  {/if}
</div>

{#if error}
  <div class="error"> <span class="closeIcon" on:click={dismissError} on:keypress={dismissError}>✖</span> [<strong style="color: #c60000;">ERROR</strong>] {error}</div>
{/if}

{#if isShared}
  <div id="sharedUrl">
    <a href="{sharedUrlUser}">{sharedUrlUser}</a>
    {#if editKey}
      <span class="shareEditableContainer">
        <input type="checkbox" name="shareEditable" id="shareEditable" bind:checked={isSharedEditable}><label for="shareEditable" title="People you share your link with will be able to make changes to your prompt">Editable Link</label>
      </span>
    {/if}
  </div>
  <div id="sharedDisclaimer"><p>Please note that Prompter is in early development stage, your work may change format or become unreachable at any time. Use it at your own risk!</p></div>
{/if}

<style>
.button {
    display:inline-block;
    /* color:var(--color-theme-blue); */
    border:1px solid var(--color-theme-orange);
    border-radius: 2px;
    background:var(--color-theme-orange);
    cursor:pointer;
    vertical-align:middle;
    /* max-width: 100px; */
    padding: 1em;
    margin: 1em;
    text-align: center;
}

.button:hover {
    border:1px solid var(--color-bg-alphawhite);
    /* background-color:white;
    color: var(--color-theme-orange); */
    color: white;
}

.shareEditableContainer {
  display: block;
  margin-top: 0.5em;
}

.shareEditableContainer label {
  line-height: 1em;
  display: inline-block;
  vertical-align: middle;
}

.isSharing {
  display: inline-block;
  border: 1px transparent var(--color-theme-orange);
  border-radius: 2px;
  vertical-align: middle;
  max-width: 100px;
  padding: 1em;
  margin: 1em;
  text-align: center;
  color: var(--color-bg-alphawhite);
  font-style: oblique;
}

#sharedUrl {
  background: white;
  margin: 1em 1em 0.5em 1em;
  padding: 1em;
  text-align: center;
}

#sharedUrl a {
  color: var(--color-theme-blue);
}

#sharedDisclaimer p {
  font-style: italic;
  font-size: 0.9em;
  color: var(--color-bg-alphawhite);
  margin-top: 0;
}

.error {
  color: black;
  border: 1x solid #c60000;
  background: rgba(255, 255, 255, 0.75);
  padding: 0.5em;
  font-family: monospace;
  width: 100%;
  text-align: center;
}

.closeIcon {
  background: #c60000;
  color: white;
  padding: 0.1em 0.4em;
  border-radius: 1em;
  margin-left: 0.5em;
  font-size: 1em;
  cursor: pointer;
}

#predictButton {
  color: #DDD;
  background: var(--color-theme-darkgray);
  border: 1px solid var(--color-theme-darkgray);
}

#predictButton:hover {
  border: 1px solid white;
  color: white;
}

.predictionResultBox {
  background: var(--color-theme-darkgray);
  padding: 1em 1em 0 1em;
  width: 100%;
  color: #DDD;
}

.openaiParamsContainer {
  display: flex;
  align-items: center;
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
  margin: 1em 0;
}

.predictionWarningMessage p {
  margin: 0;
}

.predictionPlaceholderMessage {
  padding: 1em;
  text-align: center;
  font-style: oblique;
  margin: 1em 0;
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
  margin-bottom: 1em;
}

.predictionError {
  color: #f55;
  text-align: center;
}

</style>