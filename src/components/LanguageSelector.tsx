import { languages, type Language } from "@/lib/languages";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-64 text-base">
        <SelectValue placeholder="Choose a language" />
      </SelectTrigger>
      <SelectContent>
        {languages.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            <span className="mr-2">{l.flag}</span> {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
