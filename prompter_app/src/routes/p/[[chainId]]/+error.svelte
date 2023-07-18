<script>
  import { page } from '$app/stores';
  let message = $page.error ? $page.error.message : "";
</script>

<h1>😢</h1>
<h2>{$page.status}</h2>
<p>{message}</p>

<style>
    h1 {
        color: white;
        font-size: 4em;
        margin-bottom: 0;
    }

    h2 {
        text-align: center;
        font-size: 3em;
        margin: 0;
        font-weight: bold;
        color: orange;
        font-family: monospace;
    }

    p {
        color: white;
        text-align: center;
        font-family: monospace;
        font-size: 1.5em;
    }
</style>