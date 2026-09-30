import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { ScheduleTemplate } from "@/rotation/types";
import {
  applyMemberNames,
  parseNames,
  rotationConfigForPreset,
  type RotationPreset,
} from "@/rotation/templateSetup";
import { LIMITS } from "@shared/limits";
import { useT, type MessageKey } from "@/i18n";

const PRESETS: {
  id: RotationPreset;
  label: MessageKey;
  desc: MessageKey;
}[] = [
  {
    id: "manual",
    label: "setup.preset.manual.label",
    desc: "setup.preset.manual.desc",
  },
  {
    id: "weekly",
    label: "setup.preset.weekly.label",
    desc: "setup.preset.weekly.desc",
  },
  {
    id: "weekdays",
    label: "setup.preset.weekdays.label",
    desc: "setup.preset.weekdays.desc",
  },
];

interface Props {
  template: ScheduleTemplate;
  onBack: () => void;
  onCreate: (template: ScheduleTemplate) => void;
}

/**
 * テンプレートを選んだ直後に、名前と交代のしかたを入れる画面。
 * 名前が空なら見本の名前のまま作る（あとで編集画面で直せる）
 */
export function TemplateSetupStep({ template, onBack, onCreate }: Props) {
  const t = useT();
  const id = useId();
  const [name, setName] = useState(template.name);
  const [namesText, setNamesText] = useState("");
  const [preset, setPreset] = useState<RotationPreset>("manual");
  const namesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    namesRef.current?.focus();
  }, []);

  const names = useMemo(() => parseNames(namesText), [namesText]);
  const tooMany = names.length > LIMITS.members;
  const isTaskMode = template.assignmentMode === "task";
  const duties = template.groups.length;
  const sampleNames = template.members.map(m => m.name);

  const hint = (() => {
    if (names.length === 0)
      return t("setup.membersEmpty", {
        names: sampleNames.slice(0, 3).join(t("setup.nameSeparator")),
      });
    if (tooMany) return t("setup.tooMany", { n: LIMITS.members });
    const sentences = [
      t(`setup.count.${names.length === 1 ? "one" : "other"}`, {
        n: names.length,
      }),
    ];
    if (!isTaskMode && names.length > duties)
      sentences.push(t("setup.rest", { g: duties, r: names.length - duties }));
    if (!isTaskMode && names.length < duties)
      sentences.push(t("setup.double", { g: duties }));
    return sentences.join(t("setup.sentenceGap"));
  })();

  const create = () => {
    if (tooMany) return;
    onCreate({
      ...template,
      name: name.trim() || template.name,
      ...applyMemberNames(template, names),
      rotationConfig: rotationConfigForPreset(preset, new Date()),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="self-start inline-flex items-center gap-1 text-sm font-bold -ml-1 px-1 py-0.5 rounded hover:bg-black/5"
        style={{ color: "var(--dt-text-secondary)" }}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        {t("setup.back")}
      </button>

      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          {template.emoji}
        </span>
        <h3
          className="text-base font-extrabold"
          style={{ color: "var(--dt-text)" }}
        >
          {t("setup.heading")}
        </h3>
      </div>

      <div>
        <label
          htmlFor={`${id}-name`}
          className="text-xs font-bold mb-1 block"
          style={{ color: "var(--dt-text-muted)" }}
        >
          {t("setup.name")}
        </label>
        <input
          id={`${id}-name`}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={LIMITS.scheduleName}
          className="w-full theme-border px-3 py-2 text-sm font-bold"
          style={{
            borderRadius: "var(--dt-border-radius-sm)",
            backgroundColor: "var(--dt-card-bg)",
            color: "var(--dt-text)",
          }}
        />
      </div>

      <div>
        <label
          htmlFor={`${id}-members`}
          className="text-xs font-bold mb-1 block"
          style={{ color: "var(--dt-text-muted)" }}
        >
          {t("setup.members")}
        </label>
        <textarea
          id={`${id}-members`}
          ref={namesRef}
          value={namesText}
          onChange={e => setNamesText(e.target.value)}
          placeholder={sampleNames.join("\n")}
          rows={Math.min(Math.max(sampleNames.length, 4), 7)}
          aria-describedby={`${id}-members-hint`}
          aria-invalid={tooMany || undefined}
          className="w-full theme-border px-3 py-2 text-sm font-medium resize-y"
          style={{
            borderRadius: "var(--dt-border-radius-sm)",
            backgroundColor: "var(--dt-card-bg)",
            color: "var(--dt-text)",
          }}
        />
        <p
          id={`${id}-members-hint`}
          className="text-xs mt-1 leading-relaxed"
          style={{ color: tooMany ? "#DC2626" : "var(--dt-text-secondary)" }}
        >
          {hint}
        </p>
      </div>

      <fieldset className="border-0 p-0 m-0">
        <legend
          className="text-xs font-bold mb-1"
          style={{ color: "var(--dt-text-muted)" }}
        >
          {t("setup.rotation")}
        </legend>
        <div className="flex flex-col gap-2" role="radiogroup">
          {PRESETS.map(option => {
            const selected = preset === option.id;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                key={option.id}
                onClick={() => setPreset(option.id)}
                className="theme-border w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors"
                style={{
                  borderRadius: "var(--dt-border-radius-sm)",
                  backgroundColor: selected
                    ? "var(--dt-current-highlight)"
                    : "var(--dt-card-bg)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full flex items-center justify-center"
                  style={{ border: "2px solid var(--dt-text)" }}
                >
                  {selected && (
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: "var(--dt-text)" }}
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-sm font-bold"
                    style={{ color: "var(--dt-text)" }}
                  >
                    {t(option.label)}
                  </span>
                  <span
                    className="block text-xs mt-0.5"
                    style={{ color: "var(--dt-text-secondary)" }}
                  >
                    {t(option.desc)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={create}
        disabled={tooMany}
        className="theme-border theme-shadow-sm w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-all duration-150 theme-hover-lift disabled:opacity-40"
        style={{
          backgroundColor: "var(--dt-control-bar-bg)",
          color: "var(--dt-control-bar-text)",
          borderRadius: "10px",
        }}
      >
        {t("setup.create")}
      </button>
    </div>
  );
}
