<script lang="ts">
	import { env } from '$env/dynamic/public';
  import { type PromptChain, areChainsEquivalent, piledParameterDict } from '$lib/prompts';
  import PromptBox from './PromptBox.svelte';
  import Fa from 'svelte-fa'
  import { faPlay, faShare, faCircle, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons'
	import PredictionBox from './PredictionBox.svelte';
	import ShareBox from './ShareBox.svelte';
	import type { StepRunStatus } from '$lib/prediction/chain';
	import Button from '../Button.svelte';
	import { addChainStep, getDefaultChain } from '$lib/chainEditor';

  export let promptChain: PromptChain = getDefaultChain();
  $: promptChain.parametersDict = piledParameterDict(promptChain);
  let lastSavedPromptChain: PromptChain = JSON.parse(JSON.stringify(promptChain));
  let userEditedChain: boolean;
  $: userEditedChain = ! areChainsEquivalent(JSON.parse(JSON.stringify(promptChain)), lastSavedPromptChain);
  let renderedPrompts: Record<string, string> = {}; // Step resultKey -> rendered prompt text
  let predictionStatus: Record<string, StepRunStatus> = {}; // Step resultKey -> status

  export let isShared: boolean = false;   // Show "Share" tab with permalink
  export let chainId: string | null = null;
  export let editKey: string | null = null;

  let activeTab = (isShared) ? "share" : "prediction";
  
  let titleAsterisk: string;
  $: titleAsterisk = (userEditedChain) ? "* " : "";

  let easeInSteps = promptChain.steps.map(() => {return false;});
  function handleAddStep(position: number) {
    addChainStep(promptChain, position);
    easeInSteps = promptChain.steps.map(() => {return false;});
    easeInSteps[position] = true;
    promptChain = promptChain;
  }
</script>

<svelte:head>
	<title>{titleAsterisk}{promptChain.title} - {env.PUBLIC_SITE_NAME}</title>
	<meta name="description" content="A web UI to edit and share LLM prompts" />
</svelte:head>

<div class="addPromptContainer">
  <Button icon={faPlus} title="Add step here" size="medium" style="A" onClick={() => {handleAddStep(0)}}/>
</div>

{#each [...promptChain.steps.keys()] as i}

<PromptBox
    bind:prompt = {promptChain.steps[i]}
    bind:promptChain = {promptChain}
    bind:promptChainPosition = {i}
    bind:paramDict = {promptChain.parametersDict}
    bind:renderedPrompts = {renderedPrompts}
    bind:predictionStatus = {predictionStatus}
    bind:easeIn = {easeInSteps[i]}
    easeOut={false}
/>

<div class="addPromptContainer">
  <Button icon={faPlus} title="Add step here" size="medium" style="A" onClick={() => {handleAddStep(i+1)}}/>
</div>
  
{/each}


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
    bind:renderedPrompts={renderedPrompts}
    bind:predictionStatus={predictionStatus}
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

.addPromptContainer {
  margin-top: 1em;
  /* opacity: .75; */
  width: 100%;
  text-align: center;
}

/* .addPromptContainer:hover {
  opacity: 1;
} */

:global(.addPromptContainer button.styleA) {
  border-radius: 5px;
  border: 1px dashed var(--color-text);
  background: transparent;
  color: var(--color-text);
}

:global(.addPromptContainer:hover button) {
  background: var(--color-text);
  border: 1px solid var(--color-bg-0);
  color: var(--color-bg-0);
}

</style>