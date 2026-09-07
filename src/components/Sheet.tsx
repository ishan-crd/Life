import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Icon } from './Icon';
import { Touchable } from './Touchable';
import { PrimaryButton, Txt } from './ui';
import { elevation, radius, size as metric, space, useTheme, type as typeScale } from '@/theme';

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

/**
 * Single reusable editor sheet — every create/edit affordance in the app
 * (tasks, cards, events, habits, meds, notes) routes through this.
 */
export function SheetProvider({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const [spec, setSpec] = useState<SheetSpec | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const openSheet = useCallback((next: SheetSpec) => {
    const seeded: Record<string, string> = {};
    for (const f of next.fields) seeded[f.key] = f.initial ?? f.options?.[0]?.value ?? '';
    setValues(seeded);
    setSpec(next);
  }, []);

  const closeSheet = useCallback(() => setSpec(null), []);

  const submit = useCallback(() => {
    if (!spec) return;
    const missing = spec.fields.some((f) => f.required && !values[f.key]?.trim());
    if (missing) return;
    spec.onSubmit(values);
    setSpec(null);
  }, [spec, values]);

  const ctx = useMemo(() => ({ openSheet, closeSheet }), [openSheet, closeSheet]);

  return (
    <SheetContext.Provider value={ctx}>
      {children}
      <Modal visible={!!spec} transparent animationType="none" onRequestClose={closeSheet}>
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={{ flex: 1 }}>
          <Pressable
            onPress={closeSheet}
            style={{ flex: 1, backgroundColor: 'rgba(4,4,6,0.62)', alignItems: 'center', justifyContent: 'center' }}
          >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <Animated.View entering={SlideInDown.springify().damping(20)} exiting={SlideOutDown.duration(200)}>
                <Pressable
                  onPress={(e) => e.stopPropagation()}
                  style={{
                    width: 520,
                    maxWidth: '96%',
                    borderRadius: radius.sheet,
                    backgroundColor: t.card,
                    borderWidth: 1,
                    borderColor: t.line,
                    padding: space.sheetPad,
                    ...elevation.sheet,
                  }}
                >
                  {spec ? (
                    <>
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
                        {spec.fields.map((f) => (
                          <View key={f.key} style={{ marginTop: 18 }}>
                            <Txt size={13} color={t.muted2} style={{ marginBottom: 8 }}>
                              {f.label}
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
                                        <View
                                          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: o.color }}
                                        />
                                      ) : null}
                                      <Txt size={13} color={active ? t.ink : t.inkSoft}>
                                        {o.label}
                                      </Txt>
                                    </Touchable>
                                  );
                                })}
                              </View>
                            ) : (
                              <TextInput
                                value={values[f.key]}
                                onChangeText={(text) => setValues((v) => ({ ...v, [f.key]: text }))}
                                placeholder={f.placeholder}
                                placeholderTextColor={t.muted3}
                                multiline={f.kind === 'multiline'}
                                style={{
                                  fontFamily: 'PlusJakartaSans_500Medium',
                                  fontSize: 15,
                                  color: t.ink,
                                  backgroundColor: t.surface2,
                                  borderWidth: 1,
                                  borderColor: t.pillLineSoft,
                                  borderRadius: radius.cell,
                                  paddingHorizontal: 14,
                                  paddingVertical: 12,
                                  minHeight: f.kind === 'multiline' ? 96 : 46,
                                  textAlignVertical: f.kind === 'multiline' ? 'top' : 'center',
                                }}
                              />
                            )}
                          </View>
                        ))}
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
                            <Txt size={14} color={t.inkSoft}>
                              {spec.deleteLabel ?? 'Delete'}
                            </Txt>
                          </Touchable>
                        ) : null}
                        <View style={{ flex: 1 }} />
                        <PrimaryButton label={spec.submitLabel ?? 'Save'} onPress={submit} />
                      </View>
                    </>
                  ) : null}
                </Pressable>
              </Animated.View>
            </KeyboardAvoidingView>
          </Pressable>
        </Animated.View>
      </Modal>
    </SheetContext.Provider>
  );
}
