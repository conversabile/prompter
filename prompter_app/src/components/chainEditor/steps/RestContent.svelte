<script lang="ts">
	import { type RestStep, RestStepMethods } from "$lib/chains/chains";
	import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
	import Button from "../../Button.svelte";
	import { METHODS_WITHOUT_BODY, removeHeader, type RenderedRestStep } from "$lib/chains/rest";
	import { renderedSteps } from "$lib/editorSession";
	import CodeMirrorPreviewedTextarea from "../../CodeMirrorPreviewedTextarea.svelte";

    export let restStep: RestStep;

    let rendered: RenderedRestStep;
    $: rendered = ($renderedSteps[restStep.resultKey]) as RenderedRestStep;

    let newHeaderKey: string;
    let newHeaderValue: string;
    let newHeaderKeyElement: HTMLInputElement;

    function handleAddHeader() {
        if (! newHeaderKey || ! newHeaderValue) return;

        restStep.headers.push({
            key:newHeaderKey,
            value: newHeaderValue,
            disabled: false
        });
        restStep = restStep;

        newHeaderKey = "";
        newHeaderValue = "";
        newHeaderKeyElement.focus();
    }

    function handleRemoveHeader(key: string) {
        removeHeader(restStep, key);
        restStep = restStep;
    }
</script>

<div class="requestDetails">
    <div class="methodAndUrl">
        <select class="reqMethod" bind:value={restStep.method}>
            {#each Object.keys(RestStepMethods) as method}
                <option value={method}>{method}</option>            
            {/each}
        </select>
        <!-- <input type="text" class="reqUrl" bind:value={restStep.url}> -->
        <div class="reqUrl">
            <CodeMirrorPreviewedTextarea
                bind:content={restStep.url}
                bind:renderedContent={rendered.url}
                textareaDefaultStyle="width: 100%; height:1.5em; padding:0.2em"
            />
        </div>
    </div>

    <h2>Headers</h2>
    <div class="reqHeaders">
        {#each restStep.headers as header}
            <div class="row">
                <span>{header.key}: {header.value}</span>
                <Button icon={faMinus} size="small" onClick={() => handleRemoveHeader(header.key)} />
            </div>
        {/each}
        <form class="row" on:submit|preventDefault={() => {handleAddHeader();}}>
            <input type="text" bind:value={newHeaderKey} bind:this={newHeaderKeyElement}>
            <input type="text" bind:value={newHeaderValue}>
            <input type="submit" style="display: none">
            <Button icon={faPlus} size="small" onClick={handleAddHeader} />
        </form>
    </div>

    {#if ! METHODS_WITHOUT_BODY.has(restStep.method)}
        <h2>Body</h2>
        <div class="reqBody">
            <CodeMirrorPreviewedTextarea
                bind:content={restStep.body}
                bind:renderedContent={rendered.body}
                textareaDefaultStyle="width: 100%; height:100px; padding:0.5em"
            />
        </div>
    {/if}

</div>

<style>
h2 {
    font-weight: bold;
}

.requestDetails {
    padding: 1em;
}

.methodAndUrl {
    display: flex;
    flex-direction: row;
}

.reqMethod {
    background-color: white;
    border: 1px solid;
    height: 2.3em;
}

.reqUrl {
    flex-grow: 1;
    margin-left: .5em;
    overflow: hidden;
    /* line-height: 2em;
    font-family: monospace;
    padding-left: .5em; */
}

:global(.reqUrl .CodeMirror) {
    padding:0.1em;
    border: 1px solid black;
}

.reqHeaders {
    width: 100%;
}

.reqHeaders .row {
    display: flex;
    padding: .25em 0;
}

.reqHeaders .row span {
    margin-right: .5em;
    font-family: monospace;
    flex-grow: 1;
    border: 1px solid;
    padding: .2em .5em;
}

.reqHeaders input {
    flex-grow: 1;
    margin-right: .5em;
    min-width: 5em;
}

.reqBody {
    width: 100%;
}

:global(.reqBody .CodeMirror) {
  border: 1px solid black;
  padding: 0.5em;
}
</style>