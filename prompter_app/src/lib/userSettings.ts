import { defaultServiceSettings } from "./services";

import { writable } from "svelte/store";
import type { ServiceSettings } from "./services";

export enum RestProxyService {
    internal = "internal",
    corsyproxy = "corsyproxy"
}
export interface RestProxySettings {
    service: RestProxyService
}

export interface LocalUserSettings {
    predictionService: ServiceSettings,
    restProxy: RestProxySettings
}

export function readLocalSettings(): LocalUserSettings {
    return {
        predictionService: {
            ...defaultServiceSettings(),
            ...readLocalSettingsDict().predictionService
        },
        restProxy: {
            service: RestProxyService.corsyproxy,
            ...readLocalSettingsDict().restProxy
        }
    }
}

export function readLocalSettingsDict() {
    let settingsString = null;
    try {
        settingsString = localStorage.getItem("anonymousUserSettings");
    } catch(e) {}
    return settingsString ? JSON.parse(settingsString) : {};
}

export function setLocalSettings(newSettings: LocalUserSettings) {
    localStorage.setItem("anonymousUserSettings", JSON.stringify(newSettings));
}

export const userSettings = writable<LocalUserSettings>(readLocalSettings());
