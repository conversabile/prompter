<script>
	import { env } from '$env/dynamic/public';

	import PromptChainEditor from '../../../components/chainEditor/PromptChainEditor.svelte';
	export let data;
	const title = data.promptChain ? data.promptChain.title : "New Prompt";
</script>

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
		/* flex: 0.6; */
	}
</style>