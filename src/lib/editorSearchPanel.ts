import {
  SearchQuery,
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  setSearchQuery,
} from '@codemirror/search';
import type { EditorView, Panel } from '@codemirror/view';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | ((e: Event) => void)> = {},
  children: (HTMLElement | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'onclick' && typeof value === 'function') {
      node.addEventListener('click', value);
    } else if (typeof value === 'string' || typeof value === 'boolean') {
      if (value === true) node.setAttribute(key, '');
      else if (value !== false) node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

class EditorSearchPanel implements Panel {
  dom: HTMLElement;
  private query: SearchQuery;
  private searchField: HTMLInputElement;
  private replaceField: HTMLInputElement;
  private caseField: HTMLInputElement;

  constructor(private view: EditorView) {
    this.query = getSearchQuery(view.state);

    this.searchField = el('input', {
      value: this.query.search,
      placeholder: 'Find',
      'aria-label': 'Find',
      class: 'cm-textfield',
      name: 'search',
      form: '',
      'main-field': 'true',
    }) as HTMLInputElement;
    this.searchField.addEventListener('input', () => this.commit());
    this.searchField.addEventListener('change', () => this.commit());

    this.replaceField = el('input', {
      value: this.query.replace,
      placeholder: 'Replace',
      'aria-label': 'Replace',
      class: 'cm-textfield',
      name: 'replace',
      form: '',
    }) as HTMLInputElement;
    this.replaceField.addEventListener('input', () => this.commit());
    this.replaceField.addEventListener('change', () => this.commit());

    this.caseField = el('input', {
      type: 'checkbox',
      name: 'case',
      form: '',
      checked: this.query.caseSensitive,
    }) as HTMLInputElement;
    this.caseField.addEventListener('change', () => this.commit());

    const closeBtn = el('button', {
      class: 'cm-button cm-search-close',
      type: 'button',
      'aria-label': 'Close find and replace',
      onclick: () => closeSearchPanel(view),
    }, ['×']);

    const findRow = el('div', { class: 'cm-search-row' }, [
      this.searchField,
      this.btn('Previous', () => findPrevious(view)),
      this.btn('Next', () => findNext(view)),
      el('label', {}, [this.caseField, 'Match case']),
    ]);

    const replaceRow = el('div', { class: 'cm-search-row' }, [
      this.replaceField,
      this.btn('Replace', () => replaceNext(view)),
      this.btn('Replace all', () => replaceAll(view)),
    ]);

    this.dom = el('div', { class: 'cm-search' }, [closeBtn, findRow, replaceRow]);
    this.dom.addEventListener('keydown', (e) => this.onKeydown(e as KeyboardEvent));
  }

  private btn(label: string, onclick: () => void) {
    return el('button', { class: 'cm-button', type: 'button', onclick }, [label]);
  }

  private commit() {
    const query = new SearchQuery({
      search: this.searchField.value,
      caseSensitive: this.caseField.checked,
      replace: this.replaceField.value,
    });
    if (!query.eq(this.query)) {
      this.query = query;
      this.view.dispatch({ effects: setSearchQuery.of(query) });
    }
  }

  private onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && e.target === this.searchField) {
      e.preventDefault();
      (e.shiftKey ? findPrevious : findNext)(this.view);
    } else if (e.key === 'Enter' && e.target === this.replaceField) {
      e.preventDefault();
      replaceNext(this.view);
    }
  }

  update(update: import('@codemirror/view').ViewUpdate) {
    for (const tr of update.transactions) {
      for (const effect of tr.effects) {
        if (effect.is(setSearchQuery) && !effect.value.eq(this.query)) {
          this.query = effect.value;
          this.searchField.value = this.query.search;
          this.replaceField.value = this.query.replace;
          this.caseField.checked = this.query.caseSensitive;
        }
      }
    }
  }

  mount() {
    this.searchField.select();
  }

  get pos() {
    return 80;
  }

  get top() {
    return true;
  }
}

export function createEditorSearchPanel(view: EditorView): Panel {
  return new EditorSearchPanel(view);
}
