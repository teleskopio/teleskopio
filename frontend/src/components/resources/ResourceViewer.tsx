import { useRef, useState, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { PencilOff, ArrowBigLeft, Plus, Minus, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as monaco from 'monaco-editor';
import YamlWorker from '@/yaml.worker.js?worker';
import { configureMonacoYaml, MonacoYamlOptions } from 'monaco-yaml';
import { loader } from '@monaco-editor/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { Fonts, FONT_KEY, EDITOR_FONT_SIZE_KEY, EDITOR_FONT_SIZE } from '@/settings';
import { useLoaderData } from 'react-router';

window.MonacoEnvironment = {
  getWorker(moduleId, label) {
    switch (label) {
      // Handle other cases
      case 'yaml':
        return new YamlWorker();
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

loader.config({ monaco });

export default function ResourceViewer() {
  const { theme } = useTheme();
  let navigate = useNavigate();
  const { data } = useLoaderData();
  const [fontSize, setFontsize] = useState<number>(() => {
    return (
      parseInt(localStorage.getItem(EDITOR_FONT_SIZE_KEY) || EDITOR_FONT_SIZE.toString()) ||
      EDITOR_FONT_SIZE
    );
  });
  const [minimap, setMinimap] = useState(true);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [selectedFont] = useState<string>(() => {
    return (
      Fonts.find((f) => f.className === localStorage.getItem(FONT_KEY))?.label || 'Cascadia Code'
    );
  });

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    let monacoParams: MonacoYamlOptions = { enableSchemaRequest: false };
    configureMonacoYaml(monacoInstance, monacoParams);
    editorRef.current = editor;
    editor.focus();
  };

  const changeFont = async (size: number) => {
    if (size < 0 && fontSize >= 5) {
      setFontsize(fontSize - 1);
      localStorage.setItem(EDITOR_FONT_SIZE_KEY, (fontSize - 1).toString());
    } else if (size > 0 && fontSize <= 40) {
      setFontsize(fontSize + 1);
      localStorage.setItem(EDITOR_FONT_SIZE_KEY, (fontSize + 1).toString());
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(-1);
      }
      if (e.key === '-' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setFontsize(fontSize - 1);
      }
      if (e.key === '=' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setFontsize(fontSize + 1);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex gap-2 px-2 py-2 border-b justify-items-stretch items-center">
        <Button title="back" className="text-xs bg-blue-500" onClick={() => navigate(-1)}>
          <ArrowBigLeft /> Esc
        </Button>
        <Button title="save" className="text-xs bg-green-500" disabled={true} onClick={() => {}}>
          <PencilOff /> Read only
        </Button>
        <Button
          title="toggle minimap"
          className="text-xs bg-gray-500"
          onClick={() => setMinimap(!minimap)}
        >
          <Map />
        </Button>
        <Button
          title="decrease font"
          className="text-xs bg-gray-500"
          onClick={() => changeFont(-1)}
        >
          <Minus />
        </Button>
        <Button title="increase font" className="text-xs bg-gray-500" onClick={() => changeFont(1)}>
          <Plus />
        </Button>
      </div>
      <Editor
        height="90vh"
        defaultLanguage="yaml"
        path={location.pathname}
        options={{
          minimap: { enabled: minimap },
          fontFamily: selectedFont,
          fontSize: fontSize,
          readOnly: true,
          automaticLayout: true,
        }}
        onChange={() => {}}
        value={data.manifest}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onMount={handleEditorMount}
      />
    </div>
  );
}
