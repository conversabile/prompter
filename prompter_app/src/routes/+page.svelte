<script>
	import PromptBox from './PromptBox.svelte';
</script>

<svelte:head>
	<title>Conversabile Prompter</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<PromptBox />
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
