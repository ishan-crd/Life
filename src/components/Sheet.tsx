import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SmoothSheet } from 'insyd-bottom-sheet';
import { Icon } from './Icon';
import { Touchable } from './Touchable';
import { PrimaryButton, Txt } from './ui';
import { accent, radius, size as metric, space, type as typeScale, useTheme } from '@/theme';

export interface SheetOption {
  label: string;
  value: string;
  color?: string;
}

export interface SheetField {
  key: string;
  label: string;
  placeholder?: string;
  initial?: string;
  kind?: 'text' | 'multiline' | 'select';
  options?: SheetOption[];
  required?: boolean;
}

export interface SheetSpec {
  title: string;
  subtitle?: string;
  submitLabel?: string;
  fields: SheetField[];
  onSubmit(values: Record<string, string>): void;
  onDelete?(): void;
  /** Label for the secondary destructive action (defaults to "Delete"). */
  deleteLabel?: string;
}

interface SheetContextValue {
  openSheet(spec: SheetSpec): void;
  closeSheet(): void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

export function useSheet(): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('useSheet must be used inside <SheetProvider>');
  return ctx;
}

/** Landscape iPad is far wider than a form should be — cap the content column. */
const CONTENT_MAX_WIDTH = 640;

/**
 * Single reusable editor sheet — every create/edit affordance in the app
 * (tasks, cards, events, habits, meds, notes) routes through this.
 *
 * Presentation is `insyd-bottom-sheet`'s `SmoothSheet`, which brings the drag
 * handle, drag-to-dismiss, backdrop tap and keyboard avoidance with it.
 */
export function SheetProvider({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const [spec, setSpec] = useState<SheetSpec | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  /** Keys of required fields the user left blank on the last submit attempt. */
  const [missing, setMissing] = useState<string[]>([]);

  const openSheet = useCallback((next: SheetSpec) => {
    const seeded: Record<string, string> = {};
    for (const f of next.fields) seeded[f.key] = f.initial ?? f.options?.[0]?.value ?? '';
    setValues(seeded);
    setMissing([]);
    setSpec(next);
  }, []);

  const closeSheet = useCallback(() => setSpec(null), []);

  const submit = useCallback(() => {
    if (!spec) return;
    const blank = spec.fields.filter((f) => f.required && !values[f.key]?.trim()).map((f) => f.key);
    if (blank.length) {
      // Surface what is missing instead of dropping the tap on the floor.
      setMissing(blank);
      return;
    }
    spec.onSubmit(values);
    setSpec(null);
  }, [spec, values]);

  const ctx = useMemo(() => ({ openSheet, closeSheet }), [openSheet, closeSheet]);

  return (
    <SheetContext.Provider value={ctx}>
      {children}
      <SmoothSheet
        isVisible={!!spec}
        onDismiss={closeSheet}
        minHeightFraction={0.5}
        maxHeightFraction={0.92}
        backgroundColor={t.card}
        borderRadius={radius.sheet}
        handleColor={t.btnLine}
        backdropColor="rgba(4,4,6,0.62)"
      >
        {spec ? (
          <View
            style={{
              width: '100%',
              maxWidth: CONTENT_MAX_WIDTH,
              alignSelf: 'center',
              paddingHorizontal: space.sheetPad,
              paddingBottom: space.sheetPad,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Txt size={22} weight="semibold" tracking={-0.02}>
                  {spec.title}
                </Txt>
                {spec.subtitle ? (
                  <Txt size={typeScale.small} color={t.muted2} style={{ marginTop: 4 }}>
                    {spec.subtitle}
                  </Txt>
                ) : null}
              </View>
              <Touchable
                onPress={closeSheet}
                activeScale={0.9}
                accessibilityLabel="Close"
                style={{
                  width: metric.cardButton,
                  height: metric.cardButton,
                  borderRadius: metric.cardButton / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: t.surface2,
                  borderWidth: 1,
                  borderColor: t.pillLineSoft,
                }}
              >
                <Icon name="close" size={15} color={t.inkSoft} />
              </Touchable>
            </View>

            <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
              {spec.fields.map((f) => {
                const isMissing = missing.includes(f.key);
                return (
                <View key={f.key} style={{ marginTop: space.lg }}>
                  <Txt
                    size={typeScale.small}
                    color={isMissing ? accent.rose : t.muted2}
                    style={{ marginBottom: 8 }}
                  >
                    {f.label}
                    {isMissing ? ' · required' : ''}
                  </Txt>
                  {f.kind === 'select' ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {f.options?.map((o) => {
                        const active = values[f.key] === o.value;
                        return (
                          <Touchable
                            key={o.value}
                            onPress={() => setValues((v) => ({ ...v, [f.key]: o.value }))}
                            activeScale={0.96}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 8,
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              borderRadius: radius.pill,
                              backgroundColor: active ? t.surface3 : 'transparent',
                              borderWidth: 1,
                              borderColor: active ? t.btnLine : t.pillLine,
                            }}
                          >
                            {o.color ? (
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: o.color }} />
                            ) : null}
                            <Txt size={typeScale.small} color={active ? t.ink : t.inkSoft}>
                              {o.label}
                            </Txt>
                          </Touchable>
                        );
                      })}
                    </View>
                  ) : (
                    <TextInput
                      value={values[f.key]}
                      onChangeText={(text) => {
                        setValues((v) => ({ ...v, [f.key]: text }));
                        if (isMissing) setMissing((m) => m.filter((k) => k !== f.key));
                      }}
                      placeholder={f.placeholder}
                      placeholderTextColor={t.muted3}
                      multiline={f.kind === 'multiline'}
                      style={{
                        fontFamily: 'PlusJakartaSans_500Medium',
                        fontSize: typeScale.control,
                        color: t.ink,
                        backgroundColor: t.surface2,
                        borderWidth: 1,
                        borderColor: isMissing ? accent.rose : t.pillLineSoft,
                        borderRadius: radius.cell,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        minHeight: f.kind === 'multiline' ? 96 : 46,
                        textAlignVertical: f.kind === 'multiline' ? 'top' : 'center',
                      }}
                    />
                  )}
                </View>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 }}>
              {spec.onDelete ? (
                <Touchable
                  onPress={() => {
                    spec.onDelete?.();
                    setSpec(null);
                  }}
                  activeScale={0.95}
                  haptic="medium"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    height: metric.action,
                    paddingHorizontal: space.lg,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: t.btnLine,
                  }}
                >
                  <Icon name="trash" size={15} color={t.inkSoft} />
                  <Txt size={typeScale.body} color={t.inkSoft}>
                    {spec.deleteLabel ?? 'Delete'}
                  </Txt>
                </Touchable>
              ) : null}
              <View style={{ flex: 1 }} />
              <PrimaryButton label={spec.submitLabel ?? 'Save'} onPress={submit} />
            </View>
          </View>
        ) : null}
      </SmoothSheet>
    </SheetContext.Provider>
  );
}
