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
      prompt_text: "Tell me a short (less than {{ maxWords }} words) story about {{ storyTopic }}.\n\n{% if anotherTopic %}\nAnd another one about {{ anotherTopic | upper }}!!!\n{% endif %}",
      parameters_dict: {storyTopic: "time travelling", maxWords: "50"},
      title:  chainTitle,
      predictions: null
    }]
  }
  let renderedPromptText: string;
  export let isShared: boolean = false;   // Show "Share" tab with permalink
  export let chainId: string | null = null;
  export let editKey: string | null = null;

  let activeTab = (isShared) ? "share" : "prediction";

  import Fa from 'svelte-fa'
  import { faPlay, faSave, faClone, faShare } from '@fortawesome/free-solid-svg-icons'
	import PredictionBox from './PredictionBox.svelte';
	import ShareBox from './ShareBox.svelte';
  
</script>
{isShared}

<PromptBox
    bind:prompt = {promptChain.prompts[0]}
    bind:paramDict = {promptChain.prompts[0].parameters_dict}
    bind:renderedPromptText = {renderedPromptText}
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
}

.tabLabels button {
  display:inline-block;
  /* color:var(--color-theme-blue); */
  border:0;
  border-radius: 2px 2px 0 0;
  background:var(--color-theme-orange);
  cursor:pointer;
  vertical-align:middle;
  /* max-width: 100px; */
  padding: 1em;
  margin: 0;
  text-align: center;
}

.tabLabels .predictTab {
  background: var(--color-theme-darkgray);
  color: white;
}

.tabLabels .active {
  border-top: 2px solid;
}

/* #predictButton {
  color: #DDD;
  background: var(--color-theme-darkgray);
  border: 1px solid var(--color-theme-darkgray);
}

#predictButton:hover {
  border: 1px solid white;
  color: white;
} */

.tabContent {
  padding: 1em;
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