<script>
	import PromptBox from '../../PromptBox.svelte';
	export let data;
	const title = data.promptRecord ? data.promptRecord.title : "New Prompt";
</script>

<svelte:head>
	<title>Conversabile Prompter - {title}</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	{#if data.promptRecord }
		<PromptBox
			promptTitle = {data.promptRecord.title}
			promptText = {data.promptRecord.prompt_text}
			paramDict = {data.promptRecord.parameters_dict}
		/>
	{:else}
		<PromptBox />
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>