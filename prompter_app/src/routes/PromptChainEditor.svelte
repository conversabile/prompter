<script lang="ts">
	import { env } from '$env/dynamic/public';
  import { page } from '$app/stores';
  import { promptSchemaVersion, type PromptChain, type PromptPrediction } from '$lib/prompts';
  import PromptBox from './PromptBox.svelte';

  export let chainTitle: string = "Untitled Prompt";
  export let promptChain: PromptChain = {
    version: promptSchemaVersion,
    title: chainTitle,
    prompts: [{
      version: promptSchemaVersion,
      promptText: "Tell me a short (less than {{ maxWords }} words) story about {{ storyTopic }}.\n\n{% if anotherTopic %}\nAnd another one about {{ anotherTopic | upper }}!!!\n{% endif %}",
      parametersDict: {storyTopic: "time travelling", maxWords: "50"},
      title:  chainTitle,
      predictions: null,
      predictionService: PredictionService.openai,
      predictionSettings: defaultPredictionSettings()
    }]
  }
  let serviceSettings: ServiceSettings = {
    openai: {apiKey: ""},
    ollama: {server: "http://localhost:11434"}
  }
  let serviceSettingsPanelOpen: boolean = false;
  let renderedPromptText: string;
  export let isShared: boolean = false;   // Show "Share" tab with permalink
  export let chainId: string | null = null;
  export let editKey: string | null = null;

  let activeTab = (isShared) ? "share" : "prediction";

  import Fa from 'svelte-fa'
  import { faPlay, faSave, faClone, faShare } from '@fortawesome/free-solid-svg-icons'
	import PredictionBox from './PredictionBox.svelte';
	import ShareBox from './ShareBox.svelte';
	import { PredictionService, defaultPredictionSettings, type ServiceSettings } from '$lib/services';
  
</script>

<PromptBox
    bind:prompt = {promptChain.prompts[0]}
    bind:paramDict = {promptChain.prompts[0].parametersDict}
    bind:renderedPromptText = {renderedPromptText}
    bind:serviceSettings = {serviceSettings}
    bind:serviceSettingsPanelOpen = {serviceSettingsPanelOpen}
/>

<div class="tabLabels">
  <button class="predictTab" class:active={activeTab == "prediction"} title="Predict prompt on OpenAI" on:click={() => activeTab = "prediction"}>
    <Fa icon={faPlay} /> Predict
  </button><button title="Share your prompt" class:active={activeTab == "share"} on:click={() => activeTab = "share"}>
    <Fa icon={faShare} /> Share
  </button>
</div>

{#if activeTab == "prediction"}
<div class="predictionTab tabContent">
  <PredictionBox
    bind:promptChain={promptChain}
    bind:renderedPromptText={renderedPromptText}
    bind:serviceSettings={serviceSettings}
    bind:serviceSettingsPanelOpen={serviceSettingsPanelOpen}
  />
</div>
{/if}

{#if activeTab == "share"}
<div class="shareTab tabContent">
  <ShareBox
    bind:promptChain={promptChain}
    bind:isShared={isShared}
    bind:chainId={chainId}
    bind:editKey={editKey}
  />
</div>
{/if}

<style>

.tabLabels {
  margin: 1em 0 0 0;
  border: 0;
  text-align: left;
  width: 100%;
}

.tabLabels button {
  display:inline-block;
  /* color:var(--color-theme-blue); */
  border:0;
  border-radius: 2px 2px 0 0;
  background:var(--color-theme-orange);
  cursor:pointer;
  vertical-align: baseline;
  /* max-width: 100px; */
  padding: .5em 1em;
  margin: 0;
  text-align: center;
}

.tabLabels .predictTab {
  background: var(--color-theme-darkgray);
  color: white;
}

.tabLabels .active {
  border-top: 3px solid;
}

.tabContent {
  padding: 0;
  width: 100%;
}

.predictionTab {
  background: var(--color-theme-darkgray);
  color: #DDD;
}

.shareTab {
  background: var(--color-theme-orange);
}

</style>