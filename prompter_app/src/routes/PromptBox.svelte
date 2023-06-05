<script lang="ts">
  import type { Prompt } from '$lib/prompts';
  import { renderPrompt } from '$lib/prompts';
  import { escapeHtml } from '$lib/util';
  import { page } from '$app/stores';

  // Model
	export let promptText = "Tell me a story about {{ storyTopic }}, make it sound like you're very excited about {{ storyTopic | title }}!<br>{% if anotherTopic %}<br>And another one about {{ anotherTopic | upper }}!!!<br>{% endif %}";
  export let promptTitle = "Untitled Prompt";
  export let paramDict: Record<string, string> = {storyTopic: "time travelling"}
  const promptSchemaVersion: number = 1;

  // Parse prompt args
  // const paramParseRegex = /\$\$(\w+)/gi // $$paramName
  const paramParseRegex = /\{\{\s*(\w+)\s*(?:\||\}\})/gi // Jinja variables
  let paramList: string[] = [];
  let prompt: Prompt;
  // $: if (! promptText.startsWith("<p>")) { promptText = '<p>'+promptText+'</p>'}
  $: prompt = {
    version: promptSchemaVersion,
    prompt_text: promptText,
    parameters_dict: paramDict,
    title: promptTitle
  }
  $: matchedParams = promptText.matchAll(paramParseRegex);
  $: if (matchedParams) {
    let newParamList = [];
    for (let param of matchedParams) {
      let paramName = param[1];
      // if (paramDict[paramName] == undefined) { paramDict[paramName] = ""; }
      newParamList.push(paramName);
    }
    paramList = Array.from(new Set(newParamList));
  }

  // Render Result
  let renderedPrompt = "";
  let renderError = false;
  function renderPromptV1() {
    let result: string;

    try {
      renderError = false;
      // https://regex101.com/r/WhYBv9/1
      result = promptText.replace(/(\{\{\s*\w+\s*(?:\|\s*(?:[\w]+\(".*?"\)|[\w]+\('.*?'\)|.*?)\s?\}\}|\}\}))/gi, '<span class="param">$1</span>');
      // TODO: move sanitization at dict level
      let renderedParamDict: Record<string, string> = {};
      for (const paramName in paramDict) {
        renderedParamDict[paramName] = escapeHtml(paramDict[paramName] ?? '');
      }
      result = renderPrompt(result, renderedParamDict);
    } catch(err: any) {
      renderError = true;
      result = 'invalid syntax: ' + err.message;
    }

    return result;
  }
  $: if (promptText, paramList, paramDict) renderedPrompt = renderPromptV1();

  // Share
  let sharedUrl: string;
  let isSharing: boolean = false;
  let isShared: boolean = false;

  async function handleShare() {
    isSharing = true;
    const res = await fetch(`/api/prompt`, {
			method: 'POST',
			body: JSON.stringify(prompt)
		});

		const responseJson = await res.json()
    console.log("Saved prompt with id: " + responseJson.promptId);
    sharedUrl = $page.url.protocol + '//' + $page.url.host + '/p/' + responseJson.promptId
    
    isSharing = false;
    isShared = true;
  }

</script>

<div class="promptBox">

  <h2>Prompt</h2>
  <div class="promptText" contenteditable bind:innerHTML={promptText}></div>
  <p class="reference"><a href="https://mozilla.github.io/nunjucks/templating.html" target="_blank">template syntax</a> (note: only string parameter values are currently supported)</p>

  <h2>Parameters</h2>

  <!-- {#if } -->
  <table class="paramTable">
    <tr>
      <th class="min">Param Name</th> <th>Param Value</th>
    </tr>
    {#each paramList as paramName}
      <tr><td class="min"><span class="paramName">{paramName}</span></td><td> <input type="text" bind:value={paramDict[paramName]}> </td></tr>
    {/each}

  </table>

  <h2>Result</h2>
  <div class="renderedPrompt" class:renderError="{renderError}">
    {@html renderedPrompt}
  </div>
</div>

{#if isShared}
  <div id="sharedUrl"><a href="{sharedUrl}">{sharedUrl}</a></div>
  <div id="sharedDisclaimer"><p>Please note that Prompter is in early development stage, your work may become altered or unreachable at any time. Use it at your own risk!</p></div>
{:else if isSharing}
  <button id="shareButton" class="button">saving...</button>
{:else}
  <button id="shareButton" class="button" on:click={handleShare}>Share</button>
{/if}

<style>

h2 {
  text-transform: uppercase;
  font-weight:bold;
}

.promptBox {
  width:100%;
  background: var(--color-theme-1);
  margin:0;
  padding:1em;
}

:global(.promptBox p) {
  margin:1em;
}

.promptText {
  border:1px solid var(--color-theme-2);
  background:white;
  width:100%;
  padding: 1em;
  width: calc( 100% - 2em);
}

.reference {
  font-size: 0.8em;
  margin: 0;
  padding: 0;
  color: var(--color-theme-1);
}

.reference:hover {
  color: inherit;
}

.reference a {
  color: var(--color-theme-2);
}

/* Param Table */

.paramTable {
  width:100%;
  padding:1em;
  background: var(--color-bg-alphawhite);
}

.paramTable th {
  text-align:left;
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

/* Result */

.renderedPrompt {
  /* border: 1px solid var(--color-theme-2); */
  background: var(--color-bg-alphawhite);
  padding: 1em;
}

.renderError {
  color: white;
  background-color: darkred;
}

:global(.renderedPrompt .param) {
  color: var(--color-theme-2);
}

/* Share */

.button {
    display:inline-block;
    /* color:var(--color-theme-2); */
    border:1px solid var(--color-theme-1);
    border-radius: 2px;
    background:var(--color-theme-1);
    cursor:pointer;
    vertical-align:middle;
    max-width: 100px;
    padding: 1em;
    margin: 1em;
    text-align: center;
}
.button:hover {
    border:1px solid var(--color-theme-1);
    /* background-color:white;
    color: var(--color-theme-1); */
    color: var(--color-bg-alphawhite);
}

#sharedUrl {
  background: white;
  margin: 1em;
  padding: 1em;
}

#sharedUrl a {
  color: var(--color-theme-2);
}

#sharedDisclaimer p {
  font-style: italic;
  font-size: 0.9em;
  color: var(--color-bg-alphawhite);
}
</style>