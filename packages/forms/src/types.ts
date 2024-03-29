/**
 * Hook types
 */

export type UseFormReturnBase = {
  items: FormItem[]
  values: FormValues
  isValid: boolean
  clearValues: () => void
  clearValueForItem: <FType extends FormItemType>(item: FormItem<FType>) => void
  updateValueForItem: <FType extends FormItemType>(
    item: FormItem<FType>,
    value: FormValue<FType>,
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
  Custom = 'Custom',
  Grid = 'Grid',
}

export type FormItemWithValue =
  | FormItemType.ShortText
  | FormItemType.Select
  | FormItemType.DropdownSelect
  | FormItemType.Number
  | FormItemType.Checkbox
  | FormItemType.Collection

export type FormItemWithoutValue = FormItemType.Grid | FormItemType.Custom

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
            optional?: boolean
            default?: string
          }
        : never)
    | (T extends FormItemType.Select
        ? {
            type: FormItemType.Select
            contextLabel?: string
            label: string
            options: SelectOption[]
            optional?: boolean
            default?: SelectOption
          }
        : never)
    | (T extends FormItemType.DropdownSelect
        ? {
            type: FormItemType.DropdownSelect
            contextLabel?: string
            label: string
            options: SelectOption[]
            default?: SelectOption
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
            optional?: boolean
            default?: number
          }
        : never)
    | (T extends FormItemType.Checkbox
        ? {
            type: FormItemType.Checkbox
            contextLabel?: string
            label: string
            default: boolean
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
            default?: FormValues<CollectionFormItemTypes>[]
            rowGridClassName?: string
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
            grid: FormItem[]
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
export type FormValue<T extends FormItemType> = T extends FormItemType.ShortText
  ? string | undefined
  : T extends FormItemType.Select
  ? SelectOption | undefined
  : T extends FormItemType.DropdownSelect
  ? SelectOption | undefined
  : T extends FormItemType.Number
  ? number | undefined
  : T extends FormItemType.Checkbox
  ? boolean
  : T extends FormItemType.Collection
  ? FormValues<CollectionFormItemTypes>[] | undefined
  : never

export interface SelectOption {
  label: string
  [key: string]: unknown
}

export type FormValues<T extends FormItemType = FormItemType> = {
  [id: string]: FormValue<T>
}

/**
 * Layout
 */
export type FormItemSizeBreakpoint = 'default' | 'sm' | 'md' | 'lg' | 'xl'
export type FormItemSizeNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
export type FormItemSize =
  | FormItemSizeNumber
  | { [k in FormItemSizeBreakpoint]?: FormItemSizeNumber }

interface FormItemLayout {
  size?: FormItemSize
  overlapLabel?: boolean
  className?: string
}

/**
 * Rederer
 */

export type CustomFormItemRenderer = (
  customItem: FormItem<FormItemType.Custom>,
) => JSX.Element | undefined | null | false
export type FormRenderer<FTypes extends FormItemType = FormItemType> = (props: {
  items: FormItem<FTypes>[]
  values: FormValues<FTypes>
  onChange: <T extends FTypes>(item: FormItem<T>, value: FormValue<T>) => void
  className?: string
  children?: CustomFormItemRenderer
}) => JSX.Element

/**
 * Misc
 */

export type ItemIdentifiers = (string | [string, string[]])[]
