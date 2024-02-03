<script lang="ts">
  import { onMount } from 'svelte';
  import { copy } from 'svelte-copy';
  import { renderPrompt, type PromptStep, type PromptChain, type StepResult } from '$lib/prompts';
  import { escapeHtml } from '$lib/util';

  import '$lib/codemirror5/codemirror.css';
	import PromptBoxLLMMenu from './PromptBoxLLMMenu.svelte';


  // Model
  export let prompt: PromptStep;
  export let promptChain: PromptChain;
  export let paramDict: Record<string, string>;
  export let renderedPrompts: Record<string, string>; // Will be read from outside to make predictions
  export let predictionStatus: Record<string, StepRunStatus>;
  
  let serviceSettingsPanelOpen: boolean = false;

  // Prediction
  let predictionIcon: IconDefinition = faRobot;
  let predictionIconSpin: boolean = false;
  $: if (predictionStatus[prompt.resultKey]) {
    let status = predictionStatus[prompt.resultKey].status;
    if (status == RunStatus.success) {predictionIcon = faRobot; predictionIconSpin = false;}
    if (status == RunStatus.inProgress) {predictionIcon = faSpinner; predictionIconSpin = true;}
    if (status == RunStatus.error) {predictionIcon = faCircleExclamation; predictionIconSpin = false;}
    if (status == RunStatus.skipped) {predictionIcon = faXmark; predictionIconSpin = false;}
    if (status == RunStatus.onHold) {predictionIcon = faHourglass; predictionIconSpin = false;}
  }
  
  // Render Result
  let renderedPrompt = "";
  let renderedPromptComponents: Array<Array<any>> = [];
  let renderError = false;
  let isCopied = false;

  let previousResults: Record<string, StepResult | null> = {};
  $: promptChain.steps.forEach(step => {
    // TODO break when prompt is reached
    previousResults[step.resultKey] = step.results ? step.results[0] : null;
  })

  function renderPromptV1() {
    let resultComponents = [];
    let resultHtml: string;
    let resultText: string;

    try {
      renderError = false;

      // https://regex101.com/r/WhYBv9/2
      const jinjaRegex = /(\{\{\s*(\w+)\s*(?:\|\s*(?:[\w]+\(".*?"\)|[\w]+\('.*?'\)|.*?)\s?\}\}|\}\}))/gi;
      const spinnerTag = "<i class=\"prompter spinner\"></i>"; // Will be replaced with spinner component
      
      resultHtml = prompt.promptText.replace(jinjaRegex, (match, _, matchedParamName) => {
        if (previousResults[matchedParamName] !== undefined) {
          let resultValue;
          let resultSpinner = "";
          if (
            predictionStatus[matchedParamName]?.status == RunStatus.onHold ||
            (predictionStatus[matchedParamName]?.status == RunStatus.inProgress && ! previousResults[matchedParamName])
          ) {
            resultValue = "";
            resultSpinner = spinnerTag;
          } else {
            resultValue = (previousResults[matchedParamName]) ? match : '-';
          }
          return '<span class="previousResult">' +
                    '<span class="resultKey">'+matchedParamName+'</span>' +
                    resultValue +
                 '</span>' + resultSpinner;
        }
        return '<span class="param">' + match + '</span>'
      });

      // TODO: move sanitization at dict level
      let renderedParamDict: Record<string, string> = {};
      for (const paramName in paramDict) {
        renderedParamDict[paramName] = escapeHtml(paramDict[paramName] ?? '');
      }
      for (const resultKey in previousResults) {
        if (previousResults[resultKey] != null) {
          renderedParamDict[resultKey] = (previousResults[resultKey] as StepResult).resultRaw;
        }
      }
      resultText = renderPrompt(prompt.promptText, renderedParamDict);
      resultHtml = renderPrompt(resultHtml, renderedParamDict);

      // Replace spinner tag with spinner component
      const spinnerSplit = resultHtml.split(spinnerTag);
        if (spinnerSplit.length > 1) {
          for (let i=0; i < spinnerSplit.length-1; i++) {
            resultComponents.push([spinnerSplit[i], null]);
            resultComponents.push([PromptBoxRenderedPromptSpinner, {}]);
          }
        }
      resultComponents.push([spinnerSplit[spinnerSplit.length-1]]);
    } catch(err: any) {
      renderError = true;
      resultHtml = 'invalid syntax: ' + err.message;
      resultText = '';
    }

    renderedPrompt = resultHtml;
    renderedPromptComponents = resultComponents;
    renderedPrompts[prompt.resultKey] = resultText;
  }
  $: if (prompt.promptText, paramDict) renderPromptV1();

  import type { Editor } from "codemirror";
	import Fa from 'svelte-fa';
	import { faAngleDown, faAngleUp, faCheck, faCircleExclamation, faClone, faDownLeftAndUpRightToCenter, faGear, faHourglass, faMinimize, faPause, faRobot, faSpinner, faUpRightAndDownLeftFromCenter, faWarning, faXmark, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import { LLM_SERVICE_NAMES } from '$lib/services';
	import { RunStatus, type StepRunStatus } from '$lib/prediction';
	import PromptBoxRenderedPromptSpinner from './PromptBoxRenderedPromptSpinner.svelte';
  
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
  let cmInitialized = false;
  let cmTextArea: HTMLTextAreaElement;
  export let editor = null;
  onMount(() => {
    if (! prompt.minimized) initializeCodeMirror();
  });
  function initializeCodeMirror() {
    if (cmInitialized) return;

    cmTextArea.style.height = "calc( "+ cmTextArea.scrollHeight + "px - 2em)" 
    
    // TODO: fix ts(2686)
    // @ts-ignore
    editor = CodeMirror.fromTextArea(cmTextArea, {
      mode: {name: "jinja2", htmlMode: true}
    });
    editor.on("change", function (eventEditor: Editor) {
      prompt.promptText = eventEditor.getDoc().getValue();
    });
    cmInitialized = true;
  }

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

<div class="promptBox" class:minimized={prompt.minimized}>
  <header>
    <a href="javascript:void(0)" 
       class="llmService" 
       on:click={() => {serviceSettingsPanelOpen = ! serviceSettingsPanelOpen;}}
       title="{LLM_SERVICE_NAMES[prompt.predictionService]} ({prompt.predictionSettings[prompt.predictionService].modelName})"
    >
      <span class="serviceName">
        <span><Fa icon={predictionIcon} bind:spin={predictionIconSpin} /></span>
        <span>{LLM_SERVICE_NAMES[prompt.predictionService]}</span>
        ({prompt.predictionSettings[prompt.predictionService].modelName})
      </span>
      <span class="expandButton">{#if serviceSettingsPanelOpen}<Fa icon={faAngleUp} />{:else}<Fa icon={faAngleDown} />{/if}</span>
    </a>
    <!-- <p class="promptResultKey" contenteditable bind:innerText={prompt.resultKey} on:keydown={handleTitleKeydown}>{prompt.resultKey}</p> -->
    <h2 class="promptTitle" contenteditable bind:innerText={prompt.title} on:keydown={handleTitleKeydown}>{prompt.title}</h2>
    <div class="stepActions">
      <!-- <button><Fa icon={faDiagramProject} /></button> -->
      <button on:click={() => {
        prompt.minimized = ! prompt.minimized;
        if (! prompt.minimized) setTimeout(initializeCodeMirror, 50);
      }}><Fa icon={prompt.minimized ? faUpRightAndDownLeftFromCenter : faDownLeftAndUpRightToCenter} />
      </button><!--<button><Fa icon={faXmark} /></button> -->
    </div>
  </header>

  <PromptBoxLLMMenu
    bind:open={serviceSettingsPanelOpen}
    bind:service={prompt.predictionService}
    bind:settings={prompt.predictionSettings}
  />

  <div class="promptDefinition">
    <p class="reference">(note: only string parameter values are currently supported) <a href="https://mozilla.github.io/nunjucks/templating.html" target="_blank">template syntax</a></p>
    <textarea class="codeMirrorTextarea" bind:this={cmTextArea}>{prompt.promptText}</textarea>
    <div class="renderedPrompt" class:renderError="{renderError}">
      <!-- <div class="renderedPromptText">{@html renderedPrompt}</div> -->
      <div class="renderedPromptText">
      {#each renderedPromptComponents as [component, props]}
          {#if typeof(component) == "string"}
            {@html component}
          {:else}
            <svelte:component this={component} {...props} />
          {/if}
      {/each}
     </div>
      <span class="copiedConfirmation" class:hidden={!isCopied}><Fa icon={faCheck} /></span>
      <button
        class="copyPrompt"
        title="Copy prompt to clipboard"
        use:copy={renderedPrompts[prompt.resultKey]}
        on:svelte-copy={() => {isCopied = true; setTimeout(() => {isCopied = false;}, 500)}}
      ><Fa icon={faClone} /></button>
    </div>
  </div>

  <footer>
    {#if prompt.results}
      <div class="promptResult">
        <p><span class="icon"><Fa icon={faRobot} /></span> <span class="resultKey">{prompt.resultKey}</span> {#if prompt.results[0].renderedPrompt != renderedPrompts[prompt.resultKey]} <span class="warning"><Fa icon={faWarning} /> This prediction was made with a different version of the prompt</span>{/if}</p><p>{prompt.results[0].resultRaw}</p>
      </div>
    {/if}

    {#if predictionStatus[prompt.resultKey] && predictionStatus[prompt.resultKey].error}
      <div class="promptResult predictionError">
        <span class="message"><Fa icon={faCircleExclamation} /> {predictionStatus[prompt.resultKey].error}</span>
        <button
          class="button configureButton"
          title="Open service configuration"
          on:click={() => {serviceSettingsPanelOpen = true}}
        ><Fa icon={faGear} /></button>
      </div>
    {/if}
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
  margin:1em 0 0 0;
  padding:0;
  border-radius: 5px;
  border: 1px solid;
}

.promptBox.minimized .promptDefinition, .promptBox.minimized footer {
  display: none;
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

.promptBox header .llmService .serviceName {
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 20vw;
  display: inline-block;
  white-space: nowrap;
  line-height: 1.5em;
  vertical-align: middle;
}

.promptBox header .llmService .expandButton {
  display: inline-flex;
  line-height: 1em;
  vertical-align: middle;
  /* margin-left: .5em; */
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

.promptBox header .stepActions button {
  font-size: .8em;
  line-height: 1.5em;
  margin: 0;
  border-radius: 0;
  border: 0;
  border-left: 1px solid #00000054;
  background: none;
  padding: .25em 0;
  width: 1.9em;
  color: rgba(0, 0, 0, 0.75);
  cursor: pointer;
}

.promptBox header .stepActions button:hover {
  color: black;
}

.promptBox .promptDefinition {
  padding: 0 1em 1em 1em;
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
  text-align: right;
}

.reference:hover {
  color: inherit;
}

.reference a {
  color: var(--color-A-text-highlight);
}

/* Result */

.promptResult {
  /* border: 1px solid var(--color-A-text-highlight); */
  border-top: 1px solid rgba(0, 0, 0, 0.25);
  background: var(--color-bg-alphawhite25);
  padding: 1em;
  white-space: pre-wrap;
  font-family: monospace;
  border-radius: 0 0 5px 5px;
  /* display: flex; */
}

.promptResult .resultKey {
  font-weight: bold;
}

.promptResult .icon {
  display: inline-block;
}

.promptResult .warning {
  font-size: .8em;
  font-style: italic;
  color: rgba(0, 0, 0, 0.5);
}

.predictionError {
  color: #b03232;
  text-align: center;
  display: flex;
}

.predictionError .message {
  width: 100%;
  display: inline-block;
  margin: auto;
}

.configureButton {
  border: 1px solid;
  margin: 0;
  padding: 1em 1.1em;
}

.configureButton:hover {
  background: rgb(255,255,255,0.1)
}

.renderedPrompt {
  background: var(--color-bg-alphawhite25);
  padding: 1em;
  white-space: pre-wrap;
  font-size: 0.8em;
  border-radius: 0 0 5px 5px;
  display: flex;
  border: 1px solid var(--color-A-bg);
  border-top: 0;
}

:global(.renderedPrompt .previousResult) {
  border-bottom: 1px dashed var(--color-A-text-highlight);
  border-radius: 3px;
  padding: .25em 0;
  line-height: 2em;
  color: var(--color-A-text-highlight);
}

:global(.renderedPrompt .spinner) {
  border: 0;
}

:global(.renderedPrompt .previousResult .resultKey) {
  background: var(--color-A-text-highlight);
  padding: .25em 0.5em;
  color: white;
  margin-right: .25em;
  border-radius: 3px 3px 0 0;
  border: 1px solid var(--color-A-text-highlight);
  user-select: none;
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

.renderError {
  color: white;
  background-color: darkred;
}

:global(.renderedPrompt .param) {
  color: var(--color-A-text-highlight);
}

</style>