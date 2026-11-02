"use client";

import "@mdxeditor/editor/style.css";

import {
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  codeBlockPlugin,
  codeMirrorPlugin,
  ConditionalContents,
  CreateLink,
  headingsPlugin,
  imagePlugin,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import { basicDark } from "cm6-theme-basic-dark";
import { useTheme } from "next-themes";
import type { Ref } from "react";

import { cn } from "@/lib/utils";

// Key = language written after ``` in markdown, value = label in the dropdown
const CODE_BLOCK_LANGUAGES = {
  "": "Plain text",
  js: "JavaScript",
  ts: "TypeScript",
  jsx: "JavaScript (React)",
  tsx: "TypeScript (React)",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  json: "JSON",
  bash: "Bash",
  sql: "SQL",
};

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  editorRef?: Ref<MDXEditorMethods>;
}

const Editor = ({ value, onChange, editorRef }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    // Layout styles live on this wrapper because MDXEditor copies `className`
    // onto its popup container too, which would render a stray bordered bar.
    // `grid` stops long code lines from stretching the page.
    <div className="background-light800_dark200 light-border-2 grid w-full border">
      <MDXEditor
        // Code block themes are only read on mount, so remount on theme change.
        // `value` comes from the form, so the text survives the remount.
        key={resolvedTheme}
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        // `dark-theme` is MDXEditor's built-in dark palette
        className={cn(isDark && "dark-theme")}
        contentEditableClassName="markdown-editor"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          tablePlugin(),
          imagePlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
          codeMirrorPlugin({
            codeBlockLanguages: CODE_BLOCK_LANGUAGES,
            autoLoadLanguageSupport: true,
            codeMirrorExtensions: isDark ? [basicDark] : [],
          }),
          toolbarPlugin({
            toolbarContents: () => (
              <ConditionalContents
                options={[
                  {
                    when: (editor) => editor?.editorType === "codeblock",
                    contents: () => <ChangeCodeMirrorLanguage />,
                  },
                  {
                    fallback: () => (
                      <>
                        <UndoRedo />
                        <Separator />
                        <BoldItalicUnderlineToggles />
                        <Separator />
                        <ListsToggle />
                        <Separator />
                        <CreateLink />
                        <InsertImage />
                        <Separator />
                        <InsertTable />
                        <InsertThematicBreak />
                        <InsertCodeBlock />
                      </>
                    ),
                  },
                ]}
              />
            ),
          }),
        ]}
      />
    </div>
  );
};

export default Editor;
