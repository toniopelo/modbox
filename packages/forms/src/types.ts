/**
 * Hook types
 */

export type UseFormReturnBase = {
  items: FormItem<FormItemType>[]
  isValid: boolean
  responses: Responses
  clearAll: () => void
  updateResponse: <FType extends FormItemType>(
    item: FormItem<FType>,
    response: Response<FType>,
  ) => void
}

/**
 * FormItem base types
 */
export enum FormItemType {
  ShortText = 'ShortText',
  Select = 'Select',
  DropdownSelect = 'DropdownSelect',
  Number = 'Number',
  Checkbox = 'Checkbox',
  Collection = 'Collection',
  Heading = 'Heading',
  Custom = 'Custom',
  Grid = 'Grid',
}

type FormItemBase = {
  id: string
  layout?: FormItemLayout
}

export type FormItem<T extends FormItemType = FormItemType> = FormItemBase &
  (
    | (T extends FormItemType.ShortText
        ? {
            type: FormItemType.ShortText
            contextLabel?: string
            label: string
            placeholder?: string
            minLength?: number
            maxLength?: number
            value: string
          }
        : never)
    | (T extends FormItemType.Select
        ? {
            type: FormItemType.Select
            contextLabel?: string
            label: string
            options: SelectOption[]
            value: SelectOption | null
          }
        : never)
    | (T extends FormItemType.DropdownSelect
        ? {
            type: FormItemType.DropdownSelect
            contextLabel?: string
            label: string
            options: SelectOption[]
            value: SelectOption
          }
        : never)
    | (T extends FormItemType.Number
        ? {
            type: FormItemType.Number
            contextLabel?: string
            label: string
            placeholder?: string
            minValue?: number
            maxValue?: number
            value?: number
          }
        : never)
    | (T extends FormItemType.Checkbox
        ? {
            type: FormItemType.Checkbox
            contextLabel?: string
            label: string
            value: boolean
          }
        : never)
    | (T extends FormItemType.Heading
        ? {
            type: FormItemType.Heading
            contextLabel?: string
            label: string
          }
        : never)
    | (T extends FormItemType.Collection
        ? {
            type: FormItemType.Collection
            contextLabel?: string
            label: string
            minItems: number
            maxItems: number
            emptyLabel: string
            addLabel: string
            template: FormItem<CollectionFormItemTypes>[]
            value: FormItem<CollectionFormItemTypes>[][] | null
          }
        : never)
    | (T extends FormItemType.Custom
        ? {
            type: FormItemType.Custom
            rederer?: CustomFormItemRenderer
            [k: string]: unknown
          }
        : never)
    | (T extends FormItemType.Grid
        ? {
            type: FormItemType.Grid
            value: FormItem[]
          }
        : never)
  )

export type CollectionFormItemTypes =
  | FormItemType.Checkbox
  | FormItemType.DropdownSelect
  | FormItemType.Number
  | FormItemType.ShortText
  | FormItemType.Custom

/**
 * Values
 */
export type Response<T extends FormItemType> = T extends FormItemType.ShortText
  ? string
  : T extends FormItemType.Select
  ? SelectOption
  : T extends FormItemType.DropdownSelect
  ? SelectOption
  : T extends FormItemType.Number
  ? number | undefined
  : T extends FormItemType.Checkbox
  ? boolean
  : T extends FormItemType.Collection
  ? FormItem<CollectionFormItemTypes>[][] | null
  : T extends FormItemType.Grid
  ? FormItem[]
  : never

export interface SelectOption {
  label: string
  [key: string]: unknown
}

export type Responses<T extends FormItemType = FormItemType> = {
  [id: string]: T extends FormItemType.Grid
    ? never
    : T extends FormItemType.Collection
    ? Responses<CollectionFormItemTypes>[] | null
    : Response<T>
}

/**
 * Layout
 */
export type FormItemSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
interface FormItemLayout {
  minSize?: FormItemSize
  maxSize?: FormItemSize
  newLine?: boolean
  alone?: boolean
  overlapLabel?: boolean
  className?: string
  grouping?: {
    top?: boolean
    bottom?: boolean
    left?: boolean
    right?: boolean
    priority?: ('top' | 'bottom' | 'left' | 'right')[]
  }
}

/**
 * Rederer
 */

export type CustomFormItemRenderer = (
  customItem: FormItem<FormItemType.Custom>,
) => JSX.Element | undefined | null | false
export type FormRenderer<FTypes extends FormItemType = FormItemType> = (props: {
  items: FormItem<FTypes>[]
  onChange: <T extends FTypes>(item: FormItem<T>, response: Response<T>) => void
  className?: string
  sizeResolution?: FormItemSize
  children?: CustomFormItemRenderer
}) => JSX.Element
