<script lang="ts">
	import { RestProxyService, readLocalSettingsDict, setLocalSettings, userSettings } from "$lib/userSettings";
	import { page } from '$app/stores';

    function handleProxyUpdate(e: any) {
        let localSettings = readLocalSettingsDict();
            if (! localSettings['restProxy']) localSettings['restProxy'] = {};
            localSettings['restProxy']['service'] = e.target.value;
            setLocalSettings(localSettings);
    }
</script>

<table>
    <tr>
        <th>Proxy service</th>
        <td>
            <select value={$userSettings.restProxy.service} on:change={handleProxyUpdate}>
                <option value={RestProxyService.internal} disabled>{$page.url.hostname} (coming soon)</option>
                <option value={RestProxyService.corsyproxy}>corsyproxy.io</option>
            </select>
        </td>
    </tr>
</table>
