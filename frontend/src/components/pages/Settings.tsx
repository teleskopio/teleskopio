import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/components/ThemeProvider';
import type { Theme } from '@/components/ThemeProvider';
import { getLocalKeyObject } from '@/lib/localStorage';
import type { ServerInfo } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getLocalBoolean, setLocalBoolean } from '@/lib/localStorage';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Fonts,
  FONT_KEY,
  FONT_SIZE_KEY,
  DEFAULT_FONT,
  DEFAULT_FONT_SIZE,
  MANAGED_FIELDS,
  JSONSCHEMA_KEY,
} from '@/settings';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const config = getLocalKeyObject('currentCluster');

  const [managedFields, setManagedFields] = useState<boolean>(() => {
    return getLocalBoolean(MANAGED_FIELDS, false);
  });

  const [jsonSchema, setJsonSchema] = useState<boolean>(() => {
    return getLocalBoolean(JSONSCHEMA_KEY, false);
  });

  const [selectedFont, setSelectedFont] = useState<string>(() => {
    return localStorage.getItem(FONT_KEY) || DEFAULT_FONT;
  });

  const [fontSize, setFontSize] = useState(() => {
    return (
      parseInt(localStorage.getItem(FONT_SIZE_KEY) || DEFAULT_FONT_SIZE.toString()) ||
      DEFAULT_FONT_SIZE
    );
  });

  useEffect(() => {
    document.body.classList.remove(...Fonts.map((f) => f.className));
    document.body.classList.add(selectedFont);
    localStorage.setItem(FONT_KEY, selectedFont);
    document.documentElement.style.setProperty('--text-xs', `${fontSize}px`);
    localStorage.setItem(FONT_SIZE_KEY, fontSize.toString());
  }, [selectedFont, fontSize]);

  return (
    <div className="flex flex-row flex-grow p-2">
      <div className="flex flex-col w-full">
        <Tabs defaultValue="theme" className="text-xs">
          <TabsList>
            <TabsTrigger key="theme" value="theme" className="text-xs">
              Theme
            </TabsTrigger>
            <TabsTrigger key="font" value="font" className="text-xs">
              Font
            </TabsTrigger>
            <TabsTrigger key="editor" value="editor" className="text-xs">
              Editor
            </TabsTrigger>
            <TabsTrigger key="api-resources" value="api-resources" className="text-xs">
              API Resources
            </TabsTrigger>
          </TabsList>
          <TabsContent value="theme">
            <RadioGroup
              className="p-2"
              defaultValue={theme}
              onValueChange={(value) => setTheme(value as Theme)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="option-one" />
                <Label className="text-xs" htmlFor="option-one">
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="option-two" />
                <Label className="text-xs" htmlFor="option-two">
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="option-three" />
                <Label className="text-xs" htmlFor="option-three">
                  System
                </Label>
              </div>
            </RadioGroup>
          </TabsContent>
          <TabsContent value="font" className="flex flex-row items-center">
            <Select
              value={selectedFont}
              onValueChange={(v) => setSelectedFont(v)}
              defaultValue={selectedFont}
            >
              <SelectTrigger className="p-2 text-xs w-[180px]">
                <SelectValue placeholder="Select a font" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup className="text-xs">
                  <SelectLabel>Fonts</SelectLabel>
                  {Fonts.map((font, index) => (
                    <SelectItem key={index} className="text-xs" value={font.className}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              type="number"
              onChange={(e) => {
                if (parseInt(e.target.value) >= 10 && parseInt(e.target.value) <= 16) {
                  setFontSize(parseInt(e.target.value));
                }
              }}
              value={fontSize}
              className="ml-2 placeholder:text-muted-foreground flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50 w-[80px]"
            />
          </TabsContent>
          <TabsContent value="editor">
            <div className="m-2 flex flex-col">
              <div className="flex flex-row items-center">
                <Checkbox
                  checked={managedFields}
                  onCheckedChange={() => {
                    setManagedFields(!managedFields);
                    setLocalBoolean(MANAGED_FIELDS, !managedFields);
                  }}
                  id="editor"
                />
                <Label className="pl-1 text-xs" htmlFor="editor">
                  Strip Managed Fields
                </Label>
              </div>
              <p className="py-1">
                If checked the yaml resource with <b>metadata.managedFields</b> will be stripped.
              </p>
              <div className="flex flex-row items-center">
                <Checkbox
                  checked={jsonSchema}
                  onCheckedChange={() => {
                    setJsonSchema(!jsonSchema);
                    setLocalBoolean(JSONSCHEMA_KEY, !jsonSchema);
                  }}
                  id="schema"
                />
                <Label className="pl-1 text-xs" htmlFor="schema">
                  Enable remote JSON Schema{' '}
                </Label>
              </div>
              <p className="py-1">
                Source of the schema{' '}
                <a
                  className="bg-blue-300"
                  target="_blank"
                  href="https://github.com/yannh/kubernetes-json-schema?tab=readme-ov-file#kubernetes-json-schemas"
                >
                  yannh/kubernetes-json-schema
                </a>
              </p>
            </div>
          </TabsContent>
          <TabsContent value="api-resources">
            {(config.apiResources || []).slice().length === 0 ? (
              <div className="text-xs p-2">No cluster connected.</div>
            ) : (
              <ScrollArea className="h-[800px] w-full rounded-md border p-1">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Namespaced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(config.apiResources || [])
                      .slice()
                      .sort()
                      .map((a: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{a.kind}</TableCell>
                          <TableCell className="font-medium">{a.group}</TableCell>
                          <TableCell>{a.version}</TableCell>
                          <TableCell>{a.namespaced ? 'True' : 'False'}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
