import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

export const editorHighlightStyle = HighlightStyle.define([
    { tag: tags.propertyName, color: "var(--brand-color)" },
    { tag: tags.string, color: "var(--brand-green, #49cc90)" },
    { tag: tags.number, color: "var(--accent-color)" },
    { tag: tags.bool, color: "#fca130" },
    { tag: tags.null, color: "var(--text-muted)" },

    { tag: tags.tagName, color: "#b7ff44" },
    { tag: tags.angleBracket, color: "var(--text-muted)" },
    { tag: tags.attributeName, color: "#fca130" },
    { tag: tags.attributeValue, color: "var(--brand-green, #53fc44)" }
]);