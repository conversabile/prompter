<script lang="ts">
	import { faBook, faCommentDots, faFilePdf, faPlug, faRoad, faRobot } from "@fortawesome/free-solid-svg-icons";
	import Button from "../Button.svelte";
	import { STEP_TYPE_DATA, StepType } from "$lib/chains/chains";

    export let handleCancel: () => void;
    export let handleConfirm: (stepType: StepType) => void;

    const STEP_TYPES = [StepType.prompt, StepType.rest, StepType.documentIndex];
    const STEP_DESCRIPTIONS: Record<StepType, string> = {
        [StepType.prompt]: "<strong>Prompt</strong> steps run natural language instructions on Large Language Models such as <strong>GPT</strong> or LLaMA. Just like ChatGPT, your prompts will produce a free-text answer, but you can also ask to generate JSON or code. <strong>Example</strong>: <em>Write a short story about {{ storyTopic }}</em>",
        [StepType.rest]: "<strong>API Call</strong> steps will run a request to a <strong>REST endpoint</strong>, and make the response available to other steps. <strong>Example</strong>: you can query the <a href='https://metmuseum.github.io/' target='_blank'>Metropolitan Museum API</a>, and then add a Prompt to answer questions on one of the museum's paintings.",
        [StepType.documentIndex]: "WIP: this feature is under development"
    };

    let selectedStepType: StepType | null = null;
</script>

<div class="addStep">
    <div class="stepTypeSelector">
        {#each STEP_TYPES as stepType}
            <Button
                icon={STEP_TYPE_DATA[stepType].icon}
                label={STEP_TYPE_DATA[stepType].label}
                style="base"
                highlight={selectedStepType==stepType}
                onClick={() => {selectedStepType = stepType}}
            />&nbsp;
        {/each}
        {#if selectedStepType}
        <p class="stepExplanation">{@html STEP_DESCRIPTIONS[selectedStepType]}</p>            
        {/if}
    </div>

    {#if selectedStepType}
        <footer>
            <Button label="Cancel" style="base" rounded onClick={handleCancel} />
            <Button label="Add" style="base" highlight rounded onClick={() => {if (selectedStepType) handleConfirm(selectedStepType)}} />
        </footer>
    {/if}
</div>

<style>
.addStep {
    width: calc( 100% - 4px );
    background: var(--color-base-bg);
    color: var(--color-base-text);
    margin: 1em 0 0 0;
    padding: 0;
    border-radius: 5px;
    border: 2px dashed;
}

.stepTypeSelector {
    padding: 1em;
    text-align: center;
}

footer {
    padding: 1em;
    text-align: center;
    border-top: 1px solid;
}
</style>