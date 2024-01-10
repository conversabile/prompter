<script lang="ts">
	import { page } from '$app/stores';
    import { env } from '$env/dynamic/public';
	import { PredictionService, LLM_SERVICE_NAMES, OPENAI_MODELS, type PredictionSettings, ENABLED_SERVICES } from "$lib/services";
	import { readLocalSettings, readLocalSettingsDict, setLocalSettings, userSettings } from '$lib/userSettings';
	import { faXmark } from "@fortawesome/free-solid-svg-icons";
	import Fa from "svelte-fa";

    export let open: boolean = false;
    export let service: PredictionService;
    export let settings: PredictionSettings;

    let persistenceSettings = {
        openai: readLocalSettingsDict().predictionService?.openai != null,
        ollama: readLocalSettingsDict().predictionService?.ollama != null,
    }

    // Check/uncheck "save locally" checkbox
    function handlePersistOpenaiChange() { handlePersistChange(PredictionService.openai); }
    function handlePersistOllamaChange() { handlePersistChange(PredictionService.ollama); }
    function handlePersistChange(service: PredictionService) {
        let localSettings = readLocalSettingsDict() as any;
        if (! persistenceSettings[service]) {
            delete localSettings.predictionService[service];
        } else {
            if (!localSettings.predictionService) localSettings['predictionService'] = {}; 
            localSettings['predictionService'][service] = $userSettings.predictionService[service];
        }
        setLocalSettings(localSettings);

    }

    // Blur service settings input (OpenAI key / Ollama server)
    function handlePersistOpenai() { handlePersist(PredictionService.openai); }
    function handlePersistOllama() { handlePersist(PredictionService.ollama); }
    function handlePersist(service: PredictionService) {
        if (persistenceSettings[service]) {
            let localSettings = readLocalSettingsDict();
            localSettings.predictionService[service] = $userSettings.predictionService[service];
            setLocalSettings(localSettings);
        }
    }
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
                    <input type="text" name="openaiApiKey" bind:value={$userSettings.predictionService.openai.apiKey} on:blur={handlePersistOpenai}>
                </td>
            </tr>
            <tr>
                <td> </td>
                <td class="persistSettingsSelector">
                    <input type="checkbox" name="persistOpenai" id="persistOpenai" bind:checked={persistenceSettings.openai} on:change={handlePersistOpenaiChange}>
                    <label for="persistOpenai" title="Your API key will be stored locally in your browser and used as default. Uncheck to remove from local storage.">Save OpenAI key locally</label>
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
                    <input type="text" name="ollamaServer" bind:value={$userSettings.predictionService.ollama.server} on:blur={handlePersistOllama}>
                </td>
            </tr>
            <tr>
                <td> </td>
                <td class="persistSettingsSelector">
                    <input type="checkbox" name="persistOllama" id="persistOllama" bind:checked={persistenceSettings.ollama} on:change={handlePersistOllamaChange}>
                    <label for="persistOllama">Save Ollama server settings locally</label>
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
    background: var(--color-B-bg);
    color: var(--color-B-text-standard);
    padding: 1em;
    max-width: 30rem;
    border: 1px solid #ffffff36;
    border-top: 0;
    margin-left: -2px;
    z-index: 2;
}

a {
    color: var(--color-B-text-highlight);
    text-decoration: underline;
}

h2 {
    font-size: 0.8em;
    font-weight: bold;
    text-transform: uppercase;
    color: var(--color-B-text-highlight);
}

.closeContainer {
    text-align: right;
}

select, input[type=text] {
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

.persistSettingsSelector {
    font-size: .9em;
    padding: .5em;
}

.persistSettingsSelector input[type=checkbox] {
    margin: 0 .5em 0 0;
}
</style>
