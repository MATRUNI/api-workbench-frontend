import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { xml } from "@codemirror/lang-xml";

export const getLanguageExtension = (language, completionSource) => {
    switch (language) {
        case "json": {
            const support = json();

            return [
                support,
                support.language.data.of({
                    autocomplete: completionSource
                })
            ];
        }

        case "html":
            return html();

        case "xml":
            return xml();

        default:
            return [];
    }
};