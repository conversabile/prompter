<script lang="ts">
	import { STEP_TYPE_DATA, StepType } from '$lib/chains/chains';
	import { PredictionService, LLM_SERVICE_NAMES, type PredictionSettings, ENABLED_EMBEDDING_SERVICES, OPENAI_EMBEDDING_MODELS } from "$lib/services";
	import PredictionServiceSettings from '../userSettings/PredictionServiceSettings.svelte';

    export let service: PredictionService;
    export let settings: PredictionSettings;
</script>

    <h2>{STEP_TYPE_DATA[StepType.documentIndex].label} configuration</h2>

    <table>
        <tr>
            <th><label for="llmService">Embedding Service</label></th>
            <td>
                <select name="llmService" id="llmService" bind:value={service}>
                    {#each ENABLED_EMBEDDING_SERVICES as service}
                    <option value={service}>{LLM_SERVICE_NAMES[service]}</option>
                    <!-- <option value={service}>{service}</option> -->
                    {/each}
                </select>
            </td>
        </tr>

        {#if service == PredictionService.openai}
            <tr>
                <th><label for="openaiModel">Embedding Model</label></th>
                <td>
                    <select name="openaiModel" id="openaiModel" bind:value={settings.openai.modelName}>
                        {#each OPENAI_EMBEDDING_MODELS as model}
                            <option value={model}>{model}</option>
                        {/each}
                    </select>
                </td>
            </tr>
        {/if}
        

        {#if service == PredictionService.ollama}
            <tr>
                <th><label for="ollamaModel">Embedding Model</label></th>
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
