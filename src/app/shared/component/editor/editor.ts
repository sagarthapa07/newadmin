/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/#installation/NodgNARAzAdADDATBSBWRiQEYRyogFgA4A2I/EKArcnAxLOIvAsqg1LYplCAUwB2KOGGBYwIyWHFYAupCgAjRYhIATVBFlA=
 */
import { ChangeDetectorRef, Component, ViewEncapsulation, type AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {
  ClassicEditor,
  Alignment,
  Autoformat,
  AutoLink,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  GeneralHtmlSupport,
  Heading,
  Highlight,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  MediaEmbed,
  PageBreak,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  SourceEditing,
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
  Style,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TodoList,
  Underline,
  Undo,
  type EditorConfig,
} from 'ckeditor5';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { forwardRef } from '@angular/core';

const LICENSE_KEY = 'GPL'; // or <YOUR_LICENSE_KEY>.

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, CKEditorModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Editor),
      multi: true,
    },
  ],
})
export class Editor implements AfterViewInit, ControlValueAccessor {
  public editorData = '';
  onChange: any = () => {};
  onTouched: any = () => {};
  constructor(private changeDetector: ChangeDetectorRef) {}

  public isLayoutReady = false;
  public Editor = ClassicEditor;
  public config: EditorConfig = {
    licenseKey: 'GPL',

    plugins: [
      Essentials,
      Alignment,
      Autoformat,
      AutoLink,
      BlockQuote,
      Bold,
      Code,
      CodeBlock,
      FindAndReplace,
      FontBackgroundColor,
      FontColor,
      FontFamily,
      FontSize,
      GeneralHtmlSupport,
      Heading,
      Highlight,
      HorizontalLine,
      Image,
      ImageCaption,
      ImageInsert,
      ImageResize,
      ImageStyle,
      ImageToolbar,
      ImageUpload,
      Indent,
      IndentBlock,
      Italic,
      Link,
      LinkImage,
      List,
      ListProperties,
      MediaEmbed,
      PageBreak,
      Paragraph,
      PasteFromOffice,
      RemoveFormat,
      SourceEditing,
      SpecialCharacters,
      SpecialCharactersArrows,
      SpecialCharactersCurrency,
      SpecialCharactersEssentials,
      SpecialCharactersLatin,
      SpecialCharactersMathematical,
      SpecialCharactersText,
      Style,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      TodoList,
      Underline,
      Undo,
    ],

    // toolbar: {
    //   shouldNotGroupWhenFull: true,
    //   items: [
    //     // ROW 1
    //     'undo',
    //     'redo',
    //     '|',
    //     'heading',
    //     'style',
    //     '|',
    //     'bold',
    //     'italic',
    //     'underline',
    //     '|',
    //     'link',
    //     'alignment',
    //     '|',
    //     'bulletedList',
    //     'numberedList',
    //     'todoList',
    //     '|',
    //     'outdent',
    //     'indent',
    //     'fontSize',
    //     'fontFamily',

    //     '-', //New line k liye use hoti h ye

    //     //ROW 2

    //     'fontColor',
    //     'fontBackgroundColor',
    //     '|',
    //     'highlight',
    //     '|',
    //     'blockQuote',
    //     '|',
    //     'insertTable',
    //     'imageInsert',
    //     'mediaEmbed',
    //     '|',
    //     'horizontalLine',
    //     'pageBreak',
    //     '|',
    //     'sourceEditing',
    //     'code',
    //     'codeBlock',
    //   ],
    // },

    toolbar: {
      shouldNotGroupWhenFull: true,
      items: [
        // ROW 1
        'undo',
        'redo',
        '|',
        'heading',
        'style',
        '|',
        'bold',
        'italic',
        'underline',
        '|',
        'link',
        'alignment',
        '|',
        'bulletedList',
        'numberedList',
        'todoList',

        '-',

        // ROW 2
        'outdent',
        'indent',
        '|',
        'fontSize',
        'fontFamily',
        '|',
        'fontColor',
        'fontBackgroundColor',
        '|',
        'highlight',
        '|',
        'blockQuote',
        '|',
        'insertTable',
        'imageInsert',
        'mediaEmbed',
        '|',
        'horizontalLine',
        'pageBreak',
        '|',
        'sourceEditing',
        'code',
        'codeBlock',
      ],
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      ],
    },

    fontFamily: {
      options: [
        'default',
        'Arial, Helvetica, sans-serif',
        'Courier New, Courier, monospace',
        'Georgia, serif',
        'Lucida Sans Unicode, Lucida Grande, sans-serif',
        'Tahoma, Geneva, sans-serif',
        'Times New Roman, Times, serif',
        'Trebuchet MS, Helvetica, sans-serif',
        'Verdana, Geneva, sans-serif',
      ],
      supportAllValues: true,
    },

    fontSize: {
      options: [8, 9, 10, 11, 12, 'default', 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
      supportAllValues: true,
    },

    image: {
      toolbar: [
        'imageStyle:inline',
        'imageStyle:wrapText',
        'imageStyle:breakText',
        '|',
        'imageCaption',
        '|',
        'resizeImage',
      ],
    },

    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        '|',
        'tableProperties',
        'tableCellProperties',
        '|',
        'toggleTableCaption',
      ],
    },

    list: {
      properties: {
        styles: true,
        startIndex: true,
        reversed: true,
      },
    },

    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: 'https://',
      decorators: {
        toggleDownloadable: {
          mode: 'manual',
          label: 'Downloadable',
          attributes: {
            download: 'file',
          },
        },
        openInNewTab: {
          mode: 'manual',
          label: 'Open in a new tab',
          defaultValue: true,
          attributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        },
      },
    },

    htmlSupport: {
      allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
    },

    style: {
      definitions: [
        { name: 'Article category', element: 'h3', classes: ['category'] },
        { name: 'Info box', element: 'p', classes: ['info-box'] },
      ],
    },
  };
  public ngAfterViewInit(): void {
    this.isLayoutReady = true;
    this.changeDetector.detectChanges();
  }
  writeValue(value: any): void {
    this.editorData = value || '';
    this.changeDetector.detectChanges();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onEditorChange(event: any) {
    const data = event.editor.getData();
    this.onChange(data);
    this.onTouched();
  }
}
