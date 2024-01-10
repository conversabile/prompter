<script lang="ts">
  import { onMount } from 'svelte';
  import { copy } from 'svelte-copy';
  import { renderPrompt, type Prompt, parameterNameList, parameterDict, piledParameterDict } from '$lib/prompts';
  import { escapeHtml } from '$lib/util';

  import '$lib/codemirror5/codemirror.css';
	import PromptBoxLLMMenu from './PromptBoxLLMMenu.svelte';


  // Model
  export let prompt: Prompt;
  export let paramDict: Record<string, string>;
  export let renderedPromptText: string = ""; // Will be read from outside to make predictions
  export let serviceSettingsPanelOpen: boolean; // Can be opened by PredictionBox to ask for parameters
  
  $: paramDict = piledParameterDict(prompt);

  // Render Result
  let renderedPrompt = "";
  let renderError = false;
  let isCopied = false;

  function renderPromptV1() {
    let resultHtml: string;
    let resultText: string;

    try {
      renderError = false;
      // https://regex101.com/r/WhYBv9/1
      const jinjaRegex = /(\{\{\s*\w+\s*(?:\|\s*(?:[\w]+\(".*?"\)|[\w]+\('.*?'\)|.*?)\s?\}\}|\}\}))/gi;
      resultHtml = prompt.promptText.replace(jinjaRegex, '<span class="param">$1</span>');
      // TODO: move sanitization at dict level
      let renderedParamDict: Record<string, string> = {};
      for (const paramName in paramDict) {
        renderedParamDict[paramName] = escapeHtml(paramDict[paramName] ?? '');
      }
      resultText = renderPrompt(prompt.promptText, renderedParamDict);
      resultHtml = renderPrompt(resultHtml, renderedParamDict);
    } catch(err: any) {
      renderError = true;
      resultHtml = 'invalid syntax: ' + err.message;
      resultText = '';
    }

    renderedPrompt = resultHtml;
    renderedPromptText = resultText;
  }
  $: if (prompt.promptText, paramDict) renderPromptV1();

  import type { Editor } from "codemirror";
	import Fa from 'svelte-fa';
	import { faAngleDown, faAngleUp, faCheck, faClipboard, faClone, faCopy, faRobot } from '@fortawesome/free-solid-svg-icons';
	import { LLM_SERVICE_NAMES, type ServiceSettings } from '$lib/services';
  
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
      prompt.promptText = eventEditor.getDoc().getValue();
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
  <header>
    <a href="javascript:void(0)" class="llmService" on:click={() => {serviceSettingsPanelOpen = ! serviceSettingsPanelOpen;}}>
      <span class="serviceName"><Fa icon={faRobot} />
        {LLM_SERVICE_NAMES[prompt.predictionService]}
        ({prompt.predictionSettings[prompt.predictionService].modelName})
      </span>
      <span class="expandButton">{#if serviceSettingsPanelOpen}<Fa icon={faAngleUp} />{:else}<Fa icon={faAngleDown} />{/if}</span>
    </a>
    <h2 class="promptTitle" contenteditable bind:innerText={prompt.title} on:keydown={handleTitleKeydown}>{prompt.title}</h2>
  </header>

  <PromptBoxLLMMenu
    bind:open={serviceSettingsPanelOpen}
    bind:service={prompt.predictionService}
    bind:settings={prompt.predictionSettings}
  />

  <div class="promptDefinition">
    <textarea class="codeMirrorTextarea" bind:this={cmTextArea}>{prompt.promptText}</textarea>
    <p class="reference"><a href="https://mozilla.github.io/nunjucks/templating.html" target="_blank">template syntax</a> (note: only string parameter values are currently supported)</p>
  </div>

  <footer>
    <div class="renderedPrompt" class:renderError="{renderError}">
      <div class="renderedPromptText">{@html renderedPrompt}</div>
      <span class="copiedConfirmation" class:hidden={!isCopied}><Fa icon={faCheck} /></span>
      <button
        class="copyPrompt"
        title="Copy prompt to clipboard"
        use:copy={renderedPromptText}
        on:svelte-copy={() => {isCopied = true; setTimeout(() => {isCopied = false;}, 500)}}
      ><Fa icon={faClone} /></button>
    </div>
  </footer>
</div>

<style>

h2 {
  text-transform: uppercase;
  font-weight:bold;  
}

.promptBox {
  width:100%;
  background: var(--color-A-bg);
  color: var(--color-A-text-standard);
  margin:0;
  padding:0;
  border-radius: 5px;
  border: 1px solid;
}

.promptBox header {
  background-color: var(--color-bg-alphawhite25);

  display: flex;
  flex-direction: row;
  align-items: center;

  border-radius: 5px 5px 0 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.75);
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
}

.promptBox header .llmService {
  background: var(--color-B-bg);
  color: var(--color-B-text-standard);
  height: 100%;
  display: inline-block;
  line-height: 1.5em;
  font-size: .8em;
  padding: .5em;
  font-family: monospace;
  z-index: 2;
}

.promptBox header .llmService:hover {
  background-color: var(--color-B-lightbg);
  color: var(--color-B-text-highlight);
  cursor: pointer;
  text-decoration: none;
}

.promptBox header .promptTitle {
  display: inline-block;
  flex: 1;
  line-height: 1rem;
  margin: 0;
  padding: .3em;

  text-transform: none;
  font-size: 0.9em;
  font-weight: normal;
  display: inline;
  cursor: pointer;
  margin: 0;
}

.promptBox header .promptTitle:focus {
  background-color: white;
  border: 0;
  cursor: inherit;
  font-weight: normal;
}

.promptBox .promptDefinition {
  padding: 1em 1em 0.5em 1em;
}

:global(.promptBox p) {
  margin:1em;
}

:global(.CodeMirror) {
  border: 1px solid rgba(0, 0, 0, 0.25);
  z-index: 0;
  padding: 0.5em;
}

.codeMirrorTextarea {
  width: calc( 100% - 1em );
  height: 100px; /* Height for default prompt, to limit glitch when CodeMirror loads */
  padding: 0.5em;
  overflow: visible;
  font-family: inherit;
}

.reference {
  font-size: 0.8em;
  margin: 0;
  padding: 0;
  color: var(--color-A-bg);
}

.reference:hover {
  color: inherit;
}

.reference a {
  color: var(--color-A-text-highlight);
}

/* Result */

.renderedPrompt {
  /* border: 1px solid var(--color-A-text-highlight); */
  border-top: 1px solid rgba(0, 0, 0, 0.25);
  background: var(--color-bg-alphawhite25);
  padding: 1em;
  white-space: pre-wrap;
  font-size: 0.8em;
  border-radius: 0 0 5px 5px;
  display: flex;
}

.renderedPromptText {
  flex-grow: 1;
}

.copyPrompt {
  display: inline;
  padding: 0;
  margin: 0;
  border: 0;
  background: none;
  height: 1rem;

  cursor: pointer;
  opacity: 0.5;
}
.copyPrompt:hover {
  opacity: 1;  
}

.copiedConfirmation {
  background: #81b36a;
  color: white;
  width: 1rem;
  height: 1rem;
  text-align: center;
  border-radius: 9px;
  margin-right: -0.9rem;
  flex-shrink: 0;
  z-index: 2;
  cursor: default;
  font-size: 0.6rem;
  line-height: 1rem;
  font-weight: bold;
}

.hidden {
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s 2s, opacity 0.5s linear;
}

.transparent {
  opacity: 0;
}

.renderError {
  color: white;
  background-color: darkred;
}

:global(.renderedPrompt .param) {
  color: var(--color-A-text-highlight);
}

</style>