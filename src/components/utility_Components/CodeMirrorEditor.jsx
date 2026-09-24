import { useRef, useEffect } from "react";
import { basicSetup, EditorView } from "codemirror";
import { placeholder, keymap, tooltips } from "@codemirror/view";
import { search } from "@codemirror/search"
import { autocompletion, acceptCompletion, setSelectedCompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint"
import { EditorState, Compartment, Prec } from "@codemirror/state";
import { syntaxHighlighting, syntaxTree } from "@codemirror/language";


import { editorHighlightStyle } from "./editorTheme";
import { getLanguageExtension } from "./languages";

import "./CodeMirrorEditor.css"


const validateSyntax = (view) => {
    if(!view) return []
    const text = view.state.doc.toString();
    if (text.trim() === "") return [];
    const tree = syntaxTree(view.state);
    const diagnostics = [];

    tree.iterate({
        enter(node) {
            if (node.type.isError) {
                diagnostics.push({
                    from: node.from,
                    to: node.to,
                    severity: "error",
                    message: `Syntax error: ${node.name}`
                });
            }
        }
    });

    return diagnostics;
};

export default function CodeMirrorEditor({
    value="",
    onChange,
    lang="json",
    placeholderText,
    editable=true,
    completions=[],
    customCompletionSource=null,
    onEnter=null,
    onArrowUp=null,
    onArrowDown=null
})
{
    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const languageCompartment = useRef(new Compartment());
    const readOnlyCompartment = useRef(new Compartment());
    const editableCompartment = useRef(new Compartment());
    const spellCheckCompartment = useRef(new Compartment());
    const wrapCompartment = useRef(new Compartment());
    const wrapRef = useRef(false);

    const completionsRef = useRef(completions);
    const customCompletionSourceRef = useRef(customCompletionSource);
    const onEnterRef = useRef(onEnter);
    const onArrowUpRef = useRef(onArrowUp);
    const onArrowDownRef = useRef(onArrowDown);

    const onChangeRef = useRef(onChange);
    const langRef = useRef(lang);

    useEffect(() => {
        langRef.current = lang;
    }, [lang]);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange])

    useEffect(()=>{
        completionsRef.current = completions;
    },[completions])

    useEffect(() => {
        customCompletionSourceRef.current = customCompletionSource;
    }, [customCompletionSource]);

    useEffect(() => {
        onEnterRef.current = onEnter;
    }, [onEnter]);

    useEffect(() => {
        onArrowUpRef.current = onArrowUp;
    }, [onArrowUp]);

    useEffect(() => {
        onArrowDownRef.current = onArrowDown;
    }, [onArrowDown]);

    const myCompletionSource = (context) => {
        if(langRef.current!=="json") return null;
        const word = context.matchBefore(/\w*/);

        if(!word) return null;

        const node = syntaxTree(context.state)
            .resolveInner(context.pos);

        if (node.name !== "PropertyName") {
            return null;
        }

        return {
            from: word.from,
            options: completionsRef.current
        };
    };

    useEffect(()=>{
        const state = EditorState.create({
            doc:value,
            extensions:[
                basicSetup,
                tooltips({ position: "fixed", parent: typeof document !== "undefined" ? document.body : undefined }),
                search(),
                wrapCompartment.current.of([]),
                Prec.highest(
                    keymap.of([
                        {
                            key: "Alt-z",
                            run: (view) => {
                                wrapRef.current = !wrapRef.current;
                            
                                view.dispatch({
                                    effects: wrapCompartment.current.reconfigure(
                                        wrapRef.current
                                            ? EditorView.lineWrapping
                                            : []
                                    )
                                });
                            
                                return true;
                            }
                        },
                        {
                            key: "Shift-Enter",
                            run: (view) => {
                                if (onEnterRef.current) {
                                    view.dispatch(view.state.replaceSelection("\n"));
                                    return true;
                                }
                                return false;
                            }
                        },
                        {
                            key: "Enter",
                            run: (view) => {
                                // 1. If autocomplete popup is active, accept the selected completion
                                if (acceptCompletion(view)) {
                                    return true;
                                }
                                // 2. If Enter handler is present, execute command and clear editor
                                if (onEnterRef.current) {
                                    const text = view.state.doc.toString();
                                    if (text.trim()) {
                                        onEnterRef.current(text);
                                        view.dispatch({
                                            changes: { from: 0, to: view.state.doc.length, insert: "" }
                                        });
                                    }
                                    return true;
                                }
                                return false;
                            }
                        },
                        {
                            key: "ArrowUp",
                            run: (view) => {
                                if (onArrowUpRef.current) {
                                    return onArrowUpRef.current(view);
                                }
                                return false;
                            }
                        },
                        {
                            key: "ArrowDown",
                            run: (view) => {
                                if (onArrowDownRef.current) {
                                    return onArrowDownRef.current(view);
                                }
                                return false;
                            }
                        }
                    ])
                ),
                autocompletion({
                    override: customCompletionSourceRef.current ? [customCompletionSourceRef.current] : undefined,
                    selectOnOpen: true
                }),
                placeholder(placeholderText),
                syntaxHighlighting(editorHighlightStyle),
                languageCompartment.current.of(
                    getLanguageExtension(langRef.current,myCompletionSource)
                ),
                readOnlyCompartment.current.of(
                    EditorState.readOnly.of(!editable)
                ),
                editableCompartment.current.of(
                    EditorView.editable.of(editable)
                ),
                linter(validateSyntax),
                EditorView.updateListener.of((update)=>{
                    if(update.docChanged)
                    {
                        const newValue = update.state.doc.toString();
                        onChangeRef.current?.(newValue)
                    }
                }),
                spellCheckCompartment.current.of(
                    EditorView.contentAttributes.of({
                        spellcheck: langRef.current==="text" ? "true" : "false",
                        tabindex:"0"
                    })
                ),
            ]
        })
        const view = new EditorView({
            state,
            parent:editorRef.current
        })
        viewRef.current = view;
        return ()=>{
            view.destroy()
        }
    },[])

    useEffect(() => {
        const handleMouseOver = (e) => {
            const li = e.target.closest?.(".cm-tooltip-autocomplete li");
            if (!li || !li.id || !viewRef.current) return;
            const match = /-(\d+)$/.exec(li.id);
            if (match) {
                const index = parseInt(match[1], 10);
                if (!isNaN(index)) {
                    try {
                        viewRef.current.dispatch({ effects: setSelectedCompletion(index) });
                    } catch (err) {}
                }
            }
        };

        document.addEventListener("mouseover", handleMouseOver, { passive: true });
        return () => {
            document.removeEventListener("mouseover", handleMouseOver);
        };
    }, []);

    useEffect(()=>{
        const view = viewRef.current;

        if(!view) return;

        const currentValue = view.state.doc.toString();
        if(currentValue!==value)
        {
            view.dispatch({
                changes:{
                    from:0,
                    to:view.state.doc.length,
                    insert:value
                }
            })
        }
    },[value])

    useEffect(()=>{
        const view = viewRef.current;

        if(!view) return;

        view.dispatch({
            effects:[
                languageCompartment.current.reconfigure(
                    getLanguageExtension(langRef.current,myCompletionSource)
                ),
                readOnlyCompartment.current.reconfigure(
                    EditorState.readOnly.of(!editable)
                ),
                editableCompartment.current.reconfigure(
                    EditorView.editable.of(editable)
                ),
                spellCheckCompartment.current.reconfigure(
                    EditorView.contentAttributes.of({
                        spellcheck: langRef.current==="text" ? "true" : "false",
                        tabindex:"0"
                    })
                )
            ]
        })

    },[lang, editable])

    return (
        <div ref={editorRef} id="code-editor">

        </div>
    )
}