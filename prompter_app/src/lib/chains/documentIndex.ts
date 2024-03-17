import type { RenderedTemplate } from "$lib/jinja";
import { PredictionService, type PredictionSettings, defaultEmbeddingSettings } from "$lib/services";
import OpenAI from "openai";
import { StepType, type Step, type StepResult } from "./chains";
import type { LocalUserSettings } from "$lib/userSettings";
import { CloseVectorEmbeddingsWeb, CloseVectorHNSWWeb } from "closevector-web";

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
      queries: [{key: "query_0", text: "A character who could be involved in {{ storyTopic }}"}],
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

export async function runDocumentIndexStep(docIndexStep: DocumentIndexStep, renderedStep: RenderedDocumentIndex, userSettings: LocalUserSettings) : Promise<DocumentIndexResult> {
  let allSegments = getSegments(docIndexStep);

  // Configure Embedding Class
  let cvEmbeddings: CloseVectorEmbeddingsWeb;
  if (docIndexStep.embeddingService == PredictionService.openai) {
    cvEmbeddings = new CloseVectorOpenaiEmbeddings(userSettings, docIndexStep.embeddingSettings.openai.modelName)
  } else {
    throw Error("Not Implemented");
  }

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

  console.log(result);
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

class CloseVectorOpenaiEmbeddings extends CloseVectorEmbeddingsWeb {
  userSettings: LocalUserSettings;
  modelName: string;

  constructor(userSettings: LocalUserSettings, modelName: string) {
    super({key: "fake-key", secret: "fake-secret"});

    this.userSettings = userSettings;
    this.modelName = modelName;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (texts.length == 0) return [];
    return embedSegmentsOpenai(texts, this.modelName, this.userSettings);
  }

  async embedQuery(text: string): Promise<number[]> {
    return (await embedSegmentsOpenai([text], this.modelName, this.userSettings))[0];
  }

  async embeddingWithRetry(textList: string[]): Promise<any> {
    // TODO: implement
    return this.embedDocuments(textList);
  }
}
