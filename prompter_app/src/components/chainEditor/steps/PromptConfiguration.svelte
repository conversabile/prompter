<script lang="ts">
	import { STEP_TYPE_DATA, StepType } from '$lib/chains/chains';
	import { PredictionService, LLM_SERVICE_NAMES, OPENAI_MODELS, type PredictionSettings, ENABLED_SERVICES } from "$lib/services";
	import PredictionServiceSettings from '../userSettings/PredictionServiceSettings.svelte';

    export let service: PredictionService;
    export let settings: PredictionSettings;
</script>

    <h2>{STEP_TYPE_DATA[StepType.prompt].label} configuration</h2>

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

    <PredictionServiceSettings bind:service />
<style>

</style>
