<script lang="ts">

	let promptText = "<p>Tell me a story about $$storyTopic, make it sound like $$storyTopic is the most interesting thing in the world!</p>";

  // Parse prompt args
  const paramParseRegex = /\$\$(\w+)/gi
  let paramList = [];
  let paramDict = {"storyTopic": "time travelling"}
  $: matchedParams = promptText.matchAll(paramParseRegex);
  $: if (matchedParams) {
    let newParamList = [];
    for (let param of matchedParams) {
      let paramName = param[1];
      // if (paramDict[paramName] == undefined) { paramDict[paramName] = ""; }
      newParamList.push(paramName);
    }
    paramList = Array.from(new Set(newParamList));
    console.log(newParamList);
  }

  // Render result
  let renderedPrompt = "";
  function renderPrompt() {
    let result = promptText;
    for (let paramName of paramList) {
      result = result.replaceAll('$$'+paramName, '<span class="param">'+paramDict[paramName]+'</span>');
    }
    return result;
  }
  $: renderedPrompt = renderPrompt(promptText, paramList, paramDict);

</script>

<div class="promptBox">

  <h2>Prompt</h2>
  <div class="promptText" contenteditable bind:innerHTML={promptText}></div>

  <h2>Parameters</h2>

  <!-- {#if } -->
  <table class="paramTable" border=0>
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
</style>