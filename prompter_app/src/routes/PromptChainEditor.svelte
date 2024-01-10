<script lang="ts">
	import { env } from '$env/dynamic/public';
  import { page } from '$app/stores';
  import { promptSchemaVersion, type PromptChain, type PromptPrediction, areChainsEquivalent } from '$lib/prompts';
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
  let lastSavedPromptChain: PromptChain = JSON.parse(JSON.stringify(promptChain));
  let userEditedChain: boolean;
  $: userEditedChain = ! areChainsEquivalent(JSON.parse(JSON.stringify(promptChain)), lastSavedPromptChain);
  let serviceSettingsPanelOpen: boolean = false;
  let renderedPromptText: string;
  export let isShared: boolean = false;   // Show "Share" tab with permalink
  export let chainId: string | null = null;
  export let editKey: string | null = null;

  let activeTab = (isShared) ? "share" : "prediction";

  import Fa from 'svelte-fa'
  import { faPlay, faShare, faCircle } from '@fortawesome/free-solid-svg-icons'
	import PredictionBox from './PredictionBox.svelte';
	import ShareBox from './ShareBox.svelte';
	import { PredictionService, defaultPredictionSettings, type ServiceSettings } from '$lib/services';
  
  let titleAsterisk: string;
  $: titleAsterisk = (userEditedChain) ? "* " : "";
</script>

<svelte:head>
	<title>{titleAsterisk}{chainTitle} - {env.PUBLIC_SITE_NAME}</title>
	<meta name="description" content="A web UI to edit and share LLM prompts" />
</svelte:head>

<PromptBox
    bind:prompt = {promptChain.prompts[0]}
    bind:paramDict = {promptChain.prompts[0].parametersDict}
    bind:renderedPromptText = {renderedPromptText}
    bind:serviceSettingsPanelOpen = {serviceSettingsPanelOpen}
/>

<div class="tabLabels">
  <button class="predictTab" class:active={activeTab == "prediction"} title="Predict prompt on its configured LLM service" on:click={() => activeTab = "prediction"}>
    <Fa icon={faPlay} /> Predict
  </button><button title="Generate permalinks to your prompt" class:active={activeTab == "share"} on:click={() => activeTab = "share"}>
    <Fa icon={faShare} /> Share{#if userEditedChain}<span class="editedCircle" title="Prompt has unsaved edits">&nbsp;&nbsp;<Fa icon={faCircle} /> </span>{/if}
  </button>
</div>

<div class="predictionTab tabContent" class:hidden={activeTab != "prediction"}>
  <PredictionBox
    bind:promptChain={promptChain}
    bind:renderedPromptText={renderedPromptText}
    bind:serviceSettingsPanelOpen={serviceSettingsPanelOpen}
  />
</div>

<div class="shareTab tabContent" class:hidden={activeTab != "share"}>
  <ShareBox
    bind:promptChain={promptChain}
    bind:lastSavedPromptChain={lastSavedPromptChain}
    bind:isShared={isShared}
    bind:chainId={chainId}
    bind:editKey={editKey}
  />
</div>

<style>

.hidden {
  display: none;
}

.tabLabels {
  margin: 1em 0 0 0;
  border: 0;
  text-align: left;
  width: 100%;
}

.tabLabels button {
  display:inline-block;
  /* color:var(--color-A-text-highlight); */
  border:0;
  border-radius: 2px 2px 0 0;
  background:var(--color-A-bg);
  cursor:pointer;
  vertical-align: baseline;
  /* max-width: 100px; */
  padding: .5em 1em;
  margin: 0;
  text-align: center;
}

.tabLabels .predictTab {
  background: var(--color-B-bg);
  color: white;
}

.tabLabels .active {
  border-top: 3px solid;
}

.tabContent {
  padding: 0;
  width: 100%;
  border-radius: 0 5px 5px 5px;
}

.predictionTab {
  background: var(--color-B-bg);
  color: var(--color-B-text-standard);
}

.shareTab {
  background: var(--color-A-bg);
  color: var(--color-A-text-standard)
}

.editedCircle {
  font-size: 0.4em;
  vertical-align: top;
}

</style>