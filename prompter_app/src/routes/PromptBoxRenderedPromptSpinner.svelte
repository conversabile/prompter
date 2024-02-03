<script lang="ts">
	import { faSpinner } from "@fortawesome/free-solid-svg-icons";
	import Fa from "svelte-fa";
</script>

<span class="previousResult spinner">
    <Fa icon={faSpinner} spin />
</span>

<style>
.previousResult {
    margin-left: .5em;
}
</style>