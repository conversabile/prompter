<script>
	import PromptChainEditor from '../../PromptChainEditor.svelte';
	export let data;
	const title = data.promptChain ? data.promptChain.title : "New Prompt";
</script>

<svelte:head>
	<title>Conversabile Prompter - {title}</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	{#if data.promptChain }
		<PromptChainEditor
			promptChain = {data.promptChain}
		/>
	{:else}
		<PromptChainEditor />
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