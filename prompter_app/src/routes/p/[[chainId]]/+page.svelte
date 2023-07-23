<script>
	import { env } from '$env/dynamic/public';

	import PromptChainEditor from '../../PromptChainEditor.svelte';
	export let data;
	const title = data.promptChain ? data.promptChain.prompts[0].title : "New Prompt";
</script>

<svelte:head>
	<title>{title} - {env.PUBLIC_SITE_NAME}</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	{#if data.promptChain }
		<PromptChainEditor
			chainId = {data.chainId}
			editKey = {data.editKey}
			isShared = {data.isShared}
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