/**
 * Hook types
 */

export type UseFormReturnBase = {
  items: FormItem<FormItemType>[]
  isValid: boolean
  clearAll: () => void
  updateResponse: <FType extends FormItemType>(
    item: FormItem<FType>,
    response: Response<FType>,
  ) => void
}
export type UseFormReturnWithSteps<StepsDef extends StepsDefinition> =
  UseFormReturnBase & {
    stepItems: SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[]
    items: SteppedFormItem<StepIdentifiers<StepsDef>, FormItemType>[]
    currentStep: StepIdentifiers<StepsDef>
    currentStepIdx: number
    isFirstStep: boolean
    isLastStep: boolean
    completedSteps: StepIdentifiers<StepsDef>[]
    inProgressStep: StepIdentifiers<StepsDef>
    setCurrentStep: (step: StepIdentifiers<StepsDef>) => void
    next: () => void
    prev: () => void
    isStepValid: boolean
    clearStep: () => void
    stepClassName: string
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
}
export type StepsDefinition = readonly (
  | string
  | number
  | { id: string | number; className?: string; [key: string]: unknown }
)[]

type StepIdentifierExtractor<T extends StepsDefinition[number]> =
  T extends Record<string, unknown> ? T['id'] : T
export type StepIdentifiers<
  StepsDef extends StepsDefinition = StepsDefinition,
> = {
  [key in keyof StepsDef]: StepIdentifierExtractor<StepsDef[key]>
}[number]

type FormItemBase = {
  id: string
  contextLabel?: string
  label: string
  layout?: FormItemLayout
}

export type FormItem<T extends FormItemType = FormItemType> = FormItemBase &
  (
    | (T extends FormItemType.ShortText
        ? {
            type: FormItemType.ShortText
            placeholder?: string
            minLength?: number
            maxLength?: number
            value: string
          }
        : never)
    | (T extends FormItemType.Select
        ? {
            type: FormItemType.Select
            options: SelectOption[]
            value: SelectOption | null
          }
        : never)
    | (T extends FormItemType.DropdownSelect
        ? {
            type: FormItemType.DropdownSelect
            options: SelectOption[]
            value: SelectOption
          }
        : never)
    | (T extends FormItemType.Number
        ? {
            type: FormItemType.Number
            minValue?: number
            maxValue?: number
            value: number
          }
        : never)
    | (T extends FormItemType.Checkbox
        ? {
            type: FormItemType.Checkbox
            value: boolean
          }
        : never)
    | (T extends FormItemType.Heading
        ? {
            type: FormItemType.Heading
          }
        : never)
    | (T extends FormItemType.Collection
        ? {
            type: FormItemType.Collection
            minItems: number
            maxItems: number
            emptyLabel: string
            addLabel: string
            template: FormItem<CollectionFormItemTypes>[]
            value: FormItem<CollectionFormItemTypes>[][] | null
          }
        : never)
  )

export type CollectionFormItemTypes =
  | FormItemType.Checkbox
  | FormItemType.DropdownSelect
  | FormItemType.Number
  | FormItemType.ShortText

export type SteppedFormItem<
  StepsID extends StepIdentifiers,
  T extends FormItemType = FormItemType,
> = FormItem<T> & {
  step: StepsID
}

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
  ? number
  : T extends FormItemType.Checkbox
  ? boolean
  : T extends FormItemType.Collection
  ? FormItem<CollectionFormItemTypes>[][] | null
  : never

export interface SelectOption {
  label: string
  [key: string]: unknown
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

export type FormRenderer<FTypes extends FormItemType = FormItemType> = (props: {
  items: FormItem<FTypes>[]
  onChange: <T extends FTypes>(item: FormItem<T>, response: Response<T>) => void
  className?: string
  sizeResolution?: FormItemSize
}) => JSX.Element
