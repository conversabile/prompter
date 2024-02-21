<script lang="ts">
  import { editorSession, moveChainStep } from '$lib/editorSession';
  import { isValidParamName, StepType, type PromptChain, type PromptStep, type Step, STEP_TYPE_DATA } from '$lib/chains/chains';
  import { RunStatus, type StepRunStatus } from '$lib/prediction/chain';
  import { LLM_SERVICE_NAMES } from '$lib/services';
  import { faAngleDown, faAngleUp, faArrowDown, faArrowUp, faCircleExclamation, faDownLeftAndUpRightToCenter, faHourglass, faKey, faRobot, faSpinner, faTrashCan, faUpRightAndDownLeftFromCenter, faXmark, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
  import Fa from 'svelte-fa';

  export let step: Step;
  export let promptChain: PromptChain;
  export let stepChainPosition: number;
  export let stepConfigurationMenuOpen: boolean;
  export let parentStepBox: any;

  let promptStep: PromptStep | null = null;
  $: promptStep = (step.stepType == StepType.prompt) ? (step as PromptStep) : null;

  let stepIcon: IconDefinition
  $: stepIcon = STEP_TYPE_DATA[step.stepType].icon;
  let stepIconSpin: boolean = false;
  $: if ($editorSession.predictionStatus[step.resultKey]) {
    let status = $editorSession.predictionStatus[step.resultKey].status;
    if (status == RunStatus.success) {stepIcon = faRobot; stepIconSpin = false;}
    if (status == RunStatus.inProgress) {stepIcon = faSpinner; stepIconSpin = true;}
    if (status == RunStatus.error) {stepIcon = faCircleExclamation; stepIconSpin = false;}
    if (status == RunStatus.skipped) {stepIcon = faXmark; stepIconSpin = false;}
    if (status == RunStatus.onHold) {stepIcon = faHourglass; stepIconSpin = false;}
  }

  let stepConfigurationLabel: string;
  
  $: if (promptStep) {
    stepConfigurationLabel = LLM_SERVICE_NAMES[promptStep.predictionService] + " (" + promptStep.predictionSettings[promptStep.predictionService].modelName + ")";
  } else {
    stepConfigurationLabel = STEP_TYPE_DATA[step.stepType].label;
  }

  /**
   * Pressing "Enter" while editing title should de-focus the input element
   */
   function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key == "Enter" || e.key == "Escape") {
      e.preventDefault();
      try {
        if (e.target) (e.target as HTMLElement).blur();
      } catch (e) {
        throw(e);
      }
    }
  }

  /**
   * Handles 'beforeInput' and 'paste' events. Blocks edit if new value is not a valid variable name
   * @param e
   */
  function handleResultKeyEdit(e: any) {
    let newValue = (e.clipboardData) ? e.clipboardData.getData('text') : e.data;
    if (newValue && ! isValidParamName(newValue)) {
      e.preventDefault();
      return false;
    }
  }
</script>

<header>

    <a href={null}
      class="stepConfigurationLabel" 
      on:click={() => {stepConfigurationMenuOpen = ! stepConfigurationMenuOpen;}}
      title="{stepConfigurationLabel}"
  >
      <span class="label">
      <span><Fa icon={stepIcon} bind:spin={stepIconSpin} /></span>
      <span>{stepConfigurationLabel}</span>
      </span>
      <span class="expandButton">{#if stepConfigurationMenuOpen}<Fa icon={faAngleUp} />{:else}<Fa icon={faAngleDown} />{/if}</span>
  </a>

    <h2 class="stepTitle" contenteditable bind:innerText={step.title} on:keydown={handleTitleKeydown}>{step.title}</h2>

    <div class="stepResultKey" title="Result key. Use &#123;&#123; {step.resultKey} &#125;&#125; in other steps to reference the predicted result of this step.">
      <Fa icon={faKey} />
      <p contenteditable spellcheck="false"
       bind:innerText={step.resultKey}
       on:keydown={handleTitleKeydown}
       on:beforeinput={handleResultKeyEdit}
       on:paste={handleResultKeyEdit}
       on:blur={() => {promptChain = promptChain;}}>{step.resultKey}</p>
    </div>

    <div class="stepActions">
      {#if (stepChainPosition > 0)}
      <button on:click={() => {
        moveChainStep(stepChainPosition, stepChainPosition-1);
        promptChain = promptChain;
      }} title="Move up"><Fa icon={faArrowUp} /></button>{/if}
      {#if (stepChainPosition < promptChain.steps.length-1)}
      <button on:click={() => {
        moveChainStep(stepChainPosition, stepChainPosition+1);
        promptChain = promptChain;
      }} title="Move down"><Fa icon={faArrowDown} /></button>{/if}
      {#if (promptChain.steps.length > 1)}
      <button on:click={parentStepBox.handleDeleteStep} title="Delete step"><Fa icon={faTrashCan} /></button>{/if}
      <button on:click={() => {step.minimized = ! step.minimized}}><Fa icon={step.minimized ? faUpRightAndDownLeftFromCenter : faDownLeftAndUpRightToCenter} />
      </button>
    </div>
  </header>

  {#if stepConfigurationMenuOpen}
    <div class="modal" on:click={() => {stepConfigurationMenuOpen = false;}}></div>

    <div class="configurationMenu">
      <slot name="configurationMenu" />
    </div>
  {/if}
  
<style>

header {
  background-color: var(--color-bg-alphawhite25);

  display: flex;
  flex-direction: row;
  align-items: stretch;

  border-radius: 5px 5px 0 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.75);
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
}

/* Menu button */

.stepConfigurationLabel {
  background: var(--color-B-bg);
  color: var(--color-B-text-standard);
  /* height: 100%; */
  display: flex;
  align-items: center;
  line-height: 1.5em;
  font-size: .8em;
  padding: .5em;
  font-family: monospace;
}

.stepConfigurationLabel:hover {
  background-color: var(--color-B-lightbg);
  color: var(--color-B-text-highlight);
  cursor: pointer;
  text-decoration: none;
}

.stepConfigurationLabel .label {
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 20vw;
  display: inline-block;
  white-space: nowrap;
  line-height: 1.5em;
  vertical-align: middle;
}

.stepConfigurationLabel .expandButton {
  display: inline-flex;
  line-height: 1em;
  vertical-align: middle;
  margin-left: .5em;
}


header .stepTitle {
  display: inline-block;
  flex: 1;
  line-height: 1rem;
  margin: 0;
  padding: 0 .5em;

  text-transform: none;
  font-size: 0.9em;
  font-weight: normal;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
}

header .stepTitle:focus {
  background-color: white;
  border: 0;
  cursor: inherit;
  font-weight: normal;
}

header .stepResultKey {
  display: flex;
  align-items: center;
  padding-left: .5em;
  font-size: .8em;
  border-left: 1px solid rgba(0, 0, 0, 0.25);
}

header .stepResultKey p {
  margin: 0;
  font-family: monospace;
  font-weight: bold;
  padding: .5em;
  /* display: flex;
  align-items: center; */
  cursor: pointer;

  max-width: 20vw;
  overflow: hidden;
  text-overflow: ellipsis;
}

header .stepResultKey p:focus {
  background-color: white;
  cursor: inherit;
  font-weight: normal;
}

header .stepActions {
  display: flex;
}

header .stepActions button {
  font-size: .8em;
  line-height: 1.5em;
  margin: 0;
  border-radius: 0;
  border: 0;
  border-left: 1px solid rgba(0, 0, 0, 0.25);
  background: none;
  padding: .25em 0;
  width: 1.9em;
  color: rgba(0, 0, 0, 0.75);
  cursor: pointer;
}

header .stepActions button:hover {
  color: black;
}

/* Configuration menu */

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

.configurationMenu {
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
</style>