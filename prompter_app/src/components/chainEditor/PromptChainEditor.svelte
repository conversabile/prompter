<script lang="ts">
	import { env } from '$env/dynamic/public';
  import { type PromptChain, areChainsEquivalent, piledParameterDict, StepType } from '$lib/chains/chains';
  import Fa from 'svelte-fa'
  import { faPlay, faShare, faCircle, faPlus } from '@fortawesome/free-solid-svg-icons'
	import StepBox from './StepBox.svelte';
	import PredictionBox from './PredictionBox.svelte';
	import ShareBox from './ShareBox.svelte';
	import Button from '../Button.svelte';
	import { addChainStep, editorSession, getDefaultChain } from '$lib/editorSession';
	import AddStepPlaceholder from './AddStepPlaceholder.svelte';

  export let promptChain: PromptChain | null = null;
  editorSession.set({
    promptChain: promptChain ?? getDefaultChain(),
    predictionStatus: {}
  });
  $: $editorSession.promptChain.parametersDict = piledParameterDict($editorSession.promptChain);
  let lastSavedPromptChain: PromptChain = JSON.parse(JSON.stringify($editorSession.promptChain));
  let userEditedChain: boolean;
  $: userEditedChain = ! areChainsEquivalent(JSON.parse(JSON.stringify($editorSession.promptChain)), lastSavedPromptChain);

  export let isShared: boolean = false;   // Show "Share" tab with permalink
  export let chainId: string | null = null;
  export let editKey: string | null = null;

  let activeTab = (isShared) ? "share" : "prediction";
  
  let titleAsterisk: string;
  $: titleAsterisk = (userEditedChain) ? "* " : "";

  let addFirstStep: boolean = false;
  let addStepAfter: Set<string> = new Set();
  function handleAddStep(position: number) {
    if (position == 0) {
      addFirstStep = true;
    } else {
      addStepAfter.add($editorSession.promptChain.steps[position-1].resultKey);
    }
    addStepAfter = addStepAfter;
  }

  function cancelAddStep(position: number) {
    if (position == 0) {
      addFirstStep = false;
    } else {
      addStepAfter.delete($editorSession.promptChain.steps[position-1].resultKey);
    }
    addStepAfter = addStepAfter;
  }

  let easeInSteps = $editorSession.promptChain.steps.map(() => {return false;});
  function saveNewStep(position: number, stepType: StepType) {
    cancelAddStep(position);
    addChainStep(position, stepType);
    easeInSteps = $editorSession.promptChain.steps.map(() => {return false;});
    easeInSteps[position] = true;
    $editorSession.promptChain = $editorSession.promptChain;
  }
</script>

<svelte:head>
	<title>{titleAsterisk}{$editorSession.promptChain.title} - {env.PUBLIC_SITE_NAME}</title>
	<meta name="description" content="A web UI to edit and share LLM prompts" />
</svelte:head>

{#if addFirstStep}
  <AddStepPlaceholder
    handleCancel={() => {cancelAddStep(0)}}
    handleConfirm={(stepType) => {saveNewStep(0, stepType);}}  
  />
{:else}
<div class="addPromptContainer">
  <Button icon={faPlus} title="Add step here" size="medium" style="A" onClick={() => {handleAddStep(0)}}/>
</div>
{/if}

{#each [...$editorSession.promptChain.steps.keys()] as i}

<StepBox
    bind:step = {$editorSession.promptChain.steps[i]}
    bind:stepChainPosition = {i}
    bind:easeIn = {easeInSteps[i]}
    easeOut={false}
/>

{#if addStepAfter.has($editorSession.promptChain.steps[i].resultKey)}
  <AddStepPlaceholder
    handleCancel={() => {cancelAddStep(i+1);}}
    handleConfirm={(stepType) => {saveNewStep(i+1, stepType);}}
  />
{:else}
  <div class="addPromptContainer">
    <Button icon={faPlus} title="Add step here" size="medium" style="A" onClick={() => {handleAddStep(i+1)}}/>
  </div>
{/if}
  
{/each}


<div class="tabLabels">
  <button class="predictTab" class:active={activeTab == "prediction"} title="Predict prompt on its configured LLM service" on:click={() => activeTab = "prediction"}>
    <Fa icon={faPlay} /> Predict
  </button><button title="Generate permalinks to your prompt" class:active={activeTab == "share"} on:click={() => activeTab = "share"}>
    <Fa icon={faShare} /> Share{#if userEditedChain}<span class="editedCircle" title="Prompt has unsaved edits">&nbsp;&nbsp;<Fa icon={faCircle} /> </span>{/if}
  </button>
</div>

<div class="predictionTab tabContent" class:hidden={activeTab != "prediction"}>
  <PredictionBox />
</div>

<div class="shareTab tabContent" class:hidden={activeTab != "share"}>
  <ShareBox
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
  /* color:var(--color-A-text-highlight-1); */
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
  border: 1px dashed var(--color-base-text);
  background: transparent;
  color: var(--color-base-text);
}

:global(.addPromptContainer:hover button) {
  background: var(--color-base-text);
  border: 1px solid var(--color-base-bg);
  color: var(--color-base-bg);
}

</style>