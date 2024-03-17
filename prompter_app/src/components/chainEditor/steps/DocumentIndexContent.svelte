<script lang="ts">
	import { getSegments, type DocumentIndexStep, type IndexedDocument, type RenderedDocumentIndex } from "$lib/chains/documentIndex";
	import { faPlusCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
	import { nanoid } from "nanoid";
	import Fa from "svelte-fa";
	import CodeMirrorPreviewedTextarea from "../../CodeMirrorPreviewedTextarea.svelte";
	import { renderedSteps } from "$lib/editorSession";

    export let docIndexStep: DocumentIndexStep;

    let rendered: RenderedDocumentIndex;
    $: rendered = ($renderedSteps[docIndexStep.resultKey]) as RenderedDocumentIndex;


    let globalSegmentSize: number = docIndexStep.documents ? docIndexStep.documents[0].segmentSize : 200;
    $: if (globalSegmentSize && docIndexStep.documents) {
        docIndexStep.documents.forEach((doc: IndexedDocument) => {doc.segmentSize = globalSegmentSize})
    }

    // Rebuild fulltext from segments
    let documentSegments: Record<string, string[]> = {}; // docId -> list of segments
    $: documentSegments = getSegments(docIndexStep);

    function handleAddDocument() {
        docIndexStep.documents.push({id: nanoid(11), text: "", segmentSize: globalSegmentSize, segmentSeparator: "\n\n"});
        docIndexStep = docIndexStep;
    }

    function deleteDocument(docId: string) {
        const index = docIndexStep.documents.findIndex(item => item.id === docId);
        if (index !== -1) {
            docIndexStep.documents.splice(index, 1);
            docIndexStep = docIndexStep;
        }
    }
</script>

<!-- <div class="indexSettings">
    <label>Segment Size <input type="number" value="200" min="-1" max="9999" class="segmentSize"></label>
</div> -->

<h2>Documents</h2>
<div class="docContainer">
{#each docIndexStep.documents as doc}
    <div class="doc">
        <textarea cols="30" rows="10" bind:value={doc.text} placeholder="Paste your document content here (file upload is coming soon...)"></textarea>
        <div class="segmentsPreview">
            {#each documentSegments[doc.id] as segment}
                <div class="segment">{segment}</div>
            {/each}
        </div>
        <div class="docActions">
            <a href={null} on:click={() => {deleteDocument(doc.id)}}><Fa icon={faTrash} /></a>
        </div>
    </div>
{/each}
    <div class="addNewDoc"><a href={null} on:click={handleAddDocument}><Fa icon={faPlusCircle} /> Add document</a></div>
</div>

<h2>Query</h2>
    <div class="singleQuery">
        <CodeMirrorPreviewedTextarea
            bind:content={docIndexStep.queries[0].text}
            bind:renderedContent={rendered.renderedQueries[docIndexStep.queries[0].key]}
            textareaDefaultStyle="width: 100%; height:1.5em; padding:0.2em"
        />
</div>


<style>
.indexSettings {
    padding: .5em 0;
    margin: 0 1em .5em 1em;
    border-bottom: 1px solid;
}

.indexSettings input.segmentSize {
    width: 4em;
}

h2 {
    font-weight: bold;
    margin-left: 1em;
}

.docContainer {
    margin: 0 1em;
    display: flex;
    flex-direction: column;
    row-gap: .5em;
}

.docContainer .addNewDoc {
    text-align: center;
}

a {
    color: var(--color-A-text-standard);
    font-size: .8em;
    cursor: pointer;
}

.docContainer .doc {
    resize: vertical;
    overflow: auto;
    display: flex;
    column-gap: .5em;
    height: 100px;
    background: var(--color-bg-alphawhite25);
}

.docContainer textarea {
    resize: none;
    border: 0;
    min-width: 25%;
}

.segmentsPreview {
    overflow: scroll;
    flex-grow: 1;
}

.docActions {
    align-items: center;
    display: flex;
    padding: .5em;
}

.segmentsPreview .segment {
    border-left: 2px solid rgba(0,0,0,.25);
    margin: .5em 0;
    padding-left: .2em;
}

.singleQuery {
    padding: 0 1em 1em 1em;
}

:global(.singleQuery .CodeMirror) {
    padding:0.1em;
    /* border: 1px solid black; */
}
</style>