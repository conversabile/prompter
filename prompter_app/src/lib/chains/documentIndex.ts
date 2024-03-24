import type { RenderedTemplate } from "$lib/jinja";
import { PredictionService, type PredictionSettings, defaultEmbeddingSettings } from "$lib/services";
import OpenAI from "openai";
import { StepType, type Step, type StepResult } from "./chains";
import type { LocalUserSettings } from "$lib/userSettings";
import { CloseVectorEmbeddingsWeb, CloseVectorHNSWWeb } from "closevector-web";
import xxhash, { type XXHashAPI } from "xxhash-wasm";
import { get } from "svelte/store";
import { editorSession } from "$lib/editorSession";

export type DocumentId = string
export type QueryKey = string;

export interface IndexedDocument {
    id: DocumentId,
    text: string,
    segmentSize: number,
    segmentSeparator: string
}

export interface DocumentIndexQuery {
  key: QueryKey,
  text: string,
  maxResults: number
}

export interface DocumentIndexResultSegment {
  docId: DocumentId,
  text: string,
  score: number
}

export interface DocumentIndexResult extends StepResult {
  segments: Record<QueryKey, DocumentIndexResultSegment[]>
}

export interface DocumentIndexStep extends Step {
  documents: IndexedDocument[],
  queries: DocumentIndexQuery[],
  embeddingService: PredictionService,
  embeddingSettings: PredictionSettings,
  results?: DocumentIndexResult[] | null
}

//
// Util
//

export function getDefaultDocumentIndexStep(resultKey: string) : DocumentIndexStep {
    return {
      stepType: StepType.documentIndex,
      title:  "Untitled Document Index",
      resultKey: resultKey,
      results: null,
      minimized: false,

      documents: [
        {
            id: "fake-document.pdf",
            text: "This is the first segment.\n\nThis is the second segment.",
            segmentSize: 5,
            segmentSeparator: '\n\n'
        }
      ],
      queries: [{key: "query_0", text: "A character who could be involved in {{ storyTopic }}", maxResults: 5}],
      embeddingService: PredictionService.openai,
      embeddingSettings: defaultEmbeddingSettings()
    }
}

/**
 * Returns a `docId -> segments` map of segments per each document in the given index.
 * 
 * @param docIndexStep A Document Index step to build segments from
 * @returns The list of segments per each document in the index
 */
export function getSegments(docIndexStep: DocumentIndexStep) : Record<string, string[]> {
  let result: Record<string, string[]> = {};
  docIndexStep.documents.forEach((doc: IndexedDocument) => {result[doc.id] = doc.text.split(doc.segmentSeparator);});
  return result;
}

export function getEmbeddingModelName(docIndexStep: DocumentIndexStep) : string {
  return docIndexStep.embeddingSettings[docIndexStep.embeddingService].modelName
}

export function getEmbeddingModelSpecString(docIndexStep: DocumentIndexStep) : string {
  // ollama|gemma:7b
  return docIndexStep.embeddingService + '|' + getEmbeddingModelName(docIndexStep);
}

//
// Execution
//

export interface RenderedDocumentIndex {
  renderedQueries: Record<string, RenderedTemplate>,
}

export function getExportedDocIndexResults(docIndexStep: DocumentIndexStep) : Record<string, any> {
  let result: Record<string, any> = {};

  if (! docIndexStep.results) return result;

  let simplifiedResult: Record<string, string[]> = {}
  for (const queryKey in docIndexStep.results[0].segments) {
    simplifiedResult[queryKey] = docIndexStep.results[0].segments[queryKey].map((s) => {return s.text});
  }
  result[docIndexStep.resultKey] = simplifiedResult;
  result[docIndexStep.resultKey + "__details"] = docIndexStep.results[0].segments;
  return result;
}

export async function runDocumentIndexStep(
  docIndexStep: DocumentIndexStep,
  renderedStep: RenderedDocumentIndex,
  userSettings: LocalUserSettings,
) : Promise<DocumentIndexResult> {
  let allSegments = getSegments(docIndexStep);

  // Configure Embedding Class
  let cvEmbeddings: CloseVectorEmbeddingsWeb = new CloseVectorCustomEmbeddings(docIndexStep, userSettings);

  // Populate Vector Database
  let cvTexts: string[] = [];
  let cvMetadata: Record<string, string>[] = [];
  for (const docId in allSegments) {
    cvTexts = cvTexts.concat(allSegments[docId]);
    cvMetadata = cvMetadata.concat(Array(allSegments[docId].length).fill({docId: docId}));
  }
  let vectorDatabase = await CloseVectorHNSWWeb.fromTexts(cvTexts, cvMetadata, cvEmbeddings);

  // Run Queries
  let result: DocumentIndexResult = {
    datetime: new Date(),
    segments: {},
    resultRaw: "",
    resultJson: null
  }
  for (const queryKey in renderedStep.renderedQueries) {
    let cvResult = await vectorDatabase.similaritySearchWithScore(renderedStep.renderedQueries[queryKey].text);

    let resultSegments: DocumentIndexResultSegment[] = cvResult.map(([cvSegment, cvScore]) => {
      if (! cvSegment.metadata) throw Error("Bug: no metadata in indexed segment");
      return {
        docId: cvSegment.metadata["docId"],
        text: cvSegment.pageContent,
        score: 1-cvScore // TODO: check distance normalization
      }
    });
    result.segments[queryKey] = resultSegments;
  }

  // console.log("document index result: ", result);
  docIndexStep.results = [result];

  return result;
}

async function embedSegmentsOpenai(segments: string[], modelName: string, userSettings: LocalUserSettings) : Promise<Array<number[]>> {
  const openai = new OpenAI({
    apiKey: userSettings.predictionService.openai.apiKey,
    dangerouslyAllowBrowser: true, // We don't store the user's API key
  });
  const embedding = await openai.embeddings.create({
    model: modelName,
    input: segments,
    encoding_format: "float",
  });
  return embedding.data.map((item) => {return item.embedding});
}

async function embedSegmentsOllama(segments: string[], modelName: string, userSettings: LocalUserSettings) : Promise<Array<number[]>> {
  let result: Array<number[]> = [];
  await Promise.all(segments.map((s, index) => {
    return fetch(`${userSettings.predictionService.ollama.server.replace(/\/+$/, '')}/api/embeddings`, {
          method: 'POST',
          body: JSON.stringify({
            "model": modelName,
            "prompt": s
          })
    }).then(async response => {
      if (response.ok) return response.json();
      throw new DocumentIndexExecutionError(await response.text());
    }).then(async responseJson => {
      let embedding: number[] = responseJson['embedding'];
      result[index] = embedding;
      // console.log("embedding result", index, embedding);
    })
  }));
  // console.log("done embedding");
  return result;
}


let xxhashLoaded = xxhash();

/**
 * Centralizes the segment hash function to ensure consistent cache access
 */
export class CacheDocumentHasher {
  loadedXxhash: XXHashAPI

  constructor(loadedXxhash: XXHashAPI) {
    this.loadedXxhash = loadedXxhash;
  }

  hash(text: string) : string {
    return this.loadedXxhash.h32ToString(text);
  }
}

/**
 * We use xxhash-wasm for cache, which is fast but require async load of the WASM module.
 * This function returns a document hasher class that recycles the xxhash instance that
 * is loaded at module level.
 * 
 * This way hashing 100K "Mary had a little lamb" strings took 78ms, comparable with loading
 * xxhash directly (84ms). A baseline wrapper hashString function that 1) awaits xxhash 2) hashes
 * a single string input goes out of memory. A modified hashString that awaits on documentIndex.xxhashLoaded
 * took 1464ms to hash the 100K strings.
 * 
 * @returns A CacheDocumentHasher instance
 */
export async function getCacheDocumentHasher() : Promise<CacheDocumentHasher> {
  let hasher = await xxhashLoaded;
  return new CacheDocumentHasher(hasher);
}

class CloseVectorCustomEmbeddings extends CloseVectorEmbeddingsWeb {
  docIndexStep: DocumentIndexStep
  userSettings: LocalUserSettings;
  modelName: string;

  _embeddingFunction: CallableFunction;

  constructor(docIndexStep: DocumentIndexStep, userSettings: LocalUserSettings) {
    super({key: "fake-key", secret: "fake-secret"});

    this.userSettings = userSettings;
    this.docIndexStep = docIndexStep;
    this.modelName = docIndexStep.embeddingSettings[docIndexStep.embeddingService].modelName

    if (docIndexStep.embeddingService == PredictionService.openai) this._embeddingFunction = embedSegmentsOpenai;
    else if (docIndexStep.embeddingService == PredictionService.ollama) this._embeddingFunction = embedSegmentsOllama;
    else throw Error("Not implemented");

  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length == 0) return [];

    let chainCache = get(editorSession).promptChain.embeddingCache;
    const modelSpec = getEmbeddingModelSpecString(this.docIndexStep);
    if (! chainCache[modelSpec]) chainCache[modelSpec] = {}
    let cache: Record<string, number[]> = chainCache[modelSpec];

    let hasher = await getCacheDocumentHasher();
    let result = Array(texts.length);

    // Read existing embeddings from cache
    let textsToEmbed: {text: string, originalPosition: number, hash: string}[] = [];
    texts.forEach((t, index) => {
      const hash = hasher.hash(t);
      if (hash in cache) {
        result[index] = cache[hash];
      } else {
        textsToEmbed.push({
          text: t,
          originalPosition: index,
          hash: hash
        });
      }
    });
    // console.log("Embedding cache hit: ", texts.length - textsToEmbed.length, "/", texts.length);

    // Make request for not-in-cache embeddings
    let newEmbeddings: Array<number[]> = [];
    
    if (textsToEmbed.length > 0) {
      newEmbeddings = await this._embeddingFunction(
        textsToEmbed.map(r => {return r.text}),
        this.modelName,
        this.userSettings
      );
    }
    
    // Merge results and update cache
    if (newEmbeddings.length != textsToEmbed.length) throw Error("Retrieved embeddings mismatch, please report this bug at https://github.com/conversabile/prompter");
    newEmbeddings.forEach((emb, index) => {
      const textsToEmbedRecord = textsToEmbed[index];
      result[textsToEmbedRecord.originalPosition] = emb;
      cache[textsToEmbedRecord.hash] = emb;
    });

    // Notify editor session subscribers
    editorSession.update((updater) => {
      updater.promptChain.embeddingCache[modelSpec] = cache;
      return updater;
     })

    return result;
  }

  async embedQuery(text: string): Promise<number[]> {
    return (await this.embedDocuments([text]))[0]
  }

  async embeddingWithRetry(textList: string[]): Promise<any> {
    // TODO: implement
    return this.embedDocuments(textList);
  }
}

class DocumentIndexExecutionError extends Error {};
