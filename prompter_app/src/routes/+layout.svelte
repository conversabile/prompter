<script>
	import Header from './Header.svelte';
	import './styles.css';
	import { version } from '$app/environment';
</script>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>

	<footer>
		<p>Prompter v{version} • Made with <a href="https://kit.svelte.dev">SvelteKit</a> by <a href="https://www.conversabile.com">Conversabile</a> • <span><a href="https://github.com/conversabile/prompter/blob/main/LICENSE">License</a></span></p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		/* min-height: 100vh; */
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 4rem 1rem 1rem 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 12px;
		color: lightgray;
	}

	@media (min-width: 480px) {
		footer {
			padding: 12px 0;
		}
	}
</style>
