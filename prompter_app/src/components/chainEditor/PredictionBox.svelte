<script lang="ts">
import { parameterNameList, StepType, type PromptChain, type PromptStep, type RestStep } from "$lib/chains/chains";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
// import { faOpenai } from "@fortawesome/free-brands-svg-icons";

/* 
* TODO:
*  - DONE persist predictions in saved prompts
*  - DONE persist api key in local storage
*  - syntax highlighting
*  - DONE prediction box is hidden initially
*  - DONE handle openapi errors
*  - DONE sanitize uuid params in /p/<UUID>
*/
import Fa from "svelte-fa";
import { Clock } from "svelte-loading-spinners";
import { userSettings } from "$lib/userSettings";
import { RunStatus, errorStatus, type StepRunStatus } from "$lib/prediction/chain";
import { PromptStepPredictor, type LLMStreamedTokenData } from "$lib/prediction/promptStep";
import { runRestStep, type RenderedRestStep } from "$lib/chains/rest";
import { editorSession, renderedSteps } from "$lib/editorSession";
	import type { RenderedPrompt } from "$lib/chains/prompts";

let chainParameters: string[];
$: chainParameters = parameterNameList($editorSession.promptChain);

let isPredicting: boolean = false;

async function handlePredict() {
  if (isPredicting) return;
  isPredicting = true;

  for (let step of $editorSession.promptChain.steps) {
    step.results = null;
    $editorSession.predictionStatus[step.resultKey] = {
      status: RunStatus.onHold,
      error: null
    }
  }

  let stepRunError = null;
  for (let step of $editorSession.promptChain.steps) {
    console.log("Predicting ", step.resultKey);
    $editorSession.predictionStatus[step.resultKey] = {status: RunStatus.inProgress, error: null};
    
    if (stepRunError) {
      $editorSession.predictionStatus[step.resultKey] = {status: RunStatus.skipped, error: null};
    } else {
      try {

        if (step.stepType == StepType.prompt) {
          const predictor = new PromptStepPredictor(
            step as PromptStep,
            ($renderedSteps[step.resultKey] as RenderedPrompt).prompt.text,
            $userSettings,
            () => {$editorSession.promptChain = $editorSession.promptChain;}, // onPredictionStart
            (data: LLMStreamedTokenData) => {$editorSession.promptChain = $editorSession.promptChain;}  // onStreamedToken
          )
          await predictor.predict();
          
        } else if (step.stepType == StepType.rest) {
          await runRestStep(step as RestStep, $renderedSteps[step.resultKey] as RenderedRestStep);
          $editorSession.promptChain = $editorSession.promptChain;

        } else {
          throw Error("Not implemented");
        }
      } catch(err: any) {
        stepRunError = err
      }

      if (stepRunError) {
        $editorSession.predictionStatus[step.resultKey] = errorStatus(stepRunError);
      } else {
        $editorSession.predictionStatus[step.resultKey] = {status: RunStatus.success, error: null};
      }
    }

  }

  isPredicting = false;
}


</script>

<div class="grid">

    <!-- Parameter value table -->
    {#if chainParameters.length > 0}
      <div class="paramTableCell">
          <table class="paramTable">
            <tr>
                <th class="min">Param Name</th> <th>Param Value</th>
            </tr>
            {#each chainParameters as paramName}
                    <tr>
                        <td class="min"><span class="paramName">{paramName}</span></td>
                        <td> <input type="text" bind:value={$editorSession.promptChain.parametersDict[paramName]}> </td>
                    </tr>
            {/each}
        </table>
      </div>
    {/if}

    <!-- Predict Button -->
    <div class="predictButtonCell">
        {#if ! isPredicting}
            <button
              class="button runButton"
              title="Run prediction"
              on:click={handlePredict}
            ><Fa icon={faPlay}/> Run</button>
        {:else}
            <div style="display:inline-block; margin: 1em 0 0 0;"><Clock size="30" color="var(--color-B-text-standard)" unit="px" duration="10s" /></div>
        {/if}
    </div>
</div>

<style>
.grid {
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin: 1em 0;
}

.grid .paramTableCell {
  flex: 1 0 75%;
  padding: 0 1em;
}

.grid .predictButtonCell {
  flex: 1 0 15%;
  text-align: center;
  padding-right: 1em;
}

.paramTable {
  width: 100%;
  padding:1em;
  background: var(--color-B-lightbg);
}

.paramTable th {
  text-align:left;
  padding-bottom: 1em;
}

.paramTable input {
  width: calc(100% - 1em);
  padding:0.5em;
}

.paramTable .min {
  width: 15%;
  white-space: nowrap;
}

.paramName {
  font-family: monospace;
  font-weight: bold;
}

.runButton {
  border: 1px solid var(--color-A-bg);
  background-color: var(--color-A-bg);
  color: black;
  margin: 1em 0 0 0;
}

</style>