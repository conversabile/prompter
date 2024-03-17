import type { PromptStep } from "$lib/chains/prompts";
import { PredictionService } from "$lib/services";
import type { LocalUserSettings } from "$lib/userSettings";
import OpenAI from "openai";

export interface PromptStepPredictionResult {
    text: string
}

export interface LLMStreamedTokenData {
    token: string
}

export type OnStreamedTokenCallback = (token: LLMStreamedTokenData) => void;

export class PromptPredictionError extends Error {};

export class PromptStepPredictor {

    prompt: PromptStep
    renderedPrompt: string
    userSettings: LocalUserSettings
    onPredictionStart: (() => void) | null = null
    onStreamedToken: OnStreamedTokenCallback | null = null


    constructor(
        prompt: PromptStep,
        renderedPrompt: string,
        userSettings: LocalUserSettings,
        onPredictionStart: (() => void) | null = null,
        onStreamedToken: OnStreamedTokenCallback | null = null
    ) {
        this.prompt = prompt
        this.renderedPrompt = renderedPrompt
        this.userSettings = userSettings
        this.onPredictionStart = onPredictionStart
        this.onStreamedToken = onStreamedToken
    }

    async predict() : Promise<PromptStepPredictionResult> {
        if (this.prompt.predictionService == PredictionService.openai && ! this.userSettings.predictionService.openai.apiKey) {
          throw new PromptPredictionError("An OpenAI API key is needed to run the prediction request");
        }
      
        if (this.prompt.predictionService == PredictionService.ollama && ! this.userSettings.predictionService.ollama.server) {
          throw new PromptPredictionError("An Ollama server needs to be configured to run the prediction request");
        }
      
        this.prompt.results = null;
        if (this.onPredictionStart) this.onPredictionStart();
        // promptChain = promptChain; /* Triggers re-render (TODO: refactor) */
      
      
        if (this.prompt.predictionService == PredictionService.openai) {
          return await this.predictOpenai();
        }
      
        if (this.prompt.predictionService == PredictionService.ollama) {
          return await this.predictOllama();
        }

        throw new PromptPredictionError("Unsupported prediction service: " + this.prompt.predictionService);
      }
    
    async predictOpenai() : Promise<PromptStepPredictionResult> {
        // console.debug("predicting prompt with OpenAI: ", this.renderedPrompt);
        const openai = new OpenAI({
            apiKey: this.userSettings.predictionService.openai.apiKey,
            dangerouslyAllowBrowser: true, // We don't store the user's API key
        });
        const response = await openai.chat.completions.create({
            model: this.prompt.predictionSettings.openai.modelName,
            messages: [
                {"role": "user", "content": this.renderedPrompt}
            ],
            stream: true,
        });
        
        // Init prediction object
        if (! this.prompt.results) {
            this.prompt.results = [{
              datetime: new Date(),
              renderedPrompt:  this.renderedPrompt,
              resultRaw: "",
              resultJson: null,
              model: "openai-" + this.prompt.predictionSettings.openai.modelName
            }]
        }
    
        // Append chunks to prediction objects
        for await (const chunk of response) {
            let chunkStr = chunk.choices[0].delta.content ?? "";
            this.prompt.results[0].resultRaw = this.prompt.results[0].resultRaw.concat(chunkStr);
            if (this.onStreamedToken)this.onStreamedToken({token: chunkStr});
        }

        return {text: this.prompt.results[0].resultRaw}
    }

    async predictOllama() : Promise<PromptStepPredictionResult> {
        try {
          this.userSettings.predictionService.ollama.server = this.userSettings.predictionService.ollama.server.replace(/\/+$/, '');
          const response = await fetch(`${this.userSettings.predictionService.ollama.server.replace(/\/+$/, '')}/api/generate`, {
                  method: 'POST',
                  body: JSON.stringify({
              "model": this.prompt.predictionSettings.ollama.modelName,
              "prompt": this.renderedPrompt
            })
              })
      
          if (response.body) {
            // Init prediction object
            if (! this.prompt.results) {
              this.prompt.results = [{
                "datetime": new Date(),
                "renderedPrompt":  this.renderedPrompt,
                "resultRaw": "",
                "resultJson": null,
                "model": "ollama-" + this.prompt.predictionSettings.ollama.modelName
              }]
            }
            if (response.status != 200) {
              throw new Error("Ollama prediction request failed with status code " + response.status + " (" + await response.text() + ")");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done, value;
            while (!done) {
              ({ value, done } = await reader.read());
              const chunk = decoder.decode(value);
              if (chunk) {
                const token = JSON.parse(chunk)["response"] ?? "";
                if (token.trim() || this.prompt.results[0].resultRaw) { // First token is \n...
                  this.prompt.results[0].resultRaw = this.prompt.results[0].resultRaw.concat(token);
                  if (this.onStreamedToken) this.onStreamedToken({token: token});
                }
              }
            }

            return {text: this.prompt.results[0].resultRaw}
          }

          throw new PromptPredictionError("Ollama server returned empty body");
      
        } catch (err: any) {
          console.log("ollama error: ", err);
          if (err.response) {
            throw new PromptPredictionError("Ollama prediction request failed with status code " + err.response.status + " (" + err.response.statusText + ")");
          } else {
            throw err;
          }
        }
      }
}
