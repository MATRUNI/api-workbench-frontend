import { useRef, useEffect } from "react";
import { basicSetup, EditorView } from "codemirror";
import { placeholder, keymap } from "@codemirror/view";
import { search } from "@codemirror/search"
import { autocompletion } from "@codemirror/autocomplete";
import { linter } from "@codemirror/lint"
import { EditorState, Compartment } from "@codemirror/state";
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

export default function CodeMirrorEditor({value="",onChange,lang="json",placeholderText, editable=true,completions=[]})
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
                search(),
                wrapCompartment.current.of([]),
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
                    }
                ]),
                autocompletion(),
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