<script lang="ts">
import { env } from "$env/dynamic/public";
import { PredictionService } from "$lib/services";
import { readLocalSettingsDict, setLocalSettings, userSettings } from "$lib/userSettings";
import { page } from '$app/stores';

export let service: PredictionService;

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

<style>
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

a {
    color: var(--color-B-text-highlight);
    text-decoration: underline;
}
</style>