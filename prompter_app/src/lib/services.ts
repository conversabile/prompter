export enum PredictionService {
    openai = "openai",
    ollama = "ollama",
}

export const ENABLED_SERVICES = [PredictionService.openai, PredictionService.ollama];
export const ENABLED_EMBEDDING_SERVICES = [PredictionService.openai, PredictionService.ollama];

export const LLM_SERVICE_NAMES: Record<PredictionService, string> = {
    "openai": "OpenAI",
    "ollama": "Ollama",
}

export const OPENAI_MODELS = [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
    "gpt-4"
];

export const OPENAI_EMBEDDING_MODELS = [
    "text-embedding-3-small",
    "text-embedding-3-large",
    "text-embedding-ada-002"
]

export interface PredictionSettings {
    openai: GeneralPredictionSettings,
    ollama: GeneralPredictionSettings,
}

export interface GeneralPredictionSettings {
    modelName: string;
}

export interface ServiceSettings {
    openai: OpenaiServiceSettings;
    ollama: OllamaServiceSettings;
}

export interface OpenaiServiceSettings {
    apiKey: string;
}

export interface OllamaServiceSettings {
    server: string;
}

export function defaultPredictionSettings(): PredictionSettings {
    return {
        openai: {modelName: "gpt-3.5-turbo"},
        ollama: {modelName: "llama2"}
    }
}

export function defaultEmbeddingSettings(): PredictionSettings {
    return {
        openai: {modelName: "text-embedding-3-small"},
        ollama: {modelName: "nomic-embed-text"}
    }
}


export function defaultServiceSettings(): ServiceSettings {
    return {
        openai: {apiKey: ""},
        ollama: {server: "http://localhost:11434"}
      }
}