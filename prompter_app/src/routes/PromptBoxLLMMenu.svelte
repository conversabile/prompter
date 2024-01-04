<script lang="ts">
	import { page } from '$app/stores';
    import { env } from '$env/dynamic/public';
	import { PredictionService, LLM_SERVICE_NAMES, OPENAI_MODELS, type PredictionSettings, ENABLED_SERVICES, type ServiceSettings } from "$lib/services";
	import { faXmark } from "@fortawesome/free-solid-svg-icons";
	import Fa from "svelte-fa";

    export let open: boolean = false;
    export let model: string;
    export let service: PredictionService;
    export let settings: PredictionSettings;
    export let serviceSettings: ServiceSettings;
</script>

{#if open}

<div class="modal" on:click={() => {open = false;}}></div>

<div class="llmServiceMenu">
    <!-- <div class="closeContainer">
        <a on:click={() => {open = false;}}><Fa icon={faXmark} /></a>
    </div> -->
    <h2>Prompt configuration</h2>

    <table>
        <tr>
            <th><label for="llmService">Service</label></th>
            <td>
                <select name="llmService" id="llmService" bind:value={service}>
                    {#each ENABLED_SERVICES as service}
                    <option value={service}>{LLM_SERVICE_NAMES[service]}</option>
                    <!-- <option value={service}>{service}</option> -->
                    {/each}
                </select>
            </td>
        </tr>

        {#if service == PredictionService.openai}
            <tr>
                <th><label for="openaiModel">Model</label></th>
                <td>
                    <select name="openaiModel" id="openaiModel" bind:value={settings.openai.modelName}>
                        {#each OPENAI_MODELS as model}
                            <option value={model}>{model}</option>
                        {/each}
                    </select>
                </td>
            </tr>
        {/if}
        

        {#if service == PredictionService.ollama}
            <tr>
                <th><label for="ollamaModel">Model</label></th>
                <td>
                    <input type="text" name="ollamaModel" id="ollamaModel" bind:value={settings.ollama.modelName} />
                </td>
            </tr>
        {/if}
    </table>

    <h2>User configuration</h2>
    <table>
        {#if service == PredictionService.openai}
            <tr>
                <th><label for="openaiApiKey">API Key</label></th>
                <td>
                    <input type="text" name="openaiApiKey" bind:value={serviceSettings.openai.apiKey}>
                </td>
            </tr>
            <tr>
                <td colspan="2" class="userSettingsInfo"><small>Prediction requests are sent from your browser. Your key won't be sent to {env.PUBLIC_SITE_NAME} server, nor included in shared prompts.</small></td>
            </tr>
        {/if}

        {#if service == PredictionService.ollama}
            <tr class:highlightRequired={false}>
                <th><label for="ollamaServer">Ollama Server</label></th>
                <td>
                    <input type="text" name="ollamaServer" bind:value={serviceSettings.ollama.server}>
                </td>
            </tr>
            <tr>
                <td colspan="2" class="userSettingsInfo"><small>Prediction requests are sent from your browser, make sure you have a working <a href="https://ollama.ai/" target="_blank">Ollama</a> server running, and that <tt>{$page.url.protocol + '//' + $page.url.hostname}</tt> is an <a href="https://github.com/jmorganca/ollama/blob/main/docs/faq.md#how-can-i-allow-additional-web-origins-to-access-ollama" target="_blank">allowed origin</a>!</small></td>
            </tr>
        {/if}
    </table>
    
</div>

{/if}

<style>
.modal {
    /* background-color: black; */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* backdrop-filter: blur(1px); */
    z-index: 1;
}

.llmServiceMenu {
    position: absolute;
    background: var(--color-theme-darkgray);
    color: white;
    padding: 1em;
    max-width: 30rem;
    border: 1px solid #ffffff36;
    border-top: 0;
    margin-left: -2px;
    z-index: 2;
}

h2 {
    font-size: 0.8em;
    font-weight: bold;
    text-transform: uppercase;
}

.closeContainer {
    text-align: right;
}

select, input {
    background: white;
    border: 1px solid;
    width: 100%;
    font-size: .8em;
    box-sizing: border-box;
    padding: 0.3em
}

table {
    text-align: left;
}

th, td {
    padding: 0 0.5em;
}

th {
    font-weight: normal;
    width: 0em;
    white-space: nowrap;
}

.userSettingsInfo {
    font-style: italic;
    text-align: center;
    padding-top: 1em;
}
</style>
