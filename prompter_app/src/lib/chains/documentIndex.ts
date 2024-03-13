import type { RenderedTemplate } from "$lib/jinja";
import { StepType, type Step } from "./chains";

export interface IndexedDocument {
    id: string,
    text: string,
    segmentSize: number,
    segmentSeparator: string
}

export interface DocumentIndexQuery {
  key: string,
  text: string,
}

export interface DocumentIndexStep extends Step {
  documents: IndexedDocument[],
  queries: DocumentIndexQuery[],
}

export interface RenderedDocumentIndex {
  renderedQueries: Record<string, RenderedTemplate>,
}

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
      queries: [{key: "query_0", text: "A character who is involved in {{ storyTopic }}"}]
    }
}
