import { StepType, type PromptChain, type EmbeddingCache } from "./chains";
import { getSegments, type DocumentIndexStep, getCacheDocumentHasher, getEmbeddingModelSpecString } from "./documentIndex";

// TODO: move other util functions here

/**
 * Prompt chains accumulate more information than needed while being edited.
 * This function prunes redundant information, namely:
 * 
 * - Parameter dict entries that are not referenced in prompts are removed. (to be implemented)
 * - Embedding cache entries that are not matched in document index segments are removed
 * 
 * @param promptChain Any prompt chain
 */
export async function pruneChain(promptChain: PromptChain) : Promise<PromptChain> {
    // Prune parameter dict
    // TODO: implement
  
  
    // Prune unusued embeddings from cache (note that query embeddings are not cached)
    let prunedCache: EmbeddingCache = {}; // TODO: consider pruning in place to optimize memory
    let hasher = await getCacheDocumentHasher();
    promptChain.steps.forEach(step => {
      if (step.stepType == StepType.documentIndex) {
        const docIndexStep: DocumentIndexStep = step as DocumentIndexStep;
        const modelSpec: string = getEmbeddingModelSpecString(docIndexStep);
        if (modelSpec in promptChain.embeddingCache) {
            if (! (modelSpec in prunedCache)) prunedCache[modelSpec] = {};
            Object.values(getSegments(step as DocumentIndexStep)).forEach(segments => {
                segments.forEach(s => {
                    const sHash = hasher.hash(s);
                    const sCached = promptChain.embeddingCache[modelSpec][sHash];
                    if (sCached) prunedCache[modelSpec][sHash] = sCached;
                    // console.log("pruning: ", sCached, sHash, s);
                })
            })
        }
      }
    });
    promptChain.embeddingCache = prunedCache;
  
    return promptChain;
  }