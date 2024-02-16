<script lang="ts">
	import { type RestStep, RestStepMethods } from "$lib/chains/chains";
	import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
	import Button from "../../Button.svelte";
	import { removeHeader } from "$lib/chains/rest";

    export let restStep: RestStep;

    let newHeaderKey: string;
    let newHeaderValue: string;
    let newHeaderKeyElement: HTMLInputElement;

    function handleAddHeader() {
        if (! newHeaderKey || ! newHeaderValue) return;

        restStep.header.push({
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
        <input type="text" class="reqUrl" bind:value={restStep.url}>
    </div>

    <h2>Headers</h2>
    <div class="reqHeaders">
        {#each restStep.header as header}
            <div class="row">
                <span>{header.key}: {header.value}</span>
                <Button icon={faMinus} size="small" onClick={() => handleRemoveHeader(header.key)} />
            </div>
        {/each}
        <form class="row" on:submit|preventDefault={() => {console.log("mimmo"); handleAddHeader();}}>
            <input type="text" bind:value={newHeaderKey} bind:this={newHeaderKeyElement}>
            <input type="text" bind:value={newHeaderValue}>
            <input type="submit" style="display: none">
            <Button icon={faPlus} size="small" onClick={handleAddHeader} />
        </form>
    </div>

    <h2>Body</h2>
    <textarea class="reqBody" bind:value={restStep.body}></textarea>
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
}

.reqUrl {
    flex-grow: 1;
    margin-left: .5em;
    line-height: 2em;
    font-family: monospace;
    padding-left: .5em;
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
}

.reqBody {
    width: 100%;
}
</style>