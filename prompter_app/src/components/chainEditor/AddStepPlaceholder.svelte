<script lang="ts">
	import { faBook, faCommentDots, faFilePdf, faPlug, faRoad, faRobot } from "@fortawesome/free-solid-svg-icons";
	import Button from "../Button.svelte";
	import { StepType } from "$lib/chains";

    export let handleCancel: () => void;
    export let handleConfirm: (stepType: StepType) => void;

    const STEP_TYPES = [
        {
            stepType: StepType.prompt,
            label: "Prompt",
            icon: faRobot,
        },
        // {
        //     stepType: StepType.rest,
        //     label: "API Call",
        //     icon: faPlug,
        // },
        // {
        //     stepType: StepType.documentIndex,
        //     label: "Document Index",
        //     icon: faBook,
        // }
    ];

    const STEP_DESCRIPTIONS: Record<string, string> = {
        prompt: "<strong>Prompt</strong> steps run natural language instructions on Large Language Models such as <strong>GPT</strong> or LLaMA. Other step results will be available as variables in your prompt using the powerful Jinja2 templating syntax, and you will also be able to add new variables that will be the parameters of your Link. <strong>Example</strong>: <em>Write a short story about {{ storyTopic }}</em>",
        rest: "<strong>API Call</strong> steps will run a request to a <strong>REST endpoint</strong>, and make the response available to other steps. <strong>Example</strong>: you can query the <a href='https://metmuseum.github.io/' target='_blank'>Metropolitan Museum API</a>, and then add a Prompt to answer questions on one of the museum's paintings."
    };

    let selectedStepType: StepType | null = null;
</script>

<div class="addStep">
    <div class="stepTypeSelector">

        {#each STEP_TYPES as stepType}
            <Button
                icon={stepType.icon}
                label={stepType.label}
                style="base"
                highlight={selectedStepType==stepType.stepType}
                onClick={() => {selectedStepType = stepType.stepType}}
            />&nbsp;
        {/each}
        {#if selectedStepType}
        <p class="stepExplanation">{@html STEP_DESCRIPTIONS[selectedStepType]}</p>            
        {/if}
    </div>

    <footer>
        <Button label="Cancel" style="base" rounded onClick={handleCancel} />
        <Button label="Add" style="base" highlight={selectedStepType != null} rounded onClick={() => {if (selectedStepType) handleConfirm(selectedStepType)}} />
    </footer>
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