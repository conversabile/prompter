<script lang="ts">
  import { apiUrl } from '$lib/api';
  import type { Prompt } from '$lib/prompts';

  // Model
	let promptText = "<p>Tell me a story about $$storyTopic, make it sound like $$storyTopic is the most interesting thing in the world!</p>";
  let promptTitle = "Untitled Prompt";
  const promptSchemaVersion: number = 1;

  // Parse prompt args
  const paramParseRegex = /\$\$(\w+)/gi
  let paramList: string[] = [];
  let paramDict: Record<string, string> = {storyTopic: "time travelling"}
  let prompt: Prompt;
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

  // Render result
  let renderedPrompt = "";
  function renderPrompt() {
    let result = promptText;
    for (const paramName of paramList) {
      let paramValue: string = paramDict[paramName];
      result = result.replaceAll('$$'+paramName, '<span class="param">'+paramValue+'</span>');
    }
    return result;
  }
  $: if (promptText, paramList, paramDict) renderedPrompt = renderPrompt();

  // Share
  async function handleShare() {
    // const promptId = crypto.randomUUID(); // TODO: polyfill
    // const res = await fetch(apiUrl('/v1/save/'+promptId), {
    const res = await fetch(`/api/prompt`, {
			method: 'POST',
			body: JSON.stringify(prompt)
		});

		const responseJson = await res.json()
    console.log("Saved prompt with id: " + responseJson.promptId);
		// result = JSON.stringify(json)
  }

</script>

<div class="promptBox">

  <h2>Prompt</h2>
  <div class="promptText" contenteditable bind:innerHTML={promptText}></div>

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
  <div class="renderedPrompt">
    {@html renderedPrompt}
  </div>
</div>

<button class="button" on:click={handleShare}>Share</button>

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
  width:100%
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
  border: 1px solid var(--color-theme-2);
  background: var(--color-bg-alphawhite);
  padding: 1em;
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
</style>