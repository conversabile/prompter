<script lang="ts">
  import type { PromptChain, PromptStep, StepResult } from "$lib/chains/chains";
  import { faCheck, faClone } from "@fortawesome/free-solid-svg-icons";
  import '$lib/codemirror5/codemirror.css';
  import { copy } from "svelte-copy";
  import Fa from "svelte-fa";
  import CodeMirrorTextarea from "../../CodeMirrorTextarea.svelte";
	import { editorSession, renderedSteps } from "$lib/editorSession";
	import type { RenderedPrompt } from "$lib/chains/prompts";
	import ComponentList from "../../ComponentList.svelte";
    
  export let prompt: PromptStep;

  let promptChain: PromptChain;
  let paramDict: Record<string, string>;

  $: promptChain = $editorSession.promptChain;
  $: paramDict = $editorSession.promptChain.parametersDict;
  $: rendered = $renderedSteps[prompt.resultKey] as RenderedPrompt
  
  let isCopied = false;
  
  let previousResults: Record<string, StepResult | null> = {};
  $: previousResults = Object.fromEntries(promptChain.steps.map(step => {
      const stepResult = step.results ? step.results[0] : null;
      return [step.resultKey, stepResult];
  })); // TODO: move to Chain Editor / only consider previous results

</script>

<div class="promptDefinition">
    <p class="reference">(note: only string parameter values are currently supported) <a href="https://mozilla.github.io/nunjucks/templating.html" target="_blank">template syntax</a></p>
    <!-- TODO: customize 100px in defaultStyle with a better estimate of textarea height based on prompt rows -->
    <CodeMirrorTextarea bind:value={prompt.promptText} defaultStyle="width: calc( 100% - 1em ); height: 100px; padding: 0.5em;" />
    <div class="renderedPrompt" class:renderError="{rendered.prompt.error}">
        <div class="renderedPromptText">
            <ComponentList components={rendered.prompt.components} />
        </div>
        <span class="copiedConfirmation" class:hidden={!isCopied}><Fa icon={faCheck} /></span>
        <button
          class="copyPrompt"
          title="Copy prompt to clipboard"
          use:copy={rendered.prompt.text}
          on:svelte-copy={() => {isCopied = true; setTimeout(() => {isCopied = false;}, 500)}}
        ><Fa icon={faClone} /></button>
    </div>
</div>

<style>
.promptDefinition {
  padding: 0 1em 1em 1em;
}

:global(.promptDefinition .CodeMirror) {
  /* border: 1px solid rgba(0, 0, 0, 0.25); */
  padding: 0.5em;
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
  color: var(--color-A-text-highlight-1);
}

/* Rendered prompt */

.renderedPrompt {
  background: var(--color-bg-alphawhite25);
  padding: 1em;
  white-space: pre-wrap;
  font-size: 0.8em;
  border-radius: 0 0 5px 5px;
  display: flex;
  /* border: 1px solid var(--color-A-bg); */
  border-top: 0;
}

:global(.renderedPrompt .previousResult) {
  border-radius: 3px;
  padding: .25em 0;
  color: var(--color-A-text-highlight-2);
  font-family: monospace;
}

:global(.renderedPrompt .spinner) {
  border: 0;
}

:global(.renderedPrompt .previousResult .resultKey) {
  font-family: monospace;
  background: var(--color-A-text-highlight-2);
  padding: .25em 0.5em;
  color: rgba(255, 255, 255, 0.8);
  margin-right: .25em;
  border-radius: 3px 3px 0 0;
  user-select: none;
  white-space: nowrap;
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
  color: var(--color-A-text-highlight-1);
}
</style>