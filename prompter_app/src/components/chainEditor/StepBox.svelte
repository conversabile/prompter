<script lang="ts">
  import { tick } from 'svelte';
  import StepBoxHeader from './StepBoxHeader.svelte';

  // Model
  export let step: Step;
  export let promptChain: PromptChain;
  export let stepChainPosition: number;
  export let paramDict: Record<string, string>;
  export let renderedPrompts: Record<string, string>; // Will be read from outside to make predictions
  export let predictionStatus: Record<string, StepRunStatus>;
  export let easeIn: boolean = false;
  export let easeOut: boolean = false;
  let noTransition: boolean = false;

  let promptStep: PromptStep | null;
  $: promptStep = (step.stepType == StepType.prompt) ? (step as PromptStep) : null;
  $: restStep = (step.stepType == StepType.rest) ? (step as RestStep) : null;

  let thisComponent = get_current_component();
  let stepConfigurationMenuOpen: boolean;

  $: if (easeIn) {tick().then(() => { easeIn = false;})}

  const easeInOutTime: number = 200; // (ms) ! Has to match CSS !

	import Fa from 'svelte-fa';
	import { faCircleExclamation, faGear, faPlug, faRobot, faWarning} from '@fortawesome/free-solid-svg-icons';
	import { get_current_component } from 'svelte/internal';
	import { deleteChainStep } from '$lib/chainEditor';
	import { StepType, type PromptChain, type PromptStep, type Step, type RestStep, stepParameterNameList } from '$lib/chains/chains';
	import type { StepRunStatus } from '$lib/prediction/chain';
	import PromptContent from './steps/PromptContent.svelte';
	import PromptConfiguration from './steps/PromptConfiguration.svelte';
	import RestConfiguration from './steps/RestConfiguration.svelte';
	import RestContent from './steps/RestContent.svelte';
  
  export function handleDeleteStep() {
    easeOut = true;               // Prompt box slides away
    setTimeout(() => {
      deleteChainStep(promptChain, stepChainPosition);
      noTransition = true;        // Block animations
      easeOut = false;            // Prompt box back in (svelte will recycle the component, updating its state to contain another prompt)
      promptChain = promptChain;  // Force re render
      tick().then(()=>{
        noTransition = false;
      });                         // After render, re-enable animations
      // promptChain = promptChain;
    }, easeInOutTime);
  }
</script>

<div class="stepBox" class:minimized={step.minimized} class:easeIn={easeIn} class:easeOut={easeOut} class:noTransition={noTransition}>
  <StepBoxHeader
    bind:step
    bind:promptChain
    bind:stepChainPosition
    bind:stepConfigurationMenuOpen
    bind:predictionStatus
    parentStepBox={thisComponent}
  >
    <!-- Configuration Menu (should be conditional, but https://github.com/sveltejs/svelte/pull/8304) -->
    <svelte:fragment slot="configurationMenu">
      {#if promptStep}
        <PromptConfiguration
          bind:service={promptStep.predictionService}
          bind:settings={promptStep.predictionSettings}
        />
      {:else if restStep}
        <RestConfiguration />
      {/if}
    </svelte:fragment>
    
    <!-- <PromptConfiguration
        bind:open={stepConfigurationMenuOpen}
        bind:service={promptStep.predictionService}
        bind:settings={promptStep.predictionSettings}
        slot="configurationMenu"
      /> -->
  </StepBoxHeader>

  <div class="stepContent">
    {#if (promptStep)}
      <PromptContent
        bind:prompt={promptStep}
        bind:promptChain
        bind:paramDict
        bind:predictionStatus
        bind:renderedPrompts
      />
    {:else if (restStep)}
      <RestContent 
        bind:restStep
      />
    {/if}
  </div>


  <footer>
    {#if promptStep && promptStep.results}
      <div class="stepResult">
        <p><span class="icon"><Fa icon={faRobot} /></span> <span class="resultKey">{step.resultKey}</span> {#if promptStep.results[0].renderedPrompt != renderedPrompts[step.resultKey]} <span class="warning"><Fa icon={faWarning} /> This prediction was made with a different version of the prompt</span>{/if}</p><p>{promptStep.results[0].resultRaw}</p>
      </div>
    {:else if step && step.results}
    <div class="stepResult">
      <p><span class="icon"><Fa icon={faPlug} /></span> <span class="resultKey">{step.resultKey}</span> <p>{step.results[0].resultRaw}</p>
    </div>
    {/if}

    {#if predictionStatus[step.resultKey] && predictionStatus[step.resultKey].error}
      <div class="stepResult predictionError">
        <span class="message">
          <Fa icon={faCircleExclamation} />
          {predictionStatus[step.resultKey].error}
          <a href={null} 
           on:click={() => {stepConfigurationMenuOpen = true}}
           style="color:black; font-weight:bold; cursor: pointer;"
          >[→ Configure <Fa icon={faGear} />]</a>
        </span>
      </div>
    {/if}
  </footer>
</div>

<style>
.stepBox {
  width:100%;
  background: var(--color-A-bg);
  color: var(--color-A-text-standard);
  margin:1em 0 0 0;
  padding:0;
  border-radius: 5px;
  border: 1px solid;

  transition-timing-function: ease-in;
  transition: 0.2s;
}

.easeIn {
  /* Display outside viewport. Will slide in when class is removed */
  transform: translateX(-200%);
  transition: none;
}

.easeOut {
  /* Will slide block outside viewport when applied */
  transform: translateX(-200%);
  transition: 0.2s;
}

.noTransition {
  transition: none;
}

.stepBox.minimized .stepContent, .stepBox.minimized footer {
  display: none;
}

/* Result */

.stepBox p {
  margin: 1em;
}

.stepResult {
  /* border: 1px solid var(--color-A-text-highlight); */
  border-top: 1px solid rgba(0, 0, 0, 0.25);
  background: var(--color-bg-alphawhite25);
  padding: 1em;
  white-space: pre-wrap;
  font-family: monospace;
  border-radius: 0 0 5px 5px;
  /* display: flex; */
}

.stepResult .resultKey {
  font-weight: bold;
}

.stepResult .icon {
  display: inline-block;
}

.stepResult .warning {
  font-size: .8em;
  font-style: italic;
  color: rgba(0, 0, 0, 0.5);
}

.predictionError {
  color: #b03232;
  text-align: center;
  display: flex;
}

.predictionError .message {
  width: 100%;
  display: inline-block;
  margin: auto;
}
</style>
