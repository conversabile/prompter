<script lang="ts">
    import type { PromptChain, PromptStep, StepResult } from "$lib/chains";
    import type { StepRunStatus } from "$lib/prediction/chain";
    import { renderPrompt, type ComponentAndProps } from "$lib/prompts";
    import { faCheck, faClone } from "@fortawesome/free-solid-svg-icons";
    import '$lib/codemirror5/codemirror.css';
    import type { Editor } from "codemirror";
    import { onMount } from "svelte";
    import { copy } from "svelte-copy";
    import Fa from "svelte-fa";
    
    export let prompt: PromptStep;
    export let promptChain: PromptChain;
    export let paramDict: Record<string, string>;
    export let predictionStatus: Record<string, StepRunStatus>;
    export let renderedPrompts: Record<string, string>;
    
    
    // Render template
    let renderedPrompt = "";
    let renderedPromptComponents: ComponentAndProps[] = [];
    let renderError = false;
    let isCopied = false;
    
    let previousResults: Record<string, StepResult | null> = {};
    $: previousResults = Object.fromEntries(promptChain.steps.map(step => {
        const stepResult = step.results ? step.results[0] : null;
        return [step.resultKey, stepResult];
    })); // TODO: move to Chain Editor / oonly consider previous results
    
    function renderPromptV1() {
        renderError = false;
        
        try {
            let renderResult = renderPrompt(
            prompt, paramDict, previousResults, predictionStatus
            );
            renderedPrompts[prompt.resultKey] = renderResult.text;
            renderedPrompt = renderResult.html;
            renderedPromptComponents = renderResult.components;
        } catch(err: any) {
            renderError = true;
            renderedPrompt = 'invalid syntax: ' + err.message;
            renderedPrompts[prompt.resultKey] = '';
            renderedPromptComponents = [[renderedPrompt, null]]
        }
    }
    $: if (prompt.promptText, paramDict) renderPromptV1();
    
    // CodeMirror
    
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
    export let editor: CodeMirror.EditorFromTextArea | null = null;
    onMount(() => {
        // console.log("on mount", prompt.resultKey)
        if (! prompt.minimized) initializeCodeMirror();
    });
    function initializeCodeMirror() {
        // console.log("init code mirror", prompt.resultKey, prompt.promptText)
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
        // editor.setValue(prompt.promptText);
        cmInitialized = true;
    }
    
    // When a new step is added, only the last PromptBox component in the list is rendered from scratch.
    // Svelte reuses existing steps changing their state. This causes the editor content to lose sync with prompt text
    $: if (prompt.promptText && editor && editor.getDoc().getValue() != prompt.promptText) {editor.setValue(prompt.promptText);}
    
    
</script>

<svelte:head>
<!-- CodeMirror stuff is imported in app.html because PromptBox may be loaded after 
    head is already processed (e.g. svelte internal routing for browser back or link 
    from error/static pages) -->
    <!-- TODO: refactor with proper imports -->
</svelte:head>

<div class="promptDefinition">
    <p class="reference">(note: only string parameter values are currently supported) <a href="https://mozilla.github.io/nunjucks/templating.html" target="_blank">template syntax</a></p>
    <textarea class="codeMirrorTextarea" bind:this={cmTextArea}>{prompt.promptText}</textarea>
    <!-- <textarea class="codeMirrorTextarea" contenteditable bind:this={cmTextArea} bind:value={prompt.promptText}></textarea> -->
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

<style>
.promptDefinition {
  padding: 0 1em 1em 1em;
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

/* Rendered prompt */

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
  border-radius: 3px;
  padding: .25em 0;
  color: var(--color-A-text-highlight);
  text-decoration: underline;
  text-decoration-style: dashed;
}

:global(.renderedPrompt .spinner) {
  border: 0;
}

:global(.renderedPrompt .previousResult .resultKey) {
  font-family: monospace;
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