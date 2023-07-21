<script lang="ts">
  import { onMount } from 'svelte';
  import { promptSchemaVersion, type Prompt } from '$lib/prompts';
  import { renderPrompt } from '$lib/prompts';
  import { escapeHtml } from '$lib/util';

  import '$lib/codemirror5/codemirror.css';

  // Model
	export let promptText: string;
  export let promptTitle: string;
  export let paramDict: Record<string, string>;
  export let renderedPromptText: string = ""; // Will be read from outside to make predictions

  // Parse prompt args
  // const paramParseRegex = /\$\$(\w+)/gi // $$paramName
  const paramParseRegex = /\{\{\s*(\w+)\s*(?:\||\}\})/gi // Jinja variables
  let paramList: string[] = [];
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

  // Render Result
  let renderedPrompt = "";
  let renderError = false;

  function renderPromptV1() {
    let resultHtml: string;
    let resultText: string;

    try {
      renderError = false;
      // https://regex101.com/r/WhYBv9/1
      const jinjaRegex = /(\{\{\s*\w+\s*(?:\|\s*(?:[\w]+\(".*?"\)|[\w]+\('.*?'\)|.*?)\s?\}\}|\}\}))/gi;
      resultHtml = promptText.replace(jinjaRegex, '<span class="param">$1</span>');
      // TODO: move sanitization at dict level
      let renderedParamDict: Record<string, string> = {};
      for (const paramName in paramDict) {
        renderedParamDict[paramName] = escapeHtml(paramDict[paramName] ?? '');
      }
      resultText = renderPrompt(promptText, renderedParamDict);
      resultHtml = renderPrompt(resultHtml, renderedParamDict);
    } catch(err: any) {
      renderError = true;
      resultHtml = 'invalid syntax: ' + err.message;
      resultText = '';
    }

    renderedPrompt = resultHtml;
    renderedPromptText = resultText;
  }
  $: if (promptText, paramList, paramDict) renderPromptV1();

  import type { Editor } from "codemirror";
  
  // From https://github.com/NaokiM03/codemirror-svelte/blob/CodeMirror5/src/Codemirror.svelte
  // TODO: fixes ts(2686) but breaks CodeMirror reference :(
  //   import type {
  //   Editor,
  //   EditorConfiguration,
  //   EditorFromTextArea,
  // } from "codemirror";
  // export let CodeMirror: {
  //   fromTextArea: (
  //     element: HTMLTextAreaElement,
  //     options?: EditorConfiguration
  //   ) => EditorFromTextArea;
  // };

  // let cmText: string;
  let cmTextArea: HTMLTextAreaElement;
  export let editor = null;
  onMount(() => {
    cmTextArea.style.height = "calc( "+ cmTextArea.scrollHeight + "px - 2em)" 
    
    // TODO: fix ts(2686)
    // @ts-ignore
    editor = CodeMirror.fromTextArea(cmTextArea, {
      mode: {name: "jinja2", htmlMode: true}
    });
    editor.on("change", function (eventEditor: Editor) {
      promptText = eventEditor.getDoc().getValue();
    })
  });

  /**
   * Pressing "Enter" while editing title should de-focus the input element
   */
  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key == "Enter") {
      e.preventDefault();
      try {
        if (e.target) (e.target as HTMLElement).blur();
      } catch (e) {
        throw(e);
      }
    }
  }
</script>

<svelte:head>
  <!-- CodeMirror stuff is imported in app.html because PromptBox may be loaded after 
    head is already processed (e.g. svelte internal routing for browser back or link 
    from error/static pages) -->
  <!-- TODO: refactor with proper imports -->
</svelte:head>

<div class="promptBox">

  <h2 class="promptTitle" contenteditable bind:innerText={promptTitle} on:keydown={handleTitleKeydown}>{promptTitle}</h2>
  <textarea class="codeMirrorTextarea" bind:this={cmTextArea}>{promptText}</textarea>
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

<style>

h2 {
  text-transform: uppercase;
  font-weight:bold;
}

.promptTitle {
  text-transform: none;
  font-weight: normal;
  font-size: 1.3em;
  display: inline-block;
  padding: 0.5em 0;
  width: 100%;
  text-align: center;
  cursor: pointer;
  margin: 0 auto 0.5em auto;
}

.promptTitle:focus {
  background-color: white;
  border: 0;
  cursor: inherit;
}

.promptBox {
  width:100%;
  background: var(--color-theme-orange);
  margin:0;
  padding:1em;
}

:global(.promptBox p) {
  margin:1em;
}

.codeMirrorTextarea {
  width: calc( 100% - 2em );
  height: 100px; /* Height for default prompt, to limit glitch when CodeMirror loads */
  padding: 1em;
  overflow: visible;
  font-family: inherit;
}

.reference {
  font-size: 0.8em;
  margin: 0;
  padding: 0;
  color: var(--color-theme-orange);
}

.reference:hover {
  color: inherit;
}

.reference a {
  color: var(--color-theme-blue);
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
  /* border: 1px solid var(--color-theme-blue); */
  background: var(--color-bg-alphawhite);
  padding: 1em;
  white-space: pre-wrap;
}

.renderError {
  color: white;
  background-color: darkred;
}

:global(.renderedPrompt .param) {
  color: var(--color-theme-blue);
}

</style>