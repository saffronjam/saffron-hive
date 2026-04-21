<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { EditorView, basicSetup } from "codemirror";
	import { json, jsonParseLinter } from "@codemirror/lang-json";
	import { linter, lintGutter } from "@codemirror/lint";
	import { oneDark } from "@codemirror/theme-one-dark";
	import { Compartment, EditorState } from "@codemirror/state";
	import { theme } from "$lib/stores/theme";

	interface Props {
		value: string;
		error?: string | null;
		readonly?: boolean;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(""),
		error = $bindable(null),
		readonly = false,
		onchange,
	}: Props = $props();

	let container: HTMLDivElement = $state(null!);
	let view: EditorView | undefined;
	let suppressUpdate = false;

	const themeCompartment = new Compartment();
	const readonlyCompartment = new Compartment();

	function getThemeExtension(currentTheme: string) {
		return currentTheme === "dark" ? oneDark : [];
	}

	onMount(() => {
		let currentTheme: string = "dark";
		const unsubTheme = theme.subscribe((t) => {
			currentTheme = t;
		});

		view = new EditorView({
			doc: value,
			extensions: [
				basicSetup,
				json(),
				linter(jsonParseLinter()),
				lintGutter(),
				themeCompartment.of(getThemeExtension(currentTheme)),
				readonlyCompartment.of(EditorState.readOnly.of(readonly)),
				EditorView.updateListener.of((update) => {
					if (!update.docChanged || suppressUpdate) return;
					const doc = update.state.doc.toString();
					value = doc;
					try {
						JSON.parse(doc);
						error = null;
					} catch (e) {
						error = (e as SyntaxError).message;
					}
					onchange?.(doc);
				}),
				EditorView.theme({
					"&": { height: "100%", fontSize: "13px" },
					".cm-scroller": { overflow: "auto" },
					".cm-content": { fontFamily: "monospace" },
					"&.cm-editor": { backgroundColor: "var(--background)" },
					".cm-gutters": { backgroundColor: "var(--background)" },
				}),
			],
			parent: container,
		});

		const unsubThemeReactive = theme.subscribe((t) => {
			view?.dispatch({
				effects: themeCompartment.reconfigure(getThemeExtension(t)),
			});
		});

		unsubTheme();

		return () => {
			unsubThemeReactive();
			view?.destroy();
		};
	});

	$effect(() => {
		if (!view || suppressUpdate) return;
		const currentDoc = view.state.doc.toString();
		if (value === currentDoc) return;
		suppressUpdate = true;
		view.dispatch({
			changes: {
				from: 0,
				to: view.state.doc.length,
				insert: value,
			},
		});
		suppressUpdate = false;
	});

	$effect(() => {
		view?.dispatch({
			effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(readonly)),
		});
	});
</script>

<div bind:this={container} class="h-full w-full overflow-hidden rounded-md shadow-card bg-background"></div>
