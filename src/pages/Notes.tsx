import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { RiseIn } from '@/components/RiseIn';
import { useSheet } from '@/components/Sheet';
import { Touchable } from '@/components/Touchable';
import { FONT, Pill, PrimaryButton, RoundButton, StatChip, Txt } from '@/components/ui';
import { tagColor, useAppStore } from '@/state/store';
import type { Note } from '@/state/types';
import { useTheme } from '@/theme/useTheme';

const COLUMNS = 4;

const TAG_OPTIONS = ['Idea', 'Work', 'Life', 'Health', 'Mind', 'Clipstake'].map((tag) => ({
  label: tag,
  value: tag,
  color: tagColor(tag),
}));

const SIZE_OPTIONS = [
  { label: 'Body', value: '15' },
  { label: 'Large', value: '19' },
  { label: 'Headline', value: '25' },
];

/** Greedy masonry: each note lands in the currently shortest column. */
function layout(notes: Note[]): Note[][] {
  const cols: Note[][] = Array.from({ length: COLUMNS }, () => []);
  const heights = new Array(COLUMNS).fill(0);
  for (const note of notes) {
    const estimated = 96 + (note.text.length / 34) * note.size * 1.35;
    let target = 0;
    for (let i = 1; i < COLUMNS; i += 1) if (heights[i] < heights[target]) target = i;
    cols[target].push(note);
    heights[target] += estimated;
  }
  return cols;
}

export function Notes() {
  const t = useTheme();
  const { openSheet } = useSheet();
  const notes = useAppStore((s) => s.notes);
  const addNote = useAppStore((s) => s.addNote);
  const updateNote = useAppStore((s) => s.updateNote);
  const removeNote = useAppStore((s) => s.removeNote);

  const [editing, setEditing] = useState<string | null>(null);
  const columns = useMemo(() => layout(notes), [notes]);

  const lastEdited = useMemo(() => {
    const newest = notes.reduce((max, n) => Math.max(max, n.updatedAt), 0);
    if (!newest) return 'edited recently';
    const mins = Math.floor((Date.now() - newest) / 60000);
    if (mins < 1) return 'edited just now';
    if (mins < 60) return `edited ${mins}m ago`;
    return `edited ${Math.floor(mins / 60)}h ago`;
  }, [notes]);

  const openNoteSheet = useCallback(
    (note: Note) => {
      openSheet({
        title: 'Note settings',
        submitLabel: 'Save',
        fields: [
          { key: 'tag', label: 'Tag', kind: 'select', initial: note.tag, options: TAG_OPTIONS },
          { key: 'size', label: 'Size', kind: 'select', initial: String(note.size), options: SIZE_OPTIONS },
          { key: 'text', label: 'Text', kind: 'multiline', initial: note.text },
        ],
        onSubmit: (v) =>
          updateNote(note.id, {
            tag: v.tag,
            dot: tagColor(v.tag),
            size: Number(v.size),
            weight: Number(v.size) >= 25 ? '400' : '500',
            text: v.text,
          }),
        onDelete: () => removeNote(note.id),
      });
    },
    [openSheet, updateNote, removeNote]
  );

  const createNote = useCallback(() => {
    const id = addNote({ text: '' });
    setEditing(id);
  }, [addNote]);

  return (
    <View style={{ flex: 1, paddingHorizontal: 26 }}>
      <PageHeader
        title="Notes"
        accent="& scraps"
        right={
          <>
            <StatChip left={`${notes.length} notes`} right={lastEdited} />
            <PrimaryButton label="New note" icon="plus" onPress={createNote} />
          </>
        }
      />

      <RiseIn
        delay={80}
        style={{ flex: 1, borderTopWidth: 1, borderTopColor: t.lineSoft, paddingTop: 20 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexDirection: 'row', gap: 18, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {columns.map((col, ci) => (
            <View key={ci} style={{ flex: 1, gap: 18 }}>
              {col.map((note) => (
                <View
                  key={note.id}
                  style={{
                    padding: 18,
                    borderRadius: 22,
                    backgroundColor: t.card,
                    borderWidth: 1,
                    borderColor: editing === note.id ? t.btnLine : t.line,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <Pill dot={note.dot} paddingH={11} paddingV={5}>
                      <Txt size={12} color={t.inkSoft}>
                        {note.tag}
                      </Txt>
                    </Pill>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Txt size={12} color={t.muted2}>
                        {note.when}
                      </Txt>
                      <RoundButton
                        icon="dots"
                        size={26}
                        iconSize={13}
                        variant="outline"
                        color={t.muted3}
                        style={{ borderColor: 'transparent' }}
                        accessibilityLabel="Note options"
                        onPress={() => openNoteSheet(note)}
                      />
                    </View>
                  </View>

                  <Touchable
                    onPress={() => setEditing(note.id)}
                    haptic={false}
                    activeScale={1}
                    style={{ marginTop: 12 }}
                  >
                    {editing === note.id ? (
                      <TextInput
                        autoFocus
                        multiline
                        value={note.text}
                        onChangeText={(text) => updateNote(note.id, { text })}
                        onBlur={() => setEditing(null)}
                        placeholder="Write it down…"
                        placeholderTextColor={t.muted3}
                        style={{
                          fontFamily: note.weight === '400' ? FONT.regular : FONT.medium,
                          fontSize: note.size,
                          lineHeight: note.size * 1.35,
                          letterSpacing: -0.01 * note.size,
                          color: t.ink,
                          backgroundColor: t.surface2,
                          borderRadius: 10,
                          padding: 8,
                          margin: -8,
                        }}
                      />
                    ) : (
                      <Txt
                        size={note.size}
                        weight={note.weight === '400' ? 'regular' : 'medium'}
                        lineHeight={1.35}
                        tracking={-0.01}
                      >
                        {note.text || 'Write it down…'}
                      </Txt>
                    )}
                  </Touchable>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </RiseIn>
    </View>
  );
}
