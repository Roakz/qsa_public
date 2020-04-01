interface TextNote {
  kind: 'text';
  text: string[];
}

interface OrderedListNote {
  kind: 'orderedlist';
  title: string;
  items: string[];
}

interface DefinedListNote {
  kind: 'definedlist';
  title: string;
  items: { label: string; value: string }[];
}

interface ChronologyNote {
  kind: 'chronology';
  title: string;
  items: { event_date: string; events: string[] }[];
}

export type Note = TextNote | OrderedListNote | DefinedListNote | ChronologyNote;

export class RecordDisplay {
  private readonly record: any;

  constructor(record: any) {
    this.record = record;
  }

  get(fieldName: string): any {
    return this.record[fieldName];
  }

  getMaybe(fieldName: string, callback: any): any {
    if (this.get(fieldName)) {
      // treat empty array as nil
      if (Array.isArray(this.get(fieldName)) && this.get(fieldName).length === 0) {
        return [];
      }
      return callback(this.get(fieldName));
    } else {
      return [];
    }
  }

  getArray(fieldName: string): any[] {
    if (this.record[fieldName]) {
      if (Array.isArray(this.record[fieldName])) {
        return this.record[fieldName];
      } else {
        return [this.record[fieldName]];
      }
    } else {
      return [];
    }
  }

  getFirst(fieldName: string, callback: any): any {
    const anArray = this.getArray(fieldName);
    if (anArray.length > 0) {
      return callback(anArray[0]);
    } else {
      return [];
    }
  }

  getNotes(noteType: string, noteLabel: string | null, callback: any): any {
    const notes: any = this.getArray('notes');
    const result: Note[] = [];

    notes.forEach((note: any) => {
      if (note.type !== noteType) {
        return;
      }

      if (noteLabel && note.note_label && note.note_label.trim().toLowerCase() !== noteLabel.trim().toLowerCase()) {
        return;
      }

      if (note.jsonmodel_type === 'note_singlepart') {
        result.push({
          kind: 'text',
          text: note.content
        });
      } else if (note.jsonmodel_type === 'note_multipart') {
        note.subnotes.forEach((subnote: any) => {
          if (subnote.jsonmodel_type === 'note_text') {
            result.push({
              kind: 'text',
              text: [subnote.content]
            });
          } else if (subnote.jsonmodel_type === 'note_chronology') {
            result.push({
              kind: 'chronology',
              title: subnote.title,
              items: subnote.items
            });
          } else if (subnote.jsonmodel_type === 'note_orderedlist') {
            result.push({
              kind: 'orderedlist',
              title: subnote.title,
              items: subnote.items
            });
          } else if (subnote.jsonmodel_type === 'note_definedlist') {
            result.push({
              kind: 'definedlist',
              title: subnote.title,
              items: subnote.items
            });
          }
        });
      }
    });

    if (result.length > 0) {
      return callback(result);
    } else {
      return [];
    }
  }

  getExternalDocuments(possible_titles: string[], callback: any): any {
    const title_filter: string[] = possible_titles.map((s: string) => s.trim().toLowerCase());
    const docs = this.getArray('external_documents').filter((doc: any) => {
      return title_filter.indexOf(doc.title.trim().toLowerCase()) >= 0;
    });

    if (docs.length > 0) {
      return callback(docs);
    } else {
      return [];
    }
  }

  generateId(): string {
    return '' + Math.random() + new Date().getTime();
  }
}
